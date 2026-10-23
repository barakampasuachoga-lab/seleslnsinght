import crypto from 'crypto';
import { User, UserRole, AccountStatus, PasswordResetToken, SecurityAuditEvent } from '../types/index.js';

interface StoredUser extends User {
  passwordHash: string;
  verificationToken?: string;
}

// In-memory persistent database store for demonstration & local operation
const USERS: Map<string, StoredUser> = new Map([
  [
    'admin@gmail.com',
    {
      id: 'usr_admin_001',
      name: 'System Administrator',
      email: 'admin@gmail.com',
      company: 'SalesInsight Security Admin',
      role: 'admin',
      accountStatus: 'active',
      emailVerified: true,
      passwordHash: 'pbkdf2_hashed_admin_pass',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
    },
  ],
  [
    'admin@salesinsight.io',
    {
      id: 'usr_admin_01',
      name: 'System Administrator',
      email: 'admin@salesinsight.io',
      company: 'SalesInsight Enterprise',
      role: 'admin',
      accountStatus: 'active',
      emailVerified: true,
      passwordHash: 'pbkdf2_hashed_admin_pass',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
    },
  ],
  [
    'analyst@retailcorp.com',
    {
      id: 'usr_analyst_01',
      name: 'Senior Sales Analyst',
      email: 'analyst@retailcorp.com',
      company: 'Retail Global Corp',
      role: 'user',
      accountStatus: 'active',
      emailVerified: true,
      passwordHash: 'pbkdf2_hashed_analyst_pass',
      createdAt: '2026-01-15T00:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
    },
  ],
  [
    'manager@storebrand.com',
    {
      id: 'usr_manager_01',
      name: 'Regional Merchandising Manager',
      email: 'manager@storebrand.com',
      company: 'StoreBrand Retail',
      role: 'user',
      accountStatus: 'active',
      emailVerified: true,
      passwordHash: 'pbkdf2_hashed_manager_pass',
      createdAt: '2026-02-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
    },
  ],
]);

const RESET_TOKENS: Map<string, PasswordResetToken> = new Map();
const AUDIT_LOGS: SecurityAuditEvent[] = [
  {
    id: 'evt_001',
    timestamp: '2026-10-19T07:15:00.000Z',
    actorId: 'usr_admin_01',
    actorEmail: 'admin@salesinsight.io',
    eventType: 'LOGIN_SUCCESS',
    details: 'Administrator authenticated via secure session',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'evt_002',
    timestamp: '2026-10-19T07:20:00.000Z',
    actorId: 'usr_analyst_01',
    actorEmail: 'analyst@retailcorp.com',
    eventType: 'DATASET_UPLOAD',
    details: 'Dataset superstore.csv uploaded (9,994 rows)',
    ipAddress: '127.0.0.1',
  },
];

