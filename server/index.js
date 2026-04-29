import express from 'express';
import cors from 'cors';
import Imap from 'imap-simple';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'accounts.json');

function loadAccounts() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveAccounts(accountsMap) {
  const data = {};
  for (const [id, account] of accountsMap) data[id] = account;
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const accounts = new Map();
const foldersCache = new Map();
// emailsCache intentionally removed — was serving stale data indefinitely

// Load persisted accounts on startup
const stored = loadAccounts();
for (const [id, account] of Object.entries(stored)) accounts.set(id, account);
console.log(`Loaded ${accounts.size} account(s) from disk.`);

const buildImapConfig = (account) => ({
  imap: {
    user: account.email,
    password: account.password,
    host: account.imapHost,
    port: parseInt(account.imapPort),
    tls: account.security?.toLowerCase() === 'ssl',
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
  },
});

const getSmtpConfig = (account) => ({
  host: account.smtpHost,
  port: parseInt(account.smtpPort),
  secure: account.security?.toLowerCase() === 'ssl',
  auth: { user: account.email, pass: account.password },
  tls: { rejectUnauthorized: false },
});

async function connectImap(account) {
  return Imap.connect(buildImapConfig(account));
}

// Decode quoted-printable encoding
function decodeQP(str) {
  return str
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Extract the best readable body from a raw TEXT part
function extractBody(rawText) {
  if (!rawText) return '';
  let text = String(rawText);

  // If it contains MIME boundaries, try to extract the preferred part
  const boundaryMatch = text.match(/boundary=["']?([^"'\r\n;]+)["']?/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1].trim();
    const parts = text.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'));

    let htmlPart = '';
    let plainPart = '';

    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower.includes('content-type: text/html')) {
        htmlPart = stripMimeHeaders(part);
      } else if (lower.includes('content-type: text/plain')) {
        plainPart = stripMimeHeaders(part);
      }
    }

    // Prefer HTML, fall back to plain
    text = htmlPart || plainPart || text;
  }

  // Strip any leading MIME headers (lines like "Content-Type: ...\n\n")
  text = stripMimeHeaders(text);

  // Decode quoted-printable
  if (/=[0-9A-Fa-f]{2}/.test(text) || /=\r?\n/.test(text)) {
    text = decodeQP(text);
  }

  return text.trim();
}

function stripMimeHeaders(part) {
  // Remove MIME part headers (everything before the first blank line)
  const blankLine = part.search(/\r?\n\r?\n/);
  if (blankLine !== -1) {
    const header = part.substring(0, blankLine);
    // Only strip if it looks like MIME headers (has Content-Type etc.)
    if (/content-type|content-transfer-encoding|mime-version/i.test(header)) {
      return part.substring(blankLine).trim();
    }
  }
  return part;
}

function parseEmailHeaders(body) {
  const getHeader = (name) => {
    const val = body[name.toLowerCase()];
    return Array.isArray(val) ? val[0] : (val || '');
  };

  const parseAddress = (addr) => {
    if (!addr) return { name: '', address: '' };
    const match = addr.match(/^(.+?)\s*<(.+?)>$/);
    if (match) return { name: match[1].trim(), address: match[2].trim() };
    return { name: addr, address: addr };
  };

  const from = parseAddress(getHeader('from'));
  const toStr = getHeader('to');
  const to = toStr ? toStr.split(',').map((a) => parseAddress(a.trim())) : [];

  return {
    from,
    to,
    subject: getHeader('subject'),
    date: new Date(getHeader('date') || Date.now()),
  };
}

// ── Account endpoints ──────────────────────────────────────────────────────────

app.post('/api/account/validate', async (req, res) => {
  try {
    const { email, password } = req.body;
    const domain = email.split('@')[1].toLowerCase();
    const mailHost = `mail.${domain}`;

    const testAccount = { email, password, imapHost: mailHost, imapPort: 993, smtpHost: mailHost, smtpPort: 465, security: 'SSL' };
    const connection = await connectImap(testAccount);
    connection.end();

    res.json({ imapHost: mailHost, imapPort: 993, smtpHost: mailHost, smtpPort: 465, security: 'SSL' });
  } catch (error) {
    console.error('Validate error:', error.message);
    res.status(400).json({ error: 'Failed to connect. Check email and password.' });
  }
});

