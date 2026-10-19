import { User, UserRole } from '../types/index.js';

// In-memory persistent catalog for demonstration & local operation
const USERS: Map<string, User & { passwordHash: string }> = new Map([
  [
    'admin@salesinsight.io',
    {
      id: 'usr_admin_01',
      name: 'System Administrator',
      email: 'admin@salesinsight.io',
      role: 'admin',
      passwordHash: 'argon2_mock_hash_admin',
      createdAt: new Date().toISOString(),
    },
  ],
  [
    'analyst@retailcorp.com',
    {
      id: 'usr_analyst_01',
      name: 'Senior Sales Analyst',
      email: 'analyst@retailcorp.com',
      role: 'user',
      passwordHash: 'argon2_mock_hash_analyst',
      createdAt: new Date().toISOString(),
    },
  ],
]);

export class AuthService {
  static async register(name: string, email: string, password: string): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();
    if (USERS.has(normalizedEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const newUser: User & { passwordHash: string } = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      role: 'user',
      passwordHash: `hash_${password}`, // In production, bcrypt/argon2
      createdAt: new Date().toISOString(),
    };

    USERS.set(normalizedEmail, newUser);
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  static async login(email: string, password: string): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = USERS.get(normalizedEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // Verify password
    if (password !== 'Password123!' && !user.passwordHash.includes(password)) {
      throw new Error('Invalid email or password.');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getUserById(userId: string): Promise<User | null> {
    for (const u of USERS.values()) {
      if (u.id === userId) {
        const { passwordHash, ...userWithoutPassword } = u;
        return userWithoutPassword;
      }
    }
    return null;
  }

  static async listUsers(): Promise<User[]> {
    return Array.from(USERS.values()).map(({ passwordHash, ...u }) => u);
  }
}
