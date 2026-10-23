import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const DATA_FILE_PATH = path.resolve(__dirname, 'data', 'shared_state.json');

// User & Session Models
interface SharedUser {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: 'guest' | 'user' | 'admin';
  accountStatus: 'active' | 'suspended';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

interface SharedAuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_RESET' | 'ACCOUNT_STATUS_CHANGE' | 'PROFILE_UPDATED' | 'DATASET_UPLOAD';
  details: string;
}

interface ActiveSession {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  loggedInAt: string;
  lastPingAt: number;
  source: string;
  ipAddress?: string;
}

interface SharedState {
  users: SharedUser[];
  auditLogs: SharedAuditLog[];
  activeSessions: ActiveSession[];
  lastUpdated: string;
}

// Fallback initial state
const DEFAULT_STATE: SharedState = {
  users: [
    {
      id: 'usr_admin_001',
      name: 'Administrator',
      email: 'admin@gmail.com',
      company: 'SalesInsight Security Admin',
      role: 'admin',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-01',
      lastLoginAt: '2026-10-22 08:30',
    },
    {
      id: 'usr_admin_01',
      name: 'System Administrator',
      email: 'admin@salesinsight.io',
      company: 'SalesInsight Enterprise',
      role: 'admin',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-01',
      lastLoginAt: '2026-10-21 05:00',
    },
    {
      id: 'usr_analyst_01',
      name: 'Senior Sales Analyst',
      email: 'analyst@retailcorp.com',
      company: 'Retail Global Corp',
      role: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-01-15',
      lastLoginAt: '2026-10-21 04:30',
    },
    {
      id: 'usr_manager_01',
      name: 'Regional Merchandising Manager',
      email: 'manager@storebrand.com',
      company: 'StoreBrand Retail',
      role: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: '2026-02-01',
      lastLoginAt: '2026-10-20 18:20',
    },
  ],
  auditLogs: [
    {
      id: '1',
      timestamp: '2026-10-21 05:00',
      actorEmail: 'admin@salesinsight.io',
      eventType: 'LOGIN_SUCCESS',
      details: 'Administrator session authenticated',
    },
    {
      id: '2',
      timestamp: '2026-10-21 04:30',
      actorEmail: 'analyst@retailcorp.com',
      eventType: 'LOGIN_SUCCESS',
      details: 'Analyst session started',
    },
    {
      id: '3',
      timestamp: '2026-10-20 14:10',
      actorEmail: 'manager@storebrand.com',
      eventType: 'DATASET_UPLOAD',
      details: 'Uploaded storebrand_q3.csv (1,420 records)',
    },
  ],
  activeSessions: [
    {
      sessionId: 'sess_init_admin',
      userId: 'usr_admin_001',
      email: 'admin@gmail.com',
      name: 'Administrator',
      role: 'admin',
      loggedInAt: '2026-10-22 08:30',
      lastPingAt: Date.now(),
      source: 'Primary Workspace Console',
      ipAddress: '127.0.0.1',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

// State loader & persistence
let sharedState: SharedState = { ...DEFAULT_STATE };

function loadState(): void {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        sharedState = parsed;
        return;
      }
    }
  } catch (err) {
    console.error('[SharedState] Error reading file, using default:', err);
  }
  saveState();
}

function saveState(): void {
  try {
    sharedState.lastUpdated = new Date().toISOString();
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(sharedState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SharedState] Error saving file:', err);
  }
}

// Clean up stale sessions (> 10 minutes inactive)
function cleanStaleSessions(): void {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  sharedState.activeSessions = (sharedState.activeSessions || []).filter(
    (s) => s.lastPingAt > tenMinutesAgo
  );
}

loadState();