app.post('/api/account/add', async (req, res) => {
  try {
    const { email, password, displayName, imapSettings } = req.body;

    const accountId = Date.now().toString();
    const account = {
      id: accountId,
      email,
      password,
      displayName: displayName || email.split('@')[0],
      imapHost: imapSettings.imapHost,
      imapPort: imapSettings.imapPort,
      smtpHost: imapSettings.smtpHost,
      smtpPort: imapSettings.smtpPort,
      security: imapSettings.security,
      isDefault: accounts.size === 0,
      createdAt: new Date().toISOString(),
    };

    const connection = await connectImap(account);
    await connection.openBox('INBOX');
    connection.end();

    accounts.set(accountId, account);
    saveAccounts(accounts);

    // Don't cache folders here — let GET /api/folders/:accountId fetch real IMAP paths

    const { password: _pw, ...safeAccount } = account;
    res.json(safeAccount);
  } catch (error) {
    console.error('Add account error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/accounts', (req, res) => {
  const accountList = Array.from(accounts.values()).map(({ password: _pw, ...a }) => a);
  res.json(accountList);
});

app.patch('/api/account/:accountId', (req, res) => {
  const { accountId } = req.params;
  const account = accounts.get(accountId);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const { displayName } = req.body;
  if (displayName !== undefined) account.displayName = displayName;

  accounts.set(accountId, account);
  saveAccounts(accounts);

  const { password: _pw, ...safeAccount } = account;
  res.json(safeAccount);
});

app.delete('/api/account/:accountId', (req, res) => {
  const { accountId } = req.params;
  if (!accounts.has(accountId)) return res.status(404).json({ error: 'Account not found' });

  accounts.delete(accountId);
  saveAccounts(accounts);

  foldersCache.delete(accountId);

  res.json({ success: true });
});

// ── Folder endpoints ───────────────────────────────────────────────────────────

app.get('/api/folders/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = accounts.get(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    if (foldersCache.has(accountId)) return res.json(foldersCache.get(accountId));

    const connection = await connectImap(account);
    const boxes = await connection.getBoxes();

    const folders = [];
    const processBoxes = (boxMap, prefix = '') => {
      for (const [name, box] of Object.entries(boxMap)) {
        folders.push({
          id: prefix + name,
          name,
          path: prefix + name,
          unreadCount: 0,
          isSpecial: ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam', 'Junk'].includes(name),
        });
        if (box.children) processBoxes(box.children, prefix + name + box.delimiter);
      }
    };
    processBoxes(boxes);

    if (!folders.find((f) => f.id === 'INBOX')) {
      folders.unshift({ id: 'INBOX', name: 'Inbox', path: 'INBOX', unreadCount: 0, isSpecial: true });
    }

    foldersCache.set(accountId, folders);
    connection.end();
    res.json(folders);
  } catch (error) {
    console.error('Folders error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Email endpoints ────────────────────────────────────────────────────────────

app.get('/api/emails/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { folder = 'INBOX', page = 1, limit = 50 } = req.query;
    const account = accounts.get(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const pageNum = parseInt(page);

    const connection = await connectImap(account);
    await connection.openBox(folder);

    const messages = await connection.search(['ALL'], { bodies: ['HEADER'], markSeen: false });
    const pageSize = parseInt(limit);

    // Parse every header once so we can sort by the actual Date: field.
    // Sorting by IMAP sequence number is unreliable — emails can arrive out of
    // order, be moved between folders, or the server may return UIDs non-chronologically.
    const parsed = messages.map((msg) => {
      const headerPart = msg.parts.find((p) => p.which === 'HEADER');
      const headerObj = headerPart ? parseEmailHeaders(headerPart.body) : {};
      // new Date() with an RFC 2822 string preserves the sender's timezone offset
      // and stores as UTC internally, so comparisons are always correct.
      const date = headerObj.date instanceof Date ? headerObj.date : new Date(headerObj.date || 0);
      return { msg, headerObj, date };
    });

    // Sort newest first by real email date
    parsed.sort((a, b) => b.date.getTime() - a.date.getTime());

    const paginated = parsed.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    const emails = paginated.map(({ msg, headerObj, date }) => ({
      id: String(msg.attributes.uid),
      accountId,
      subject: headerObj.subject || '(No Subject)',
      from: headerObj.from || { name: '', address: '' },
      to: (headerObj.to || []).map((a) => (typeof a === 'string' ? a : a.address || a.name || '')),
      preview: '',
      body: '',
      date,
      isRead: msg.attributes.flags.includes('\\Seen'),
      isStarred: msg.attributes.flags.includes('\\Flagged'),
      hasAttachments: false,
      folder,
    }));

    connection.end();
    res.json(emails);
  } catch (error) {
    console.error('Fetch emails error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails/:accountId/:emailId', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    const { folder = 'INBOX' } = req.query;
    const account = accounts.get(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const connection = await connectImap(account);
    await connection.openBox(folder);

    const messages = await connection.search([['UID', emailId]], {
      bodies: ['HEADER', 'TEXT'],
      markSeen: false,
    });

    if (messages.length === 0) {
      connection.end();
      return res.status(404).json({ error: 'Email not found' });
    }

    const msg = messages[0];
    const headerPart = msg.parts.find((p) => p.which === 'HEADER');
    const textPart = msg.parts.find((p) => p.which === 'TEXT');
    const headerObj = headerPart ? parseEmailHeaders(headerPart.body) : {};
    const body = extractBody(textPart?.body);

    connection.end();
    res.json({
      id: String(msg.attributes.uid),
      accountId,
      subject: headerObj.subject || '(No Subject)',
      from: headerObj.from || { name: '', address: '' },
      to: (headerObj.to || []).map((a) => (typeof a === 'string' ? a : a.address || a.name || '')),
      preview: body.substring(0, 150),
      body,
      date: headerObj.date || new Date(),
      isRead: msg.attributes.flags.includes('\\Seen'),
      isStarred: msg.attributes.flags.includes('\\Flagged'),
      hasAttachments: false,
      folder,
    });
  } catch (error) {
    console.error('Get email error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emails/send', async (req, res) => {
  try {
    const { accountId, to, cc, bcc, subject, body, bodyHtml } = req.body;
    const account = accounts.get(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const transporter = nodemailer.createTransport(getSmtpConfig(account));
    await transporter.sendMail({
      from: account.email,
      to: to.join(', '),
      cc: cc?.join(', '),
      bcc: bcc?.join(', '),
      subject,
      text: body,
      html: bodyHtml,
    });
    transporter.close();

    res.json({ success: true });
  } catch (error) {
    console.error('Send email error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:accountId/:emailId/read', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    const { folder = 'INBOX' } = req.query;
    const account = accounts.get(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const connection = await connectImap(account);
    await connection.openBox(folder);
    await connection.addFlags(emailId, ['\\Seen']);
    connection.end();

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:accountId/:emailId/unread', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    const { folder = 'INBOX' } = req.query;
    const account = accounts.get(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const connection = await connectImap(account);
    await connection.openBox(folder);
    await connection.delFlags(emailId, ['\\Seen']);
    connection.end();

    res.json({ success: true });
  } catch (error) {
    console.error('Mark unread error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/emails/:accountId/:emailId', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    const { folder = 'INBOX' } = req.query;
    const account = accounts.get(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const connection = await connectImap(account);
    await connection.openBox(folder);
    await connection.moveMessage(emailId, 'Trash');
    connection.end();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete email error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:accountId/:emailId/move', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    const { folder: destFolder } = req.body;
    const { folder: srcFolder = 'INBOX' } = req.query;
    const account = accounts.get(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const connection = await connectImap(account);
    await connection.openBox(srcFolder);
    await connection.moveMessage(emailId, destFolder);
    connection.end();

    res.json({ success: true });
  } catch (error) {
    console.error('Move email error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`StratumMail API running on port ${PORT}`);
});
