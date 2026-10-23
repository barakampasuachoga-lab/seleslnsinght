import { Router, Request, Response } from 'express';
import { AdminService } from '../services/adminService.js';
import { AuthService } from '../services/authService.js';
import { DatasetService } from '../services/datasetService.js';

const router = Router();

// Middleware to extract and verify admin role
function requireAdmin(req: Request, res: Response, next: Function) {
  const role = (req.headers['x-user-role'] as string) || (req.query.role as string) || 'admin';
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
}

router.use(requireAdmin);

// 1. Dashboard summary
router.get('/dashboard/summary', async (req: Request, res: Response) => {
  try {
    const summary = await AdminService.getSummary('admin');
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. System Health
router.get('/system/health', async (req: Request, res: Response) => {
  try {
    const health = await AdminService.getSystemHealth('admin');
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Notifications
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const list = await AdminService.listNotifications('admin');
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const success = await AdminService.markNotificationRead(req.params.id, 'admin');
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/mark-all-read', async (req: Request, res: Response) => {
  try {
    await AdminService.markAllNotificationsRead('admin');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Platform Settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await AdminService.getSettings('admin');
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const adminEmail = (req.headers['x-user-email'] as string) || 'admin@gmail.com';
    const updated = await AdminService.updateSettings(req.body, 'admin', adminEmail);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Users Management
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await AuthService.listUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const adminId = (req.headers['x-user-id'] as string) || 'usr_admin_001';
    const { status } = req.body;
    const user = await AuthService.updateUserStatus(req.params.id, status, adminId);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const adminId = (req.headers['x-user-id'] as string) || 'usr_admin_001';
    const { role } = req.body;
    const user = await AdminService.updateUserRole(req.params.id, role, adminId, 'admin');
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const user = await AuthService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const result = await AuthService.forgotPassword(user.email);
    res.json({ success: true, message: `Password reset token initiated for ${user.email}`, tokenPreview: result.resetTokenPreview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Datasets & Jobs
router.get('/datasets', async (req: Request, res: Response) => {
  try {
    const datasets = await DatasetService.listDatasets('usr_admin_001', 'admin');
    res.json(datasets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Activity Logs
router.get('/activity-logs', async (req: Request, res: Response) => {
  try {
    const logs = await AuthService.listAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
