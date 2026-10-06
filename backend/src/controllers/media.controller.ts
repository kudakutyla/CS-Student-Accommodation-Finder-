import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendError } from '../utils/response';
import { readStoredFile } from '../utils/file-storage';

const contentTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

function setFileHeaders(res: Response, filename: string, inline: boolean, allowCrossOrigin = false): void {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  res.setHeader('Content-Type', contentTypes[extension] || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (allowCrossOrigin) res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${filename}"`);
}

export async function getListingPhoto(req: Request, res: Response): Promise<void> {
  try {
    const { filename } = req.params;
    const photo = await prisma.listingPhoto.findFirst({
      where: { photoUrl: `/media/listings/${filename}` },
      include: { listing: { select: { approvalStatus: true, ownerId: true } } },
    });
    if (!photo) {
      sendError(res, 'Image not found', 404);
      return;
    }
    const canView = photo.listing.approvalStatus === 'APPROVED'
      || req.user?.role === 'ADMIN'
      || req.user?.id === photo.listing.ownerId;
    if (!canView) {
      sendError(res, 'This listing image is not publicly available.', 403);
      return;
    }
    const file = await readStoredFile(filename);
    setFileHeaders(res, filename, true);
    res.send(file);
  } catch (error) {
    console.error('getListingPhoto error:', error);
    sendError(res, 'Image not found', 404);
  }
}

export async function getProfilePicture(req: Request, res: Response): Promise<void> {
  try {
    const reference = `/media/profiles/${req.params.userId}/${req.params.filename}`;
    const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { profilePicture: true } });
    if (!user || user.profilePicture !== reference) {
      sendError(res, 'Image not found', 404);
      return;
    }
    const file = await readStoredFile(req.params.filename);
    setFileHeaders(res, req.params.filename, true, true);
    res.send(file);
  } catch (error) {
    console.error('getProfilePicture error:', error);
    sendError(res, 'Image not found', 404);
  }
}

export async function getMessageAttachment(req: Request, res: Response): Promise<void> {
  try {
    const reference = `/media/messages/${req.params.filename}`;
    const message = await prisma.message.findFirst({
      where: { attachmentUrl: reference },
      include: { conversation: { select: { studentId: true, landlordId: true } } },
    });
    if (!message) {
      sendError(res, 'Attachment not found', 404);
      return;
    }
    if (!req.user || (req.user.id !== message.conversation.studentId && req.user.id !== message.conversation.landlordId)) {
      sendError(res, 'You do not have access to this attachment.', 403);
      return;
    }
    const file = await readStoredFile(req.params.filename);
    setFileHeaders(res, req.params.filename, false);
    res.send(file);
  } catch (error) {
    console.error('getMessageAttachment error:', error);
    sendError(res, 'Attachment not found', 404);
  }
}