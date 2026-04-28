import { ImapSettings } from '../types';

export function detectImapSettings(email: string): ImapSettings {
  const domain = email.split('@')[1]?.toLowerCase();
  
  return {
    imapHost: `mail.${domain}`,
    imapPort: 993,
    smtpHost: `mail.${domain}`,
    smtpPort: 465,
    security: 'SSL',
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}