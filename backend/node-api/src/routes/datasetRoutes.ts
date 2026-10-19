import { Router, Response } from 'express';
import { DatasetService } from '../services/datasetService.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all permitted datasets
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const datasets = await DatasetService.listDatasets(req.user!.id, req.user!.role);
    return res.json({ success: true, data: datasets });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET single dataset metadata
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await DatasetService.getDatasetById(req.params.id, req.user!.id, req.user!.role);
    return res.json({ success: true, data: dataset });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 404;
    return res.status(status).json({ success: false, error: error.message });
  }
});

// GET data quality report
router.get('/:id/quality', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await DatasetService.getQualityReport(req.params.id);
    return res.json({ success: true, data: report });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST schedule analysis
router.post('/:id/analyses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const job = await DatasetService.scheduleAnalysis(req.params.id, req.user!.id);
    return res.status(202).json({ success: true, data: job });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET analysis results
router.get('/:id/results', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const results = await DatasetService.getAnalysisResults(req.params.id);
    return res.json({ success: true, data: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
