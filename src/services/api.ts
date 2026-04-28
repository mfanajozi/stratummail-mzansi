import axios from 'axios';
import { Account, Email, Folder, Signature, ImapSettings } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ValidateAccountParams {
  email: string;
  password: string;
}

export interface AddAccountParams {
  email: string;
  password: string;
  displayName: string;
  imapSettings: ImapSettings;
}

export interface SendEmailParams {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: File[];
}

export const accountService = {
  validate: async (params: ValidateAccountParams) => {
    const response = await api.post('/account/validate', params);
    return response.data as ImapSettings;
  },
  
  add: async (params: AddAccountParams) => {
    const response = await api.post('/account/add', params);
    return response.data as Account;
  },
  
  list: async () => {
    const response = await api.get('/accounts');
    return response.data as Account[];
  },
  
  remove: async (accountId: string) => {
    await api.delete(`/account/${accountId}`);
  },
};

export const emailService = {
  list: async (accountId: string, folder = 'INBOX', page = 1, limit = 50) => {
    const response = await api.get(`/emails/${accountId}`, {
      params: { folder, page, limit },
    });
    return response.data as Email[];
  },
  
  get: async (accountId: string, emailId: string) => {
    const response = await api.get(`/emails/${accountId}/${emailId}`);
    return response.data as Email;
  },
  
  send: async (params: SendEmailParams) => {
    const response = await api.post('/emails/send', params);
    return response.data;
  },
  
  markAsRead: async (accountId: string, emailId: string) => {
    await api.put(`/emails/${accountId}/${emailId}/read`);
  },
  
  markAsUnread: async (accountId: string, emailId: string) => {
    await api.put(`/emails/${accountId}/${emailId}/unread`);
  },
  
  delete: async (accountId: string, emailId: string) => {
    await api.delete(`/emails/${accountId}/${emailId}`);
  },
  
  move: async (accountId: string, emailId: string, folder: string) => {
    await api.put(`/emails/${accountId}/${emailId}/move`, { folder });
  },
};

export const folderService = {
  list: async (accountId: string) => {
    const response = await api.get(`/folders/${accountId}`);
    return response.data as Folder[];
  },
};

export const signatureService = {
  get: async (accountId: string) => {
    const response = await api.get(`/signature/${accountId}`);
    return response.data as Signature;
  },
  
  save: async (accountId: string, html: string) => {
    const response = await api.put(`/signature/${accountId}`, { html });
    return response.data as Signature;
  },
};

export default api;