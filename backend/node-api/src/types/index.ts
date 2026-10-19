export type UserRole = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
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