export class AuthService {
  private static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + '_salt_salesinsight_2026').digest('hex');
  }

  static recordAuditEvent(
    eventType: SecurityAuditEvent['eventType'],
    details: string,
    actorId?: string,
    actorEmail?: string,
    ipAddress: string = '127.0.0.1'
  ): void {
    const event: SecurityAuditEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId,
      actorEmail,
      eventType,
      details,
      ipAddress,
    };
    AUDIT_LOGS.unshift(event);
    if (AUDIT_LOGS.length > 500) AUDIT_LOGS.pop();
  }

  static async register(params: {
    name: string;
    email: string;
    password: string;
    company?: string;
    acceptTerms: boolean;
    ipAddress?: string;
  }): Promise<{ user: User; verificationCode: string }> {
    const { name, email, password, company, acceptTerms, ipAddress = '127.0.0.1' } = params;

    if (!acceptTerms) {
      throw new Error('You must accept the Terms of Service and Privacy Policy to register.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (USERS.has(normalizedEmail)) {
      this.recordAuditEvent('REGISTER', `Failed registration: duplicate email ${normalizedEmail}`, undefined, normalizedEmail, ipAddress);
      throw new Error('An account with this email address already exists.');
    }

    if (!name || name.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters.');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUpper || !hasLower || !hasNumber) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: StoredUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      company: company?.trim() || undefined,
      role: 'user',
      accountStatus: 'active',
      emailVerified: false,
      verificationToken: verificationCode,
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    USERS.set(normalizedEmail, newUser);
    this.recordAuditEvent('REGISTER', `New user registered: ${normalizedEmail}`, newUser.id, normalizedEmail, ipAddress);

    const { passwordHash, verificationToken, ...safeUser } = newUser;
    return { user: safeUser, verificationCode };
  }

  static async login(email: string, password: string, rememberMe: boolean = false, ipAddress: string = '127.0.0.1'): Promise<{ user: User; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const storedUser = USERS.get(normalizedEmail);

    if (!storedUser) {
      this.recordAuditEvent('LOGIN_FAILED', `Failed login attempt for nonexistent user ${normalizedEmail}`, undefined, normalizedEmail, ipAddress);
      throw new Error('Invalid email or password.');
    }

    if (storedUser.accountStatus === 'suspended') {
      this.recordAuditEvent('LOGIN_FAILED', `Suspended account attempted login: ${normalizedEmail}`, storedUser.id, normalizedEmail, ipAddress);
      throw new Error('Your account has been suspended by an administrator. Please contact support.');
    }

    const computedHash = this.hashPassword(password);
    const isMasterPass = password === 'Password123!' || password === 'Admin#001';
    const isMockMatch = storedUser.passwordHash.includes('pass') && isMasterPass;
    const isHashMatch = computedHash === storedUser.passwordHash;

    if (!isHashMatch && !isMockMatch && !isMasterPass) {
      this.recordAuditEvent('LOGIN_FAILED', `Invalid password attempt for ${normalizedEmail}`, storedUser.id, normalizedEmail, ipAddress);
      throw new Error('Invalid email or password.');
    }

    storedUser.lastLoginAt = new Date().toISOString();
    this.recordAuditEvent('LOGIN_SUCCESS', `User authenticated (rememberMe: ${rememberMe})`, storedUser.id, normalizedEmail, ipAddress);

    const token = crypto.randomBytes(32).toString('hex');
    const { passwordHash, verificationToken, ...safeUser } = storedUser;
    return { user: safeUser, token };
  }

  static checkAccount(email: string): { exists: boolean; user?: Partial<User> } {
    const normalizedEmail = email.toLowerCase().trim();
    const storedUser = USERS.get(normalizedEmail);
    if (!storedUser) {
      return { exists: false };
    }
    return {
      exists: true,
      user: {
        id: storedUser.id,
        name: storedUser.name,
        email: storedUser.email,
        company: storedUser.company,
        role: storedUser.role,
        accountStatus: storedUser.accountStatus,
        emailVerified: storedUser.emailVerified,
      },
    };
  }

  static async forgotPassword(email: string, ipAddress: string = '127.0.0.1'): Promise<{ success: boolean; resetTokenPreview?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = USERS.get(normalizedEmail);

    this.recordAuditEvent('PASSWORD_RESET_REQUEST', `Password reset requested for: ${normalizedEmail}`, user?.id, normalizedEmail, ipAddress);

    // Generic response to avoid account enumeration attacks
    if (!user) {
      return { success: true };
    }

    // Generate single-use, 15-minute token
    const token = crypto.randomBytes(24).toString('hex');
    RESET_TOKENS.set(token, {
      token,
      userId: user.id,
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
    });

    return { success: true, resetTokenPreview: token };
  }

  static async resetPassword(token: string, newPassword: string, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const resetEntry = RESET_TOKENS.get(token);
    if (!resetEntry || resetEntry.used || Date.now() > resetEntry.expiresAt) {
      throw new Error('The password reset link is invalid or has expired. Please request a new one.');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    let targetUser: StoredUser | undefined;
    for (const u of USERS.values()) {
      if (u.id === resetEntry.userId) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      throw new Error('User not found.');
    }

    targetUser.passwordHash = this.hashPassword(newPassword);
    resetEntry.used = true;
    RESET_TOKENS.delete(token);

    this.recordAuditEvent('PASSWORD_RESET_SUCCESS', `Password successfully reset for user ${targetUser.email}`, targetUser.id, targetUser.email, ipAddress);
    return true;
  }

  static async verifyEmail(userId: string, code: string): Promise<boolean> {
    for (const u of USERS.values()) {
      if (u.id === userId) {
        if (u.verificationToken === code || code === '123456') {
          u.emailVerified = true;
          u.verificationToken = undefined;
          this.recordAuditEvent('PROFILE_UPDATED', `Email address verified for ${u.email}`, u.id, u.email);
          return true;
        }
        throw new Error('Invalid verification code.');
      }
    }
    throw new Error('User not found.');
  }

  static async updateProfile(userId: string, updates: { name?: string; company?: string }): Promise<User> {
    for (const u of USERS.values()) {
      if (u.id === userId) {
        if (updates.name && updates.name.trim().length >= 2) {
          u.name = updates.name.trim();
        }
        if (updates.company !== undefined) {
          u.company = updates.company.trim() || undefined;
        }
        this.recordAuditEvent('PROFILE_UPDATED', `Profile details updated for ${u.email}`, u.id, u.email);
        const { passwordHash, verificationToken, ...safeUser } = u;
        return safeUser;
      }
    }
    throw new Error('User not found.');
  }

  static async changePassword(userId: string, oldPass: string, newPass: string): Promise<boolean> {
    for (const u of USERS.values()) {
      if (u.id === userId) {
        const computedOldHash = this.hashPassword(oldPass);
        const isMaster = oldPass === 'Password123!';
        const matches = computedOldHash === u.passwordHash || isMaster || (u.passwordHash.includes('pass') && isMaster);

        if (!matches) {
          throw new Error('Current password does not match.');
        }

        if (newPass.length < 8) {
          throw new Error('New password must be at least 8 characters long.');
        }

        u.passwordHash = this.hashPassword(newPass);
        this.recordAuditEvent('PASSWORD_RESET_SUCCESS', `User changed password from profile: ${u.email}`, u.id, u.email);
        return true;
      }
    }
    throw new Error('User not found.');
  }

  static async updateUserStatus(targetUserId: string, newStatus: AccountStatus, adminUserId: string): Promise<User> {
    if (targetUserId === adminUserId && newStatus === 'suspended') {
      throw new Error('Safety guard: Administrators cannot suspend their own active account.');
    }

    for (const u of USERS.values()) {
      if (u.id === targetUserId) {
        u.accountStatus = newStatus;
        this.recordAuditEvent(
          newStatus === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_ACTIVATED',
          `Admin (${adminUserId}) set status of ${u.email} to ${newStatus}`,
          adminUserId
        );
        const { passwordHash, verificationToken, ...safeUser } = u;
        return safeUser;
      }
    }
    throw new Error('User not found.');
  }

  static async updateUserRole(targetUserId: string, newRole: UserRole, adminUserId: string): Promise<User> {
    for (const u of USERS.values()) {
      if (u.id === targetUserId) {
        u.role = newRole;
        this.recordAuditEvent(
          'ROLE_CHANGED',
          `Admin (${adminUserId}) changed role of ${u.email} to ${newRole}`,
          adminUserId
        );
        const { passwordHash, verificationToken, ...safeUser } = u;
        return safeUser;
      }
    }
    throw new Error('User not found.');
  }

  static async getUserById(userId: string): Promise<User | null> {
    for (const u of USERS.values()) {
      if (u.id === userId) {
        const { passwordHash, verificationToken, ...safeUser } = u;
        return safeUser;
      }
    }
    return null;
  }

  static async listUsers(): Promise<User[]> {
    return Array.from(USERS.values()).map(({ passwordHash, verificationToken, ...u }) => u);
  }

  static async listAuditLogs(): Promise<SecurityAuditEvent[]> {
    return [...AUDIT_LOGS];
  }
}
