import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { deleteStoredFile, storeUploadedFile } from '../utils/file-storage';

const updateCurrentUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100).optional(),
  email: z.string().trim().email('Enter a valid email address.').max(254).transform((email) => email.toLowerCase()).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'Provide at least one profile field to update.',
});

export async function getCurrentUserProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
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
    console.error('getCurrentUserProfile error:', error);
    sendError(res, 'Failed to fetch profile', 500);
  }
}

export async function updateCurrentUserProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parsed = updateCurrentUserSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...parsed.data,
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
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
    sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      sendError(res, 'An account with this email address already exists.', 409);
      return;
    }
    console.error('updateCurrentUserProfile error:', error);
    sendError(res, 'Failed to update profile', 500);
  }
}

export async function uploadCurrentUserProfilePicture(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }
  if (!req.file) {
    sendError(res, 'Choose an image to upload.', 400);
    return;
  }

  let stored: { filename: string; mimetype: string } | undefined;
  try {
    stored = await storeUploadedFile(req.file, true);
    const profilePicture = `/media/profiles/${req.user.id}/${stored.filename}`;
    const existing = await prisma.user.findUnique({ where: { id: req.user.id }, select: { profilePicture: true } });
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePicture },
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
    const oldFilename = existing?.profilePicture?.match(/^\/media\/profiles\/[^/]+\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/i)?.[1];
    if (oldFilename) await deleteStoredFile(oldFilename);
    sendSuccess(res, { user }, 'Profile picture uploaded successfully');
  } catch (error) {
    if (stored) await deleteStoredFile(stored.filename).catch(() => undefined);
    console.error('uploadCurrentUserProfilePicture error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to upload profile picture', 400);
  }
}
