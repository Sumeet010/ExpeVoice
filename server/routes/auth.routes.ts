import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/dbService';
import { DEFAULT_USER, IUserDocument } from '../models/User';

const router = Router();

// GET /api/auth/me - Current user from MongoDB
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Look up user in MongoDB
      const defaultUser = await DatabaseService.getUserByEmail('sadhanagupta0324@gmail.com');
      if (defaultUser) {
        return res.json({ user: defaultUser });
      }
    }

    const defaultUser = (await DatabaseService.getUserByEmail(DEFAULT_USER.email)) || DEFAULT_USER;
    res.json({ user: defaultUser });
  } catch (error: any) {
    res.json({ user: DEFAULT_USER });
  }
});

// POST /api/auth/google - Sign in with Google and persist in MongoDB
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, profile, email: directEmail, name: directName } = req.body;

    let googleEmail = profile?.email || directEmail;
    let googleName = profile?.name || directName;
    let googlePicture = profile?.picture;
    let googleSub = profile?.sub;

    // Decode JWT token payload if supplied
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
          const parsed = JSON.parse(payloadStr);
          googleEmail = parsed.email || googleEmail;
          googleName = parsed.name || googleName;
          googlePicture = parsed.picture || googlePicture;
          googleSub = parsed.sub || googleSub;
        }
      } catch (e) {
        console.warn('JWT token decode note:', e);
      }
    }

    // Default to user's verified email if none resolved
    const resolvedEmail = googleEmail || 'sadhanagupta0324@gmail.com';
    const resolvedName = googleName || 'Sadhana Gupta';
    const token = `google_oauth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const userDoc: IUserDocument = {
      id: googleSub ? `google-${googleSub}` : `user-${Date.now()}`,
      email: resolvedEmail,
      name: resolvedName,
      avatarUrl:
        googlePicture ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      homeCurrency: 'INR',
      authProvider: 'google',
      monthlyBudget: 75000,
      travelMode: true,
      token,
      googleSub,
      lastLoginAt: new Date().toISOString(),
    };

    // Save to MongoDB
    const savedUser = await DatabaseService.saveUser(userDoc);

    res.json({
      success: true,
      token,
      user: savedUser,
      database: 'MongoDB',
      message: 'Successfully authenticated and synced with MongoDB',
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Authentication failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Signed out successfully' });
});

export default router;
