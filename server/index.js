import express from 'express';
import cors from 'cors';
import Imap from 'imap-simple';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const accounts = new Map();
const emailsCache = new Map();
const foldersCache = new Map();

const getImapConfig = (account) => ({
  user: account.email,
  password: account.password,
  host: account.imapHost,
  port: parseInt(account.imapPort),
  tls: account.security === 'ssl',
  tlsOptions: { rejectUnauthorized: false }
});

const getSmtpConfig = (account) => ({
  host: account.smtpHost,
  port: parseInt(account.smtpPort),
  secure: account.security === 'ssl',
  auth: {
    user: account.email,
    pass: account.password
  },
  tls: { rejectUnauthorized: false }
});

async function connectImap(account) {
  const config = getImapConfig(account);
  const connection = await Imap.connect(config);
  return connection;
}

function parseEmailHeaders(headers) {
  const getHeader = (name) => {
    const header = headers.find(h => h[0].toLowerCase() === name.toLowerCase());
    return header ? header[1] : '';
  };

  const parseAddress = (addr) => {
    if (!addr) return { name: '', address: '' };
    const match = addr.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim(), address: match[2].trim() };
    }
    return { name: addr, address: addr };
  };

  const from = parseAddress(getHeader('from'));
  const to = getHeader('to') ? getHeader('to').split(',').map(a => parseAddress(a.trim())) : [];

  return {
    from,
    to,
    subject: getHeader('subject'),
    date: new Date(getHeader('date') || Date.now()),
  };
}

function parseEmailBody(part, connection) {
  return new Promise((resolve) => {
    const fetch = connection.imap.fetch(part.which, {
      bodies: [part.which],
      struct: true
    });

    fetch.on('message', (msg) => {
      msg.on('body', (stream) => {
        let buffer = '';
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });
        stream.on('end', () => {
          resolve(buffer);
        });
      });
    });

    fetch.once('error', () => resolve(''));
  });
}

app.post('/api/account/validate', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const domain = email.split('@')[1].toLowerCase();
    const mailHost = `mail.${domain}`;
    const imapPort = 993;
    const smtpPort = 465;
    const security = 'ssl';

    const testAccount = { email, password, imapHost: mailHost, imapPort, smtpHost: mailHost, smtpPort, security };
    await connectImap(testAccount);

    res.json({ imapHost: mailHost, imapPort, smtpHost: mailHost, smtpPort, security });
  } catch (error) {
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
      isDefault: true,
      createdAt: new Date()
    };

    accounts.set(accountId, account);

    const connection = await connectImap(account);
    await connection.openBox('INBOX');
    
    foldersCache.set(accountId, [
      { id: 'INBOX', name: 'Inbox', path: 'INBOX' },
      { id: 'Sent', name: 'Sent', path: 'Sent' },
      { id: 'Drafts', name: 'Drafts', path: 'Drafts' },
      { id: 'Trash', name: 'Trash', path: 'Trash' },
      { id: 'Spam', name: 'Spam', path: 'Spam' }
    ]);
    
    connection.end();

    res.json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/accounts', (req, res) => {
  const accountList = Array.from(accounts.values()).map(a => ({
    ...a,
    password: '***'
  }));
  res.json(accountList);
});

