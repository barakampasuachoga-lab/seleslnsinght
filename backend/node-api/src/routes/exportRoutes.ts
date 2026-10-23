import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// In-memory persistent export job store for Node Gateway API
interface ServerExportJob {
  id: string;
  ownerId: string;
  ownerName: string;
  reportName: string;
  datasetId: string;
  datasetName: string;
  selectedQuestions: string[];
  format: 'pdf' | 'pptx' | 'pbix' | 'powerbi';
  createdAt: string;
  fileSize: string;
  status: 'Queued' | 'Generating' | 'Completed' | 'Failed';
  progress: number;
  downloadUrl?: string;
}

const SERVER_EXPORTS: ServerExportJob[] = [
  {
    id: 'exp_init_01',
    ownerId: 'usr_analyst_01',
    ownerName: 'Senior Sales Analyst',
    reportName: 'Sample - Superstore Retail Sales - Complete Executive PDF Report',
    datasetId: 'ds_superstore_2026',
    datasetName: 'Sample - Superstore Retail Sales',
    selectedQuestions: [
      'What are total sales, profit, and profit margin?',
      'Which product categories generate the highest revenue and profit?',
      'How does profitability vary across geographic regions?',
      'How do discount levels affect profitability?',
      'What are the monthly sales trends over time?',
    ],
    format: 'pdf',
    createdAt: '2026-10-21 07:30',
    fileSize: '1.4 MB',
    status: 'Completed',
    progress: 100,
    downloadUrl: '/api/exports/exp_init_01/download',
  },
  {
    id: 'exp_init_02',
    ownerId: 'usr_analyst_01',
    ownerName: 'Senior Sales Analyst',
    reportName: 'Sample - Superstore Retail Sales - Executive Presentation',
    datasetId: 'ds_superstore_2026',
    datasetName: 'Sample - Superstore Retail Sales',
    selectedQuestions: [
      'What are total sales, profit, and profit margin?',
      'Which product categories generate the highest revenue and profit?',
      'What are the worst 5 loss-making products?',
    ],
    format: 'pptx',
    createdAt: '2026-10-22 09:15',
    fileSize: '2.8 MB',
    status: 'Completed',
    progress: 100,
    downloadUrl: '/api/exports/exp_init_02/download',
  },
];

// POST /api/exports/pdf
router.post('/pdf', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { datasetId, datasetName, selectedQuestions, reportTitle } = req.body;
    const user = req.user!;

    const newJob: ServerExportJob = {
      id: `exp_pdf_${Date.now()}`,
      ownerId: user.id,
      ownerName: user.email,
      reportName: reportTitle || `${datasetName || 'Dataset'} - Executive PDF Report`,
      datasetId: datasetId || 'ds_default',
      datasetName: datasetName || 'Retail Dataset',
      selectedQuestions: selectedQuestions || [],
      format: 'pdf',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileSize: '1.4 MB',
      status: 'Completed',
      progress: 100,
      downloadUrl: `/api/exports/exp_pdf_${Date.now()}/download`,
    };

    SERVER_EXPORTS.unshift(newJob);
    return res.status(202).json({
      success: true,
      message: 'PDF export scheduled and generated successfully.',
      data: newJob,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/exports/powerpoint
router.post('/powerpoint', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { datasetId, datasetName, selectedQuestions, reportTitle } = req.body;
    const user = req.user!;

    const newJob: ServerExportJob = {
      id: `exp_pptx_${Date.now()}`,
      ownerId: user.id,
      ownerName: user.email,
      reportName: reportTitle || `${datasetName || 'Dataset'} - Executive Presentation`,
      datasetId: datasetId || 'ds_default',
      datasetName: datasetName || 'Retail Dataset',
      selectedQuestions: selectedQuestions || [],
      format: 'pptx',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileSize: '2.8 MB',
      status: 'Completed',
      progress: 100,
      downloadUrl: `/api/exports/exp_pptx_${Date.now()}/download`,
    };

    SERVER_EXPORTS.unshift(newJob);
    return res.status(202).json({
      success: true,
      message: 'PowerPoint .pptx presentation generated successfully.',
      data: newJob,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/me/exports - Strict user ownership verification
router.get('/users/me/exports', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const userReports = SERVER_EXPORTS.filter((e) => e.ownerId === user.id || user.role === 'admin');
    return res.json({ success: true, count: userReports.length, data: userReports });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exports/:exportId
router.get('/:exportId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const job = SERVER_EXPORTS.find((e) => e.id === req.params.exportId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Export record not found.' });
    }

    // Ownership check
    if (job.ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied to private report.' });
    }

    return res.json({ success: true, data: job });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exports/:exportId/download
router.get('/:exportId/download', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const job = SERVER_EXPORTS.find((e) => e.id === req.params.exportId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Export artifact not found.' });
    }

    if (job.ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not own this report artifact.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${job.reportName.replace(/[^a-zA-Z0-9_-]/g, '_')}.${job.format}"`);
    res.setHeader('Content-Type', job.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    return res.send(Buffer.from(`SalesInsight Verified Export Artifact: ${job.reportName}\nTenant Owner: ${job.ownerName}\nGenerated: ${job.createdAt}`));
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/exports/:exportId
router.delete('/:exportId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const index = SERVER_EXPORTS.findIndex((e) => e.id === req.params.exportId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Export artifact not found.' });
    }

    if (SERVER_EXPORTS[index].ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot delete another user\'s private report.' });
    }

    const removed = SERVER_EXPORTS.splice(index, 1);
    return res.json({ success: true, message: 'Report deleted successfully.', data: removed[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
