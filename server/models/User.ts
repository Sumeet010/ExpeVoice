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
  id: 'guest',
  email: '',
  name: 'Guest',
  avatarUrl: '',
  homeCurrency: 'INR',
  authProvider: 'guest',
  monthlyBudget: 0,
  travelMode: false,
};
