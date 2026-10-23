export type UserRole = 'guest' | 'user' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: number; // timestamp
  used: boolean;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  actorId?: string;
  actorEmail?: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_SUCCESS' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_ACTIVATED' | 'DATASET_UPLOAD' | 'DATASET_DELETE' | 'PROFILE_UPDATED' | 'ROLE_CHANGED';
  details: string;
  ipAddress: string;
}

export interface DatasetMetadata {
  id: string;
  ownerId: string;
  originalFilename: string;
  storagePath: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  status: 'uploaded' | 'inspected' | 'cleaned' | 'analyzed' | 'failed';
  uploadedAt: string;
  dataQualityFlags: string[];
}

export interface AnalysisJob {
  id: string;
  datasetId: string;
  ownerId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
}
