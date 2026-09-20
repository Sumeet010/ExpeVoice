import fs from 'fs';
import path from 'path';
import { getMongoDb, isMongoConnected, getMongoDbStatus } from '../config/db';
import { IExpenseDocument } from '../models/Expense';
import { IBudgetDocument, DEFAULT_BUDGET_TEMPLATES } from '../models/Budget';
import { IUserDocument, DEFAULT_USER } from '../models/User';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const BUDGETS_FILE = path.join(DATA_DIR, 'budgets.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return fallback;
}

function writeJsonFile(filePath: string, data: any): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
  }
}

export class DatabaseService {
  // ==================== CLEANUP SEED DATA ====================
  static async purgeLegacySeedData(): Promise<void> {
    const mongoDb = getMongoDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const expensesCol = mongoDb.collection<IExpenseDocument>('expenses');
        await expensesCol.deleteMany({
          $or: [
            { id: { $regex: /^exp-seed/ } },
            { id: 'exp-seed-2' },
            { id: 'exp-seed-3' },
            { id: 'exp-seed-4' },
            { id: 'exp-seed-5' },
            { id: 'exp-seed-6' },
          ],
        });
      } catch (err) {
        console.warn('MongoDB seed purge error:', err);
      }
    }

    // Also clean local JSON cache file
    const local = readJsonFile<IExpenseDocument[]>(EXPENSES_FILE, []);
    const cleaned = local.filter((e) => !e.id.startsWith('exp-seed-'));
    writeJsonFile(EXPENSES_FILE, cleaned);
  }

  // ==================== EXPENSES ====================

  static async getAllExpenses(userId?: string): Promise<IExpenseDocument[]> {
    const mongoDb = getMongoDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IExpenseDocument>('expenses');
        const query: any = {};
        if (userId) {
          if (userId === 'guest') {
            query.$or = [{ userId: 'guest' }, { userId: { $exists: false } }, { userId: null }, { userId: '' }];
          } else {
            query.userId = userId;
          }
        }
        // Exclude any legacy seed items
        query.id = { $not: { $regex: /^exp-seed/ } };

        return await collection.find(query).sort({ date: -1, createdAt: -1 }).toArray();
      } catch (err) {
        console.warn('MongoDB query failed, falling back to local store:', err);
      }
    }

    // Local fallback store
    const local = readJsonFile<IExpenseDocument[]>(EXPENSES_FILE, []);
    const cleanLocal = local.filter((e) => !e.id.startsWith('exp-seed-'));
    if (userId) {
      if (userId === 'guest') {
        return cleanLocal.filter((e) => !e.userId || e.userId === 'guest');
      }
      return cleanLocal.filter((e) => e.userId === userId);
    }
    return cleanLocal;
  }

  static async saveExpense(expense: IExpenseDocument): Promise<IExpenseDocument> {
    const mongoDb = getMongoDb();
    const { _id, ...expenseData } = expense as any;
    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IExpenseDocument>('expenses');
        await collection.updateOne(
          { id: expense.id },
          { $set: { ...expenseData, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        return expense;
      } catch (err) {
        console.warn('MongoDB save failed, using local store:', err);
      }
    }

    // Fallback to local store only when MongoDB is disconnected or fails
    const local = readJsonFile<IExpenseDocument[]>(EXPENSES_FILE, []);
    const idx = local.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...expense, updatedAt: new Date().toISOString() };
    } else {
      local.unshift(expense);
    }
    writeJsonFile(EXPENSES_FILE, local);
    return expense;
  }

  static async deleteExpense(id: string): Promise<boolean> {
    const mongoDb = getMongoDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IExpenseDocument>('expenses');
        await collection.deleteOne({ id });
        return true;
      } catch (err) {
        console.warn('MongoDB delete failed:', err);
      }
    }

    const local = readJsonFile<IExpenseDocument[]>(EXPENSES_FILE, []);
    const filtered = local.filter((e) => e.id !== id);
    writeJsonFile(EXPENSES_FILE, filtered);
    return true;
  }

  // ==================== BUDGETS ====================

  static async getAllBudgets(userId?: string): Promise<IBudgetDocument[]> {
    const mongoDb = getMongoDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IBudgetDocument>('budgets');
        const query: any = userId
          ? userId === 'guest'
            ? { $or: [{ userId: 'guest' }, { userId: 'default' }, { userId: { $exists: false } }, { userId: null }, { userId: '' }] }
            : { userId }
          : {};
        const found = await collection.find(query).toArray();
        if (found.length > 0) {
          return found;
        }
        // If user has no custom budgets yet, provide default clean templates
        const initialUserBudgets = DEFAULT_BUDGET_TEMPLATES.map((b) => ({
          ...b,
          userId: userId || 'default',
          currentSpent: 0,
        }));
        await collection.insertMany(initialUserBudgets as any);
        return initialUserBudgets;
      } catch (err) {
        console.warn('MongoDB budgets query failed:', err);
      }
    }

    const local = readJsonFile<IBudgetDocument[]>(BUDGETS_FILE, []);
    if (userId) {
      const userBudgets = local.filter((b) => b.userId === userId || (userId === 'guest' && (!b.userId || b.userId === 'default')));
      if (userBudgets.length > 0) return userBudgets;
    } else if (local.length > 0) {
      return local;
    }

    const initial = DEFAULT_BUDGET_TEMPLATES.map((b) => ({
      ...b,
      userId: userId || 'default',
      currentSpent: 0,
    }));
    writeJsonFile(BUDGETS_FILE, initial);
    return initial;
  }

  static async saveBudgets(budgets: IBudgetDocument[], userId?: string): Promise<IBudgetDocument[]> {
    const mongoDb = getMongoDb();
    const prepared = budgets.map((b) => ({
      ...b,
      userId: b.userId || userId || 'default',
      updatedAt: new Date().toISOString(),
    }));

    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IBudgetDocument>('budgets');
        for (const budget of prepared) {
          const { _id, ...budgetData } = budget as any;
          await collection.updateOne(
            { category: budget.category, userId: budget.userId },
            { $set: budgetData },
            { upsert: true }
          );
        }
        return prepared;
      } catch (err) {
        console.warn('MongoDB budgets update failed:', err);
      }
    }

    writeJsonFile(BUDGETS_FILE, prepared);
    return prepared;
  }

  // ==================== USERS & AUTH ====================

  static async getUserById(userId: string): Promise<IUserDocument | null> {
    const mongoDb = getMongoDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IUserDocument>('users');
        const user = await collection.findOne({ id: userId });
        if (user) return user;
      } catch (err) {
        console.warn('MongoDB find user failed:', err);
      }
    }

    const users = readJsonFile<IUserDocument[]>(USERS_FILE, []);
    return users.find((u) => u.id === userId) || null;
  }

  static async getUserByEmail(email: string): Promise<IUserDocument | null> {
    const mongoDb = getMongoDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IUserDocument>('users');
        const user = await collection.findOne({ email });
        if (user) return user;
      } catch (err) {
        console.warn('MongoDB find user by email failed:', err);
      }
    }

    const users = readJsonFile<IUserDocument[]>(USERS_FILE, []);
    return users.find((u) => u.email === email) || null;
  }

  static async getUserByToken(token: string): Promise<IUserDocument | null> {
    const mongoDb = getMongoDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IUserDocument>('users');
        const user = await collection.findOne({ token });
        if (user) return user;
      } catch (err) {
        console.warn('MongoDB find user by token failed:', err);
      }
    }

    const users = readJsonFile<IUserDocument[]>(USERS_FILE, []);
    return users.find((u) => u.token === token) || null;
  }

  static async saveUser(user: IUserDocument): Promise<IUserDocument> {
    const mongoDb = getMongoDb();
    const { _id, ...userData } = user as any;
    if (mongoDb && isMongoConnected()) {
      try {
        const collection = mongoDb.collection<IUserDocument>('users');
        await collection.updateOne(
          { email: user.email },
          { $set: { ...userData, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        return user;
      } catch (err) {
        console.warn('MongoDB save user failed:', err);
      }
    }

    const users = readJsonFile<IUserDocument[]>(USERS_FILE, []);
    const idx = users.findIndex((u) => u.email === user.email);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user, updatedAt: new Date().toISOString() };
    } else {
      users.push(user);
    }
    writeJsonFile(USERS_FILE, users);
    return user;
  }

  // ==================== DATABASE HEALTH & STATUS ====================

  static async getFullStatus() {
    const status = getMongoDbStatus();
    const expenses = await this.getAllExpenses();
    const budgets = await this.getAllBudgets();
    const users = readJsonFile<IUserDocument[]>(USERS_FILE, [DEFAULT_USER]);

    return {
      database: {
        engine: 'MongoDB',
        connected: status.connected,
        uriConfigured: status.uriConfigured,
        databaseName: status.dbName,
        statusText: status.connected
          ? 'Connected to MongoDB Cluster'
          : status.error
          ? `MongoDB Connection Failed: ${status.error}`
          : 'MongoDB Ready (Configurable via MONGODB_URI)',
        error: status.error,
        collections: {
          expenses: { name: 'expenses', count: expenses.length },
          budgets: { name: 'budgets', count: budgets.length },
          users: { name: 'users', count: users.length },
        },
        connectionDetails: {
          target: status.uriConfigured ? 'Remote MongoDB / Atlas' : 'Local MongoDB Store',
          localStorageUsage: 'Currency Rates API Cache Only (Strictly Offline FX Conversion)',
        },
      },
    };
  }
}
