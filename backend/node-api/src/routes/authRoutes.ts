import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }
    const user = await AuthService.register(name, email, password);
    return res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    const user = await AuthService.login(email, password);
    const token = user.role === 'admin' ? 'admin-token' : 'analyst-token';
    return res.json({ success: true, data: { user, token } });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: req.user });
});

export default router;
