import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { sendSuccess, sendError } from '../utils/response';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from '../utils/password-reset-email';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-32char-long';
const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.').transform((email) => email.toLowerCase()),
});
const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, 'This password reset link is invalid or expired.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});
const resetRequestMessage = 'If an account exists for that email, a password reset link will be sent.';
const minimumResetRequestDurationMs = 350;

function generateToken(userId: string, role: UserRole, email: string): string {
  return jwt.sign(
    { userId, role, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Explicit security check: Admin registration cannot happen publicly
    if (req.body && req.body.role === 'ADMIN') {
      sendError(res, 'Admin accounts cannot be registered publicly.', 400);
      return;
    }

    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0].message, 400, parseResult.error.format());
      return;
    }

    const { name, email, password, phone, role } = parseResult.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      sendError(res, 'A user with this email already exists.', 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || null,
        role: role as UserRole,
        isVerified: false,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePicture: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id, user.role, user.email);

    sendSuccess(
      res,
      {
        user,
        token,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 'An error occurred while creating your account.', 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0].message, 400);
      return;
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      sendError(res, 'Invalid email or password.', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'This account has been deactivated. Please contact support.', 403);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      sendError(res, 'Invalid email or password.', 401);
      return;
    }

    const token = generateToken(user.id, user.role, user.email);

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        token,
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'An error occurred during login.', 500);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePicture: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, { user });
  } catch (error) {
    console.error('GetMe error:', error);
    sendError(res, 'An error occurred fetching profile.', 500);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, null, 'Logged out successfully');
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const requestStartedAt = Date.now();
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  if (!isPasswordResetEmailConfigured()) {
    console.error('Password reset email is unavailable because SMTP configuration is incomplete.');
    await delayUntilMinimumResetResponse(requestStartedAt);
    sendSuccess(res, null, resetRequestMessage, 202);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true },
    });
    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({
          where: { userId: user.id, OR: [{ expiresAt: { lte: new Date() } }, { usedAt: { not: null } }] },
        }),
        prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
      ]);

      void sendPasswordResetEmail(user.email, token).catch(() => {
        console.error('Password reset email delivery failed; check SMTP configuration and provider logs.');
      });
    }
    await delayUntilMinimumResetResponse(requestStartedAt);
    sendSuccess(res, null, resetRequestMessage, 202);
  } catch (error) {
    console.error('forgotPassword error:', error);
    sendError(res, 'Unable to process the password reset request right now.', 503);
  }

  async function delayUntilMinimumResetResponse(requestStartedAt: number): Promise<void> {
    const remaining = minimumResetRequestDurationMs - (Date.now() - requestStartedAt);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const now = new Date();
    const reset = await prisma.$transaction(async (transaction) => {
      const resetToken = await transaction.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, expiresAt: true, usedAt: true },
      });
      if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) return false;

      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: resetToken.id, tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) return false;

      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });
      await transaction.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, id: { not: resetToken.id } },
      });
      return true;
    });

    if (!reset) {
      sendError(res, 'This password reset link is invalid or expired.', 400);
      return;
    }
    sendSuccess(res, null, 'Your password has been reset. You can now log in.');
  } catch (error) {
    console.error('resetPassword error:', error);
    sendError(res, 'Unable to reset your password right now.', 500);
  }
}
