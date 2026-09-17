import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { sendError } from '../utils/response';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required. No token provided.', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-32char-long';

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        sendError(res, 'Token expired. Please log in again.', 401);
        return;
      }
      sendError(res, 'Invalid token. Authentication failed.', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      sendError(res, 'User account not found or deactivated.', 401);
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    sendError(res, 'Internal authentication error.', 500);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const allowedRoles = roles.map((role) => role.toLowerCase()).join(' or ');
      const displayRoles = roles.length === 1 ? `${roles[0].toLowerCase()}s` : allowedRoles;
      sendError(res, `Only ${displayRoles} can perform this action.`, 403);
      return;
    }

    next();
  };
}

export function requireVerifiedLandlord(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required.', 401);
    return;
  }

  if (req.user.role !== 'LANDLORD') {
    sendError(res, 'Only landlords can perform this action.', 403);
    return;
  }

  if (!req.user.isVerified) {
    sendError(res, 'Your landlord account must be verified before you can create a listing.', 403);
    return;
  }

  next();
}
