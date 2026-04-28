export interface Account {
  id: string;
  email: string;
  displayName: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  security: 'SSL' | 'TLS' | 'STARTLS';
  isDefault: boolean;
  createdAt: Date;
}

export interface Email {
  id: string;
  accountId: string;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  to: string[];
  cc?: string[];
  bcc?: string[];
  preview: string;
  body: string;
  bodyHtml?: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  folder: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  unreadCount: number;
  isSpecial: boolean;
}

export interface Signature {
  id: string;
  accountId: string;
  html: string;
  isDefault: boolean;
}

export interface ImapSettings {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  security: 'SSL' | 'TLS' | 'STARTLS';
}