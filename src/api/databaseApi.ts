import { request } from './apiClient';

export interface MongoDatabaseStatus {
  database: {
    engine: string;
    connected: boolean;
    uriConfigured: boolean;
    databaseName: string;
    statusText: string;
    error?: string | null;
    collections: {
      expenses: { name: string; count: number };
      budgets: { name: string; count: number };
      users: { name: string; count: number };
    };
    connectionDetails: {
      target: string;
      localStorageUsage: string;
    };
  };
}

export const databaseApi = {
  async getStatus(): Promise<MongoDatabaseStatus> {
    return await request<MongoDatabaseStatus>('/api/database/status');
  },

  async getInfo(): Promise<any> {
    return await request<any>('/api/database/info');
  },

  async reconnect(): Promise<MongoDatabaseStatus> {
    return await request<MongoDatabaseStatus>('/api/database/reconnect', {
      method: 'POST',
    });
  },
};
