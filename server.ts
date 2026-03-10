import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import yahooFinance from 'yahoo-finance2';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('database.sqlite');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    display_name TEXT
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    email TEXT,
    aum REAL,
    risk_profile TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
  CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

  CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    ticker TEXT,
    name TEXT,
    quantity REAL,
    average_price REAL,
    current_price REAL,
    currency TEXT,
    type TEXT,
    institution TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS theses (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    ticker TEXT,
    br_ticker TEXT,
    name TEXT,
    type TEXT,
    status TEXT,
    entry_price REAL,
    current_price REAL,
    target_price REAL,
    thesis TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS client_history (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    type TEXT,
    title TEXT,
    description TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id)
  );

  CREATE INDEX IF NOT EXISTS idx_client_history_client_id ON client_history(client_id);

  CREATE TABLE IF NOT EXISTS mailing_lists (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    type TEXT, -- 'clients', 'prospects', 'advisors', 'custom'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS mailing_list_contacts (
    id TEXT PRIMARY KEY,
    list_id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS search_history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    query TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed Database
const seed = () => {
  try {
    // Seed User
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@elitte.com');
    let userId = user ? user.id : 'demo-user';
    
    if (!user) {
      console.log('Seeding demo user...');
      db.prepare('INSERT INTO users (id, email, password, display_name) VALUES (?, ?, ?, ?)').run(
        userId, 'demo@elitte.com', 'demo123', 'Demo User'
      );
    }

    // Seed Clients
    const clients = [
      { id: '1', name: 'João Silva', email: 'joao@example.com', aum: 1500000, risk_profile: 'Moderado' },
      { id: '2', name: 'Maria Oliveira', email: 'maria@example.com', aum: 3200000, risk_profile: 'Agressivo' },
      { id: '3', name: 'Carlos Santos', email: 'carlos@example.com', aum: 850000, risk_profile: 'Conservador' },
    ];

    const insertClient = db.prepare(`
      INSERT OR IGNORE INTO clients (id, user_id, name, email, aum, risk_profile)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    clients.forEach(client => {
      insertClient.run(client.id, userId, client.name, client.email, client.aum, client.risk_profile);
    });

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seed();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post('/api/auth/signup', (req, res) => {
    const { email, password, display_name } = req.body;
    try {
      const id = crypto.randomUUID();
      const stmt = db.prepare('INSERT INTO users (id, email, password, display_name) VALUES (?, ?, ?, ?)');
      stmt.run(id, email, password, display_name);
      res.json({ user: { id, email, display_name } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const stmt = db.prepare('SELECT id, email, display_name FROM users WHERE email = ? AND password = ?');
    const user = stmt.get(email, password);
    if (user) {
      res.json({ user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/send-email', async (req, res) => {
    const { to, subject, content, type, clientId, title, description } = req.body;

    if (!to || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Configure transporter
      // In a real app, use process.env.SMTP_HOST, etc.
      // For this demo, we'll use a JSON transport to simulate sending if no creds are present
      const useRealMail = process.env.SMTP_HOST && process.env.SMTP_USER;
      
      const transporter = nodemailer.createTransport(
        (useRealMail 
          ? {
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || '587'),
              secure: false,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            }
          : {
              jsonTransport: true
            }) as any
      );

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Elitte Capital" <noreply@elittecapital.com>',
        to,
        subject,
        text: content,
        html: type === 'report' 
          ? `<div style="font-family: sans-serif; white-space: pre-wrap;">${content.replace(/\n/g, '<br>')}</div>` 
          : `<pre style="font-family: monospace;">${content}</pre>`
      };

      const info = await transporter.sendMail(mailOptions);

      if (!useRealMail) {
        console.log('--- EMAIL SIMULATION (JSON Transport) ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('---------------------------------------');
      }

      // Save to client history if clientId is provided
      if (clientId) {
        const historyId = crypto.randomUUID();
        const stmt = db.prepare('INSERT INTO client_history (id, client_id, type, title, description, content) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(historyId, clientId, 'EMAIL_SENT', title || subject, description || 'Email sent via Research', content);
      }

      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  app.get('/api/clients', (req, res) => {
    const { userId } = req.query;
    const stmt = db.prepare('SELECT * FROM clients WHERE user_id = ?');
    res.json(stmt.all(userId));
  });

  app.get('/api/clients/:id/history', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM client_history WHERE client_id = ? ORDER BY created_at DESC');
    res.json(stmt.all(id));
  });

  app.post('/api/clients/:id/history', (req, res) => {
    const { id } = req.params;
    const { type, title, description, content } = req.body;
    try {
      const historyId = crypto.randomUUID();
      const stmt = db.prepare('INSERT INTO client_history (id, client_id, type, title, description, content) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run(historyId, id, type, title, description, content);
      res.json({ success: true, id: historyId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/search-history', (req, res) => {
    const { userId } = req.query;
    try {
      const stmt = db.prepare('SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
      res.json(stmt.all(userId));
    } catch (error: any) {
      console.error('Error fetching search history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/portfolio/:name', (req, res) => {
    const { name } = req.params;
    // Mock portfolio data for the demo
    const portfolio = {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: 1250000.45,
      performanceMonth: 4.82,
      assets: [
        { ticker: 'PETR4.SA', symbol: 'PETR4', allocation: 25, performance: 12.4 },
        { ticker: 'VALE3.SA', symbol: 'VALE3', allocation: 20, performance: -2.1 },
        { ticker: 'ITUB4.SA', symbol: 'ITUB4', allocation: 18, performance: 5.6 },
        { ticker: 'WEGE3.SA', symbol: 'WEGE3', allocation: 15, performance: 8.9 },
        { ticker: 'AAPL', symbol: 'AAPL', allocation: 22, performance: 15.2 },
      ]
    };
    res.json(portfolio);
  });

  app.post('/api/search-history', (req, res) => {
    const { userId, query } = req.body;
    try {
      const id = crypto.randomUUID();
      const stmt = db.prepare('INSERT INTO search_history (id, user_id, query) VALUES (?, ?, ?)');
      stmt.run(id, userId, query);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mailing Lists API
  app.get('/api/mailing-lists', (req, res) => {
    const { userId } = req.query;
    const stmt = db.prepare('SELECT * FROM mailing_lists WHERE user_id = ? ORDER BY created_at DESC');
    const lists = stmt.all(userId);
    
    // Fetch contacts for each list
    const listsWithContacts = lists.map((list: any) => {
      const contacts = db.prepare('SELECT * FROM mailing_list_contacts WHERE list_id = ?').all(list.id);
      return { ...list, contacts };
    });
    
    res.json(listsWithContacts);
  });

  app.post('/api/mailing-lists', (req, res) => {
    const { userId, name, type } = req.body;
    try {
      const id = crypto.randomUUID();
      const stmt = db.prepare('INSERT INTO mailing_lists (id, user_id, name, type) VALUES (?, ?, ?, ?)');
      stmt.run(id, userId, name, type);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/mailing-lists/:id/contacts', (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    try {
      const contactId = crypto.randomUUID();
      const stmt = db.prepare('INSERT INTO mailing_list_contacts (id, list_id, name, email, phone) VALUES (?, ?, ?, ?, ?)');
      stmt.run(contactId, id, name, email, phone);
      res.json({ success: true, id: contactId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/mailing-lists/:listId/contacts/:contactId', (req, res) => {
    const { listId, contactId } = req.params;
    try {
      const stmt = db.prepare('DELETE FROM mailing_list_contacts WHERE id = ? AND list_id = ?');
      stmt.run(contactId, listId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/mailing-lists/:id', (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare('DELETE FROM mailing_lists WHERE id = ?');
      stmt.run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/market-data', async (req, res) => {
    let { ticker } = req.query;
    if (!ticker || typeof ticker !== 'string') {
      return res.status(400).json({ error: 'Ticker is required' });
    }
    
    const normalizedTicker = ticker.toUpperCase();

    // Fallback for demo purposes - check mock data first to avoid unnecessary API calls
    const mockData: Record<string, any> = {
      '^BVSP': { price: 128500.00, change: 450.00, changePercent: 0.35 },
      '^GSPC': { price: 5200.00, change: 15.00, changePercent: 0.29 },
      '^IXIC': { price: 16400.00, change: -20.00, changePercent: -0.12 },
      'BZ=F': { price: 85.50, change: 0.75, changePercent: 0.88 },
      'GC=F': { price: 2350.00, change: 12.00, changePercent: 0.51 },
      'BTC-USD': { price: 68000.00, change: 1200.00, changePercent: 1.80 },
      // Brazilian Stocks
      'PETR4.SA': { price: 41.50, change: 0.45, changePercent: 1.10 },
      'VALE3.SA': { price: 62.80, change: -0.30, changePercent: -0.48 },
      'ITUB4.SA': { price: 34.20, change: 0.15, changePercent: 0.44 },
      'BBAS3.SA': { price: 28.90, change: 0.10, changePercent: 0.35 },
      'WEGE3.SA': { price: 38.50, change: -0.20, changePercent: -0.52 },
      'CORWEAVE': { price: 150.00, change: 5.20, changePercent: 3.59 },
      'CRWV': { price: 150.00, change: 5.20, changePercent: 3.59 }
    };

    if (mockData[normalizedTicker]) {
       console.log(`Using mock data for ${normalizedTicker}`);
       return res.json(mockData[normalizedTicker]);
    }
    
    let finalTicker = normalizedTicker;
    // Auto-append .SA for Brazilian tickers if not present
    // Matches 4 letters followed by 1 or 2 digits (e.g. PETR4, VALE3, KLBN11)
    if (/^[A-Z]{4}\d{1,2}$/i.test(finalTicker)) {
      finalTicker = `${finalTicker}.SA`;
    }

    try {
      let result: any;
      try {
        result = await yahooFinance.quote(finalTicker);
      } catch (e: any) {
        // Fallback logic for instantiation issues
        if (e.message?.includes('new YahooFinance()') || e.name === 'TypeError') {
           try {
             const { default: YF } = await import('yahoo-finance2');
             const yfInstance = new (YF as any)(); 
             result = await yfInstance.quote(finalTicker);
           } catch (innerE) {
             console.warn('Yahoo Finance instantiation failed for market-data:', innerE);
             throw e;
           }
        } else {
           throw e;
        }
      }

      if (!result) throw new Error('No data returned');

      res.json({
        price: result.regularMarketPrice,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
      });
    } catch (error: any) {
      console.error(`Error fetching ${finalTicker}:`, error.message);
      
      // Generic fallback for other .SA stocks to prevent crashing
      if (finalTicker.endsWith('.SA')) {
          console.log(`Using generic mock data for ${finalTicker}`);
          return res.json({
              price: 25.00,
              change: 0.00,
              changePercent: 0.00
          });
      }

      res.status(500).json({ error: error.message });
    }
  });

// Cache for exchange rates: { [currency: string]: { data: any, timestamp: number } }
const exchangeRateCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour (increased from 10 mins)

// Circuit Breaker for AwesomeAPI
let awesomeApiBlockedUntil = 0;
const AWESOME_API_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  app.get('/api/exchange-rate', async (req, res) => {
    let { currency } = req.query;
    if (!currency || typeof currency !== 'string') {
      return res.status(400).json({ error: 'Currency is required' });
    }
    
    const currencyKey = currency.toUpperCase();

    // Check Cache
    const cached = exchangeRateCache.get(currencyKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return res.json(cached.data);
    }

    // 1. Try AwesomeAPI (if not blocked)
    if (Date.now() > awesomeApiBlockedUntil) {
      try {
        const pair = `${currencyKey}-BRL`;
        const response = await fetch(`https://economia.awesomeapi.com.br/last/${pair}`);
        
        if (response.status === 429) {
          throw new Error('429 Too Many Requests');
        }
        
        if (!response.ok) {
          throw new Error(`AwesomeAPI returned ${response.status}`);
        }
        
        const data = await response.json();
        const key = `${currencyKey}BRL`;
        
        if (data[key]) {
          const result = {
            price: parseFloat(data[key].bid),
            name: data[key].name,
            high: parseFloat(data[key].high),
            low: parseFloat(data[key].low),
            pctChange: parseFloat(data[key].pctChange)
          };
          exchangeRateCache.set(currencyKey, { data: result, timestamp: Date.now() });
          return res.json(result);
        }
      } catch (primaryError: any) {
        // Log as info/warn depending on error type to reduce noise
        if (primaryError.message.includes('429')) {
          console.log(`AwesomeAPI rate limit for ${currencyKey}. Switching to fallback.`);
          awesomeApiBlockedUntil = Date.now() + AWESOME_API_BLOCK_DURATION;
        } else {
          console.warn(`AwesomeAPI failed for ${currencyKey}: ${primaryError.message}`);
        }
      }
    }

    // 2. Fallback: Yahoo Finance
    try {
      const tickerMap: Record<string, string> = { 
        'USD': 'BRL=X', 
        'EUR': 'EURBRL=X', 
        'CHF': 'CHFBRL=X' 
      };
      
      const ticker = tickerMap[currencyKey];
      if (ticker) {
        let result;
        try {
          result = await yahooFinance.quote(ticker) as any;
        } catch (e: any) {
          // Attempt to instantiate if default export fails
          if (e.message?.includes('new YahooFinance()') || e.name === 'TypeError') {
             try {
               // Dynamic import to bypass potential ESM/CJS issues
               const { default: YF } = await import('yahoo-finance2');
               const yfInstance = new (YF as any)(); 
               result = await yfInstance.quote(ticker);
             } catch (innerE) {
               console.warn('Yahoo Finance instantiation failed:', innerE);
             }
          } else {
            throw e;
          }
        }
        
        if (result && result.regularMarketPrice) {
          const finalResult = {
            price: result.regularMarketPrice,
            name: `${currencyKey}/BRL`,
            high: result.regularMarketDayHigh,
            low: result.regularMarketDayLow,
            pctChange: result.regularMarketChangePercent
          };
          exchangeRateCache.set(currencyKey, { data: finalResult, timestamp: Date.now() });
          return res.json(finalResult);
        }
      }
    } catch (fallbackError: any) {
      console.warn(`Yahoo Finance failed for ${currencyKey}:`, fallbackError.message);
    }

    // 3. Safety Net (Hardcoded values to prevent app breakage)
    const safetyNet: Record<string, number> = { 
      'USD': 5.75, 
      'EUR': 6.05, 
      'CHF': 6.35 
    };

    if (safetyNet[currencyKey]) {
      console.log(`Using safety net value for ${currencyKey}`);
      const result = {
        price: safetyNet[currencyKey],
        name: `${currencyKey}/BRL (Estimado)`,
        high: safetyNet[currencyKey] * 1.01,
        low: safetyNet[currencyKey] * 0.99,
        pctChange: 0
      };
      // Cache this for a shorter time (1 min) to retry sooner
      exchangeRateCache.set(currencyKey, { data: result, timestamp: Date.now() - (CACHE_TTL - 60000) });
      return res.json(result);
    }

    res.status(500).json({ error: 'Failed to fetch exchange rate from all sources' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
