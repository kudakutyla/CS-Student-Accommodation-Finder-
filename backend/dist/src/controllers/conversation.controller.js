"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyConversations = getMyConversations;
exports.createConversation = createConversation;
exports.getConversationMessages = getConversationMessages;
exports.createMessage = createMessage;
exports.markConversationAsRead = markConversationAsRead;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const file_storage_1 = require("../utils/file-storage");
const messageSchema = zod_1.z.object({
    content: zod_1.z.string().max(4000).trim().optional().default(''),
});
async function getMyConversations(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const conversations = await prisma_1.default.conversation.findMany({
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
        (0, response_1.sendSuccess)(res, conversations.map((conversation) => ({
            ...conversation,
            lastMessage: conversation.messages[0] || null,
        })));
    }
    catch (error) {
        console.error('getMyConversations error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch conversations', 500);
    }
}
async function createConversation(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { listingId } = req.body;
        if (!listingId) {
            (0, response_1.sendError)(res, 'Listing ID is required', 400);
            return;
        }
        if (req.user.role !== 'STUDENT') {
            (0, response_1.sendError)(res, 'Only students can start listing enquiries.', 403);
            return;
        }
        const listing = await prisma_1.default.listing.findUnique({
            where: { id: listingId },
            include: { owner: true },
        });
        if (!listing) {
            (0, response_1.sendError)(res, 'Listing not found', 404);
            return;
        }
        if (listing.approvalStatus !== 'APPROVED') {
            (0, response_1.sendError)(res, 'Enquiries are only available for approved listings.', 400);
            return;
        }
        const existing = await prisma_1.default.conversation.findFirst({
            where: {
                studentId: req.user.id,
                landlordId: listing.ownerId,
                listingId,
            },
        });
        if (existing) {
            (0, response_1.sendSuccess)(res, existing, 'Conversation already exists');
            return;
        }
        const conversation = await prisma_1.default.conversation.create({
            data: {
                studentId: req.user.id,
                landlordId: listing.ownerId,
                listingId,
            },
        });
        (0, response_1.sendSuccess)(res, conversation, 'Conversation created successfully', 201);
    }
    catch (error) {
        console.error('createConversation error:', error);
        (0, response_1.sendError)(res, 'Failed to create conversation', 500);
    }
}
async function getConversationMessages(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const conversation = await prisma_1.default.conversation.findUnique({
            where: { id },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        if (!conversation) {
            (0, response_1.sendError)(res, 'Conversation not found', 404);
            return;
        }
        if (conversation.studentId !== req.user.id && conversation.landlordId !== req.user.id) {
            (0, response_1.sendError)(res, 'You do not have access to this conversation.', 403);
            return;
        }
        (0, response_1.sendSuccess)(res, conversation.messages);
    }
    catch (error) {
        console.error('getConversationMessages error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch messages', 500);
    }
}
async function createMessage(req, res) {
    let storedAttachment;
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const parsed = messageSchema.safeParse(req.body);
        const uploadedFile = req.file;
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        if (!parsed.data.content.trim() && !uploadedFile) {
            (0, response_1.sendError)(res, 'Write a message or attach a document before sending.', 400);
            return;
        }
        const conversation = await prisma_1.default.conversation.findUnique({
            where: { id },
            include: { listing: { select: { title: true } } },
        });
        if (!conversation) {
            (0, response_1.sendError)(res, 'Conversation not found', 404);
            return;
        }
        if (conversation.studentId !== req.user.id && conversation.landlordId !== req.user.id) {
            (0, response_1.sendError)(res, 'You do not have access to this conversation.', 403);
            return;
        }
        const receiverId = req.user.id === conversation.studentId ? conversation.landlordId : conversation.studentId;
        if (uploadedFile)
            storedAttachment = await (0, file_storage_1.storeUploadedFile)(uploadedFile);
        const attachmentUrl = storedAttachment ? `/media/messages/${storedAttachment.filename}` : null;
        const attachmentName = uploadedFile?.originalname.slice(0, 255) || null;
        const attachmentType = storedAttachment?.mimetype || null;
        const message = await prisma_1.default.$transaction(async (tx) => {
            const savedMessage = await tx.message.create({
                data: {
                    conversationId: id,
                    senderId: req.user.id,
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
        (0, response_1.sendSuccess)(res, message, 'Message sent successfully', 201);
    }
    catch (error) {
        if (storedAttachment)
            await (0, file_storage_1.deleteStoredFile)(storedAttachment.filename).catch(() => undefined);
        console.error('createMessage error:', error);
        (0, response_1.sendError)(res, error instanceof Error && error.message.includes('file content') ? error.message : 'Failed to send message', error instanceof Error && error.message.includes('file content') ? 400 : 500);
    }
}
async function markConversationAsRead(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const conversation = await prisma_1.default.conversation.findUnique({ where: { id } });
        if (!conversation) {
            (0, response_1.sendError)(res, 'Conversation not found', 404);
            return;
        }
        if (conversation.studentId !== req.user.id && conversation.landlordId !== req.user.id) {
            (0, response_1.sendError)(res, 'You do not have access to this conversation.', 403);
            return;
        }
        await prisma_1.default.message.updateMany({
            where: {
                conversationId: id,
                receiverId: req.user.id,
            },
            data: { isRead: true },
        });
        (0, response_1.sendSuccess)(res, { conversationId: id, updated: true }, 'Messages marked as read');
    }
    catch (error) {
        console.error('markConversationAsRead error:', error);
        (0, response_1.sendError)(res, 'Failed to update message read state', 500);
    }
}
