import { ObjectId } from 'mongodb';

export interface IUserDocument {
  _id?: ObjectId;
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  homeCurrency: string;
  authProvider: 'google' | 'local' | 'guest';
  monthlyBudget: number;
  travelMode: boolean;
  token?: string;
  googleSub?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_USER: IUserDocument = {
  id: 'user-default-1',
  email: 'sadhanagupta0324@gmail.com',
  name: 'Sadhana Gupta',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  homeCurrency: 'INR',
  authProvider: 'google',
  monthlyBudget: 75000,
  travelMode: true,
  lastLoginAt: new Date().toISOString(),
};