app.get('/api/folders/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = accounts.get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (foldersCache.has(accountId)) {
      return res.json(foldersCache.get(accountId));
    }

    const connection = await connectImap(account);
    const boxes = await connection.getBoxes();
    
    const folders = [];
    const processBoxes = (boxes, prefix = '') => {
      for (const [name, box] of Object.entries(boxes)) {
        if (name !== 'INBOX') {
          folders.push({
            id: prefix + name,
            name: name,
            path: prefix + name
          });
        }
        if (box.children) {
          processBoxes(box.children, prefix + name + '/');
        }
      }
    };
    
    processBoxes(boxes);
    folders.unshift({ id: 'INBOX', name: 'Inbox', path: 'INBOX' });
    
    foldersCache.set(accountId, folders);
    connection.end();

    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { folder = 'INBOX', page = 1, limit = 50 } = req.query;
    const account = accounts.get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const cacheKey = `${accountId}-${folder}-${page}`;
    if (emailsCache.has(cacheKey) && page === 1) {
      return res.json(emailsCache.get(cacheKey));
    }

    const connection = await connectImap(account);
    await connection.openBox(folder);

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: false
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const start = (page - 1) * limit;
    const paginatedMessages = messages.slice(start, start + parseInt(limit));

    const emails = await Promise.all(paginatedMessages.map(async (msg) => {
      const headers = msg.parts.filter(p => p.which === 'HEADER')[0];
      const headerObj = headers ? parseEmailHeaders(headers.body) : {};
      
      return {
        id: msg.attributes.uid,
        accountId,
        subject: headerObj.subject || '(No Subject)',
        from: headerObj.from,
        to: headerObj.to,
        preview: '',
        body: '',
        date: headerObj.date,
        isRead: !msg.attributes.flags.includes('\\Seen'),
        isStarred: msg.attributes.flags.includes('\\Flagged'),
        hasAttachments: msg.attributes.structure?.find(p => p.disposition?.type === 'attachment') ? true : false,
        folder
      };
    }));

    emailsCache.set(cacheKey, emails);
    connection.end();

    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails/:accountId/:emailId', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    const { folder = 'INBOX' } = req.query;
    const account = accounts.get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const connection = await connectImap(account);
    await connection.openBox(folder);

    const searchCriteria = ['UID', parseInt(emailId)];
    const fetchOptions = {
      bodies: ['', 'HEADER', 'TEXT'],
      markSeen: false
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    if (messages.length === 0) {
      connection.end();
      return res.status(404).json({ error: 'Email not found' });
    }

    const msg = messages[0];
    const headerPart = msg.parts.filter(p => p.which === 'HEADER')[0];
    const textPart = msg.parts.filter(p => p.which === 'TEXT')[0];
    const bodyPart = msg.parts.filter(p => p.which === '')[0];

    const headerObj = headerPart ? parseEmailHeaders(headerPart.body) : {};
    
    let body = '';
    if (bodyPart) {
      body = await parseEmailBody({ which: '' }, connection);
    } else if (textPart) {
      body = textPart.body;
    }

    const email = {
      id: msg.attributes.uid,
      accountId,
      subject: headerObj.subject || '(No Subject)',
      from: headerObj.from,
      to: headerObj.to,
      preview: body.substring(0, 150),
      body: body,
      date: headerObj.date,
      isRead: !msg.attributes.flags.includes('\\Seen'),
      isStarred: msg.attributes.flags.includes('\\Flagged'),
      hasAttachments: false,
      folder
    };

    connection.end();
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emails/send', async (req, res) => {
  try {
    const { accountId, to, cc, bcc, subject, body, bodyHtml, attachments } = req.body;
    const account = accounts.get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const transporter = nodemailer.createTransport(getSmtpConfig(account));

    const mailOptions = {
      from: account.email,
      to: to.join(', '),
      cc: cc?.join(', '),
      bcc: bcc?.join(', '),
      subject,
      text: body,
      html: bodyHtml
    };

    await transporter.sendMail(mailOptions);
    transporter.close();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:accountId/:emailId/read', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    const account = accounts.get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const connection = await connectImap(account);
    await connection.openBox('INBOX');
    
    await connection.moveMessage(emailId, 'INBOX');
    connection.end();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/emails/:accountId/:emailId', async (req, res) => {
  try {
    const { accountId, emailId } = req.params;
    const { folder = 'INBOX' } = req.query;
    const account = accounts.get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const connection = await connectImap(account);
    await connection.openBox(folder);
    
    await connection.moveMessage(emailId, 'Trash');
    connection.end();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`StratumMail API running on port ${PORT}`);
});