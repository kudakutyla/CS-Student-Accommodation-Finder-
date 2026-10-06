import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { deleteStoredFile, storeUploadedFile } from '../utils/file-storage';

const messageSchema = z.object({
  content: z.string().max(4000).trim().optional().default(''),
});

export async function getMyConversations(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ studentId: req.user.id }, { landlordId: req.user.id }],
      },
      include: {
        listing: true,
        student: { select: { id: true, name: true, email: true } },
        landlord: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    sendSuccess(
      res,
      conversations.map((conversation) => ({
        ...conversation,
        lastMessage: conversation.messages[0] || null,
      }))
    );
  } catch (error) {
    console.error('getMyConversations error:', error);
    sendError(res, 'Failed to fetch conversations', 500);
  }
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { listingId } = req.body as { listingId?: string };

    if (!listingId) {
      sendError(res, 'Listing ID is required', 400);
      return;
    }

    if (req.user.role !== 'STUDENT') {
      sendError(res, 'Only students can start listing enquiries.', 403);
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });

    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    if (listing.approvalStatus !== 'APPROVED') {
      sendError(res, 'Enquiries are only available for approved listings.', 400);
      return;
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        studentId: req.user.id,
        landlordId: listing.ownerId,
        listingId,
      },
    });

    if (existing) {
      sendSuccess(res, existing, 'Conversation already exists');
      return;
    }

    const conversation = await prisma.conversation.create({
      data: {
        studentId: req.user.id,
        landlordId: listing.ownerId,
        listingId,
      },
    });

    sendSuccess(res, conversation, 'Conversation created successfully', 201);
  } catch (error) {
    console.error('createConversation error:', error);
    sendError(res, 'Failed to create conversation', 500);
  }
}

export async function getConversationMessages(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      sendError(res, 'Conversation not found', 404);
      return;
    }

    if (conversation.studentId !== req.user.id && conversation.landlordId !== req.user.id) {
      sendError(res, 'You do not have access to this conversation.', 403);
      return;
    }

    sendSuccess(res, conversation.messages);
  } catch (error) {
    console.error('getConversationMessages error:', error);
    sendError(res, 'Failed to fetch messages', 500);
  }
}

export async function createMessage(req: Request, res: Response): Promise<void> {
  let storedAttachment: { filename: string; mimetype: string } | undefined;
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const parsed = messageSchema.safeParse(req.body);
    const uploadedFile = req.file;
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }
    if (!parsed.data.content.trim() && !uploadedFile) {
      sendError(res, 'Write a message or attach a document before sending.', 400);
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { listing: { select: { title: true } } },
    });
    if (!conversation) {
      sendError(res, 'Conversation not found', 404);
      return;
    }

    if (conversation.studentId !== req.user.id && conversation.landlordId !== req.user.id) {
      sendError(res, 'You do not have access to this conversation.', 403);
      return;
    }

    const receiverId = req.user.id === conversation.studentId ? conversation.landlordId : conversation.studentId;
    if (uploadedFile) storedAttachment = await storeUploadedFile(uploadedFile);
    const attachmentUrl = storedAttachment ? `/media/messages/${storedAttachment.filename}` : null;
    const attachmentName = uploadedFile?.originalname.slice(0, 255) || null;
    const attachmentType = storedAttachment?.mimetype || null;

    const message = await prisma.$transaction(async (tx) => {
      const savedMessage = await tx.message.create({
        data: {
          conversationId: id,
          senderId: req.user!.id,
          receiverId,
          content: parsed.data.content.trim(),
          attachmentUrl,
          attachmentName,
          attachmentType,
          isRead: false,
        },
      });
      await tx.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
      await tx.notification.create({
        data: {
          userId: receiverId,
          type: 'NEW_MESSAGE',
          title: 'New accommodation enquiry message',
          message: `You have a new message about "${conversation.listing.title}".`,
        },
      });
      return savedMessage;
    });

    sendSuccess(res, message, 'Message sent successfully', 201);
  } catch (error) {
    if (storedAttachment) await deleteStoredFile(storedAttachment.filename).catch(() => undefined);
    console.error('createMessage error:', error);
    sendError(res, error instanceof Error && error.message.includes('file content') ? error.message : 'Failed to send message', error instanceof Error && error.message.includes('file content') ? 400 : 500);
  }
}

export async function markConversationAsRead(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      sendError(res, 'Conversation not found', 404);
      return;
    }

    if (conversation.studentId !== req.user.id && conversation.landlordId !== req.user.id) {
      sendError(res, 'You do not have access to this conversation.', 403);
      return;
    }

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: req.user.id,
      },
      data: { isRead: true },
    });

    sendSuccess(res, { conversationId: id, updated: true }, 'Messages marked as read');
  } catch (error) {
    console.error('markConversationAsRead error:', error);
    sendError(res, 'Failed to update message read state', 500);
  }
}
