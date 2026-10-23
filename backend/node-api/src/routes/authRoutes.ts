import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, company, acceptTerms } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const result = await AuthService.register({
      name,
      email,
      password,
      company,
      acceptTerms: !!acceptTerms,
      ipAddress,
    });

    return res.status(201).json({
      success: true,
      data: result.user,
      verificationCodePreview: result.verificationCode,
      message: 'Account created successfully. Please verify your email to access all features.',
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const { user, token } = await AuthService.login(email, password, !!rememberMe, ipAddress);

    return res.json({ success: true, data: { user, token } });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  AuthService.recordAuditEvent('LOGOUT', 'User logged out', undefined, undefined);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: req.user });
});

router.get('/check-account', (req: Request, res: Response) => {
  const email = (req.query.email as string) || '';
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email parameter is required.' });
  }
  const result = AuthService.checkAccount(email);
  return res.json({ success: true, ...result });
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const result = await AuthService.forgotPassword(email, ipAddress);
    return res.json({
      success: true,
      message: 'If an account matches that email address, password recovery instructions have been dispatched.',
      tokenPreview: result.resetTokenPreview, // provided in dev mode for testing
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
    }
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    await AuthService.resetPassword(token, newPassword, ipAddress);
    return res.json({ success: true, message: 'Password has been successfully updated. You may now log in.' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/verify-email', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Verification code is required.' });
    }
    await AuthService.verifyEmail(req.user!.id, code);
    return res.json({ success: true, message: 'Email address successfully verified.' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, company } = req.body;
    const updated = await AuthService.updateProfile(req.user!.id, { name, company });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required.' });
    }
    await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Admin management endpoints
router.get('/admin/users', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await AuthService.listUsers();
    return res.json({ success: true, data: users });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/admin/users/:id/status', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'suspended', 'deactivated'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid account status.' });
    }
    const updated = await AuthService.updateUserStatus(req.params.id, status, req.user!.id);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/admin/audit-logs', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await AuthService.listAuditLogs();
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
