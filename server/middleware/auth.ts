import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean; // 🆕 Added
    isIdentityVerified: boolean; // 🆕 Added
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Update `generateToken` to include verification status
export function generateToken(payload: any): string {
  const tokenPayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      isVerified: payload.isVerified || false, // Ensure defaults
      isIdentityVerified: payload.isIdentityVerified || false, // Ensure defaults
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
}