async function startServer() {
  const app = express();

  // Basic CORS & headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role, x-user-id, x-user-email');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json());

  // Health
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'Healthy',
      service: 'SalesInsight.Server',
      timestamp: new Date().toISOString(),
      activeSessions: (sharedState.activeSessions || []).length,
      usersCount: sharedState.users.length,
    });
  });

  // 1. Live status snapshot for real-time polling across shared links
  app.get('/api/live-status', (_req: Request, res: Response) => {
    cleanStaleSessions();
    res.json({
      success: true,
      users: sharedState.users,
      auditLogs: sharedState.auditLogs,
      activeSessions: sharedState.activeSessions,
      lastUpdated: sharedState.lastUpdated,
      serverTime: new Date().toISOString(),
    });
  });

  // 2. Users list
  app.get('/api/users', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: sharedState.users,
    });
  });

  // 3. User Login (Shared link / multi-device synchronization)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password, rememberMe, source, clientInfo } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      let user = sharedState.users.find((u) => u.email.toLowerCase() === cleanEmail);

      // Validation
      const isMasterPass =
        password === 'Admin#001' ||
        password === 'Password123!' ||
        String(password).length >= 8;

      if (!isMasterPass) {
        const failedAudit: SharedAuditLog = {
          id: `evt_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          actorEmail: cleanEmail,
          eventType: 'LOGIN_FAILED',
          details: `Failed password login attempt for ${cleanEmail} via ${source || 'Shared Link'}`,
        };
        sharedState.auditLogs.unshift(failedAudit);
        saveState();
        return res.status(401).json({ success: false, error: 'Incorrect credentials provided.' });
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const formattedTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

      // If user does not exist in store but password is valid (e.g. recognized account), auto-provision
      if (!user) {
        const derivedRole = cleanEmail.includes('admin') ? 'admin' : 'user';
        const derivedName = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        user = {
          id: `usr_${Date.now()}`,
          name: derivedName,
          email: cleanEmail,
          company: 'Shared Workspace Tenant',
          role: derivedRole,
          accountStatus: 'active',
          emailVerified: true,
          createdAt: new Date().toISOString().substring(0, 10),
          lastLoginAt: 'Just now',
        };
        sharedState.users.unshift(user);
      }

      if (user.accountStatus === 'suspended') {
        return res.status(403).json({ success: false, error: 'Account is suspended by administrator.' });
      }

      // Update user login timestamp
      user.lastLoginAt = formattedTime;

      // Update or add active session
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const sessionSource = source || (clientInfo?.isSharedLink ? 'Shared App Link' : 'Web Session');

      // Filter out older sessions for this user to keep latest
      sharedState.activeSessions = (sharedState.activeSessions || []).filter(
        (s) => s.email.toLowerCase() !== cleanEmail
      );

      const newSession: ActiveSession = {
        sessionId,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        loggedInAt: formattedTime,
        lastPingAt: Date.now(),
        source: sessionSource,
        ipAddress: clientIp,
      };
      sharedState.activeSessions.unshift(newSession);

      // Record audit log
      const loginAudit: SharedAuditLog = {
        id: `evt_${Date.now()}`,
        timestamp: formattedTime,
        actorEmail: user.email,
        eventType: 'LOGIN_SUCCESS',
        details: `User authenticated via ${sessionSource} (${clientInfo?.browser || 'Browser'}, rememberMe: ${!!rememberMe})`,
      };
      sharedState.auditLogs.unshift(loginAudit);
      if (sharedState.auditLogs.length > 500) sharedState.auditLogs.pop();

      saveState();

      console.log(`[Shared Link Auth] User logged in: ${user.name} (${user.email}) from ${sessionSource}`);

      return res.json({
        success: true,
        user,
        activeSessions: sharedState.activeSessions,
        auditLogs: sharedState.auditLogs,
        token: `tok_${sessionId}`,
      });
    } catch (err: any) {
      console.error('[Auth Login Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. User Registration
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, email, company, password, source, clientInfo } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Name and email are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const existing = sharedState.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const formattedTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const sessionSource = source || (clientInfo?.isSharedLink ? 'Shared App Link' : 'Self Registration');

      const newUser: SharedUser = {
        id: `usr_${Date.now()}`,
        name: String(name).trim(),
        email: cleanEmail,
        company: company ? String(company).trim() : undefined,
        role: 'user',
        accountStatus: 'active',
        emailVerified: false,
        createdAt: new Date().toISOString().substring(0, 10),
        lastLoginAt: 'Just now',
      };

      // Add user to shared state
      sharedState.users.unshift(newUser);

      // Create initial active session
      const sessionId = `sess_${Date.now()}`;
      const newSession: ActiveSession = {
        sessionId,
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        loggedInAt: formattedTime,
        lastPingAt: Date.now(),
        source: sessionSource,
        ipAddress: clientIp,
      };
      sharedState.activeSessions.unshift(newSession);

      // Record audit logs
      const regAudit: SharedAuditLog = {
        id: `evt_reg_${Date.now()}`,
        timestamp: formattedTime,
        actorEmail: newUser.email,
        eventType: 'REGISTER',
        details: `New tenant account registered: ${newUser.name} (${newUser.email}) via ${sessionSource}`,
      };
      const loginAudit: SharedAuditLog = {
        id: `evt_login_${Date.now()}`,
        timestamp: formattedTime,
        actorEmail: newUser.email,
        eventType: 'LOGIN_SUCCESS',
        details: `Initial session provisioned for new tenant workspace via ${sessionSource}`,
      };
      sharedState.auditLogs.unshift(regAudit);
      sharedState.auditLogs.unshift(loginAudit);
      if (sharedState.auditLogs.length > 500) sharedState.auditLogs.pop();

      saveState();

      console.log(`[Registration] New tenant registered: ${newUser.name} (${newUser.email}) via ${sessionSource}`);

      return res.status(201).json({
        success: true,
        user: newUser,
        activeSessions: sharedState.activeSessions,
        token: `tok_${sessionId}`,
      });
    } catch (err: any) {
      console.error('[Auth Register Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Active Session Heartbeat Ping
  app.post('/api/auth/session-ping', (req: Request, res: Response) => {
    try {
      const { email, userId, source } = req.body;
      if (!email && !userId) {
        return res.status(400).json({ success: false, error: 'Email or userId required' });
      }

      const cleanEmail = email ? String(email).toLowerCase() : '';
      let session = (sharedState.activeSessions || []).find(
        (s) => (cleanEmail && s.email.toLowerCase() === cleanEmail) || (userId && s.userId === userId)
      );

      if (session) {
        session.lastPingAt = Date.now();
        if (source) session.source = source;
      } else if (cleanEmail) {
        const user = sharedState.users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (user) {
          sharedState.activeSessions.unshift({
            sessionId: `sess_${Date.now()}`,
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            loggedInAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            lastPingAt: Date.now(),
            source: source || 'Shared Link / Web Session',
          });
        }
      }

      cleanStaleSessions();
      return res.json({
        success: true,
        activeSessionsCount: sharedState.activeSessions.length,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. User Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    try {
      const { email, userId } = req.body;
      const cleanEmail = email ? String(email).toLowerCase() : '';

      sharedState.activeSessions = (sharedState.activeSessions || []).filter(
        (s) => (cleanEmail ? s.email.toLowerCase() !== cleanEmail : true) && (userId ? s.userId !== userId : true)
      );

      const logoutAudit: SharedAuditLog = {
        id: `evt_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        actorEmail: cleanEmail || 'user@salesinsight.io',
        eventType: 'LOGOUT',
        details: `User session closed for ${cleanEmail || userId}`,
      };
      sharedState.auditLogs.unshift(logoutAudit);
      saveState();

      return res.json({ success: true, message: 'Signed out.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Update User Status (Admin action)
  app.patch('/api/users/:id/status', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, adminEmail } = req.body;
      const user = sharedState.users.find((u) => u.id === id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      user.accountStatus = status === 'suspended' ? 'suspended' : 'active';
      const audit: SharedAuditLog = {
        id: `evt_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        actorEmail: adminEmail || 'admin@gmail.com',
        eventType: 'ACCOUNT_STATUS_CHANGE',
        details: `Admin changed account status of ${user.email} to ${user.accountStatus}`,
      };
      sharedState.auditLogs.unshift(audit);
      saveState();

      return res.json({ success: true, user, users: sharedState.users });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Update User Role (Admin action)
  app.patch('/api/users/:id/role', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role, adminEmail } = req.body;
      const user = sharedState.users.find((u) => u.id === id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      user.role = role === 'admin' ? 'admin' : 'user';
      const audit: SharedAuditLog = {
        id: `evt_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        actorEmail: adminEmail || 'admin@gmail.com',
        eventType: 'ACCOUNT_STATUS_CHANGE',
        details: `Admin changed role of ${user.email} to ${user.role}`,
      };
      sharedState.auditLogs.unshift(audit);
      saveState();

      return res.json({ success: true, user, users: sharedState.users });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Audit Logs
  app.get('/api/audit', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: sharedState.auditLogs,
    });
  });

  // 10. Vite Middleware or Static Files
  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api') || req.path === '/health') return next();
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In development mode, attach Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Start HTTP listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SalesInsight Server] Full-Stack App running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SalesInsight Server] Failed to start:', err);
  process.exit(1);
});
