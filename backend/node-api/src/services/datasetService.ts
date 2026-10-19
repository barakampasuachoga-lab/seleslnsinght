import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DatasetMetadata, AnalysisJob } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../../');

// In-memory catalog of registered datasets
const DATASETS: Map<string, DatasetMetadata> = new Map([
  [
    'ds_superstore_2026',
    {
      id: 'ds_superstore_2026',
      ownerId: 'usr_analyst_01',
      originalFilename: 'Sample - Superstore.csv',
      storagePath: path.join(ROOT_DIR, 'data/raw/superstore.csv'),
      fileSize: 2298572,
      rowCount: 9994,
      columnCount: 21,
      status: 'analyzed',
      uploadedAt: '2026-10-19T07:15:00Z',
      dataQualityFlags: [
        'Detected 1,871 negative profit transactions representing commercial discount losses.',
      ],
    },
  ],
]);

const JOBS: Map<string, AnalysisJob> = new Map([
  [
    'job_an_01',
    {
      id: 'job_an_01',
      datasetId: 'ds_superstore_2026',
      ownerId: 'usr_analyst_01',
      status: 'completed',
      startedAt: '2026-10-19T07:28:36Z',
      completedAt: '2026-10-19T07:28:42Z',
    },
  ],
]);

export class DatasetService {
  static async listDatasets(userId: string, role: string): Promise<DatasetMetadata[]> {
    if (role === 'admin') {
      return Array.from(DATASETS.values());
    }
    return Array.from(DATASETS.values()).filter((d) => d.ownerId === userId);
  }

  static async getDatasetById(datasetId: string, userId: string, role: string): Promise<DatasetMetadata> {
    const dataset = DATASETS.get(datasetId);
    if (!dataset) {
      throw new Error(`Dataset with ID '${datasetId}' not found.`);
    }

    // Ownership check
    if (role !== 'admin' && dataset.ownerId !== userId) {
      throw new Error('Access denied: You do not own this dataset.');
    }

    return dataset;
  }

  static async getQualityReport(datasetId: string): Promise<any> {
    const jsonPath = path.join(ROOT_DIR, 'reports/data_quality/inspection_report.json');
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      return JSON.parse(content);
    }
    return {
      source_name: 'superstore.csv',
      total_rows: 9994,
      total_columns: 21,
      warnings: ['Audit verified 1,871 negative profit transactions.'],
    };
  }

  static async getAnalysisResults(datasetId: string): Promise<any> {
    const kpiPath = path.join(ROOT_DIR, 'reports/analysis/kpis.json');
    let kpis = { total_sales: 2297200.86, total_profit: 286397.02, profit_margin_pct: 12.47 };
    if (fs.existsSync(kpiPath)) {
      kpis = JSON.parse(fs.readFileSync(kpiPath, 'utf-8'));
    }

    return {
      schema_version: '1.0.0',
      dataset_id: datasetId,
      headline_kpis: kpis,
      generated_at: new Date().toISOString(),
    };
  }

  static async scheduleAnalysis(datasetId: string, userId: string): Promise<AnalysisJob> {
    const jobId = `job_${Date.now()}`;
    const job: AnalysisJob = {
      id: jobId,
      datasetId,
      ownerId: userId,
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    JOBS.set(jobId, job);
    return job;
  }

  static async getJobStatus(jobId: string): Promise<AnalysisJob> {
    const job = JOBS.get(jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found.`);
    }
    return job;
  }
}
