import { ImapSettings } from '../types';

const providerMap: Record<string, ImapSettings> = {
  'hetzner.co.za': {
    imapHost: 'imap.hetzner.co.za',
    imapPort: 993,
    smtpHost: 'smtp.hetzner.co.za',
    smtpPort: 587,
    security: 'TLS',
  },
  'afrihost.co.za': {
    imapHost: 'imap.afrihost.co.za',
    imapPort: 993,
    smtpHost: 'smtp.afrihost.co.za',
    smtpPort: 587,
    security: 'TLS',
  },
  'domains.co.za': {
    imapHost: 'imap.domains.co.za',
    imapPort: 993,
    smtpHost: 'smtp.domains.co.za',
    smtpPort: 587,
    security: 'TLS',
  },
  'absolutehosting.co.za': {
    imapHost: 'mail.absolutehosting.co.za',
    imapPort: 993,
    smtpHost: 'mail.absolutehosting.co.za',
    smtpPort: 587,
    security: 'TLS',
  },
  'xneelo.co.za': {
    imapHost: 'imap.xneelo.co.za',
    imapPort: 993,
    smtpHost: 'smtp.xneelo.co.za',
    smtpPort: 587,
    security: 'TLS',
  },
  'webafrica.co.za': {
    imapHost: 'imap.webafrica.co.za',
    imapPort: 993,
    smtpHost: 'smtp.webafrica.co.za',
    smtpPort: 587,
    security: 'TLS',
  },
  'hosting.co.za': {
    imapHost: 'imap.hosting.co.za',
    imapPort: 993,
    smtpHost: 'smtp.hosting.co.za',
    smtpPort: 587,
    security: 'TLS',
  },
  'metrofibre.co.za': {
    imapHost: 'mail.metrofibre.co.za',
    imapPort: 993,
    smtpHost: 'mail.metrofibre.co.za',
    smtpPort: 587,
    security: 'TLS',
  },
};

export function detectImapSettings(email: string): ImapSettings {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain && providerMap[domain]) {
    return providerMap[domain];
  }

  return {
    imapHost: `imap.${domain}`,
    imapPort: 993,
    smtpHost: `smtp.${domain}`,
    smtpPort: 587,
    security: 'TLS',
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}