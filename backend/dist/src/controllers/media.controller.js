"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListingPhoto = getListingPhoto;
exports.getProfilePicture = getProfilePicture;
exports.getMessageAttachment = getMessageAttachment;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const file_storage_1 = require("../utils/file-storage");
const contentTypes = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
};
function setFileHeaders(res, filename, inline, allowCrossOrigin = false) {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    res.setHeader('Content-Type', contentTypes[extension] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (allowCrossOrigin)
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${filename}"`);
}
async function getListingPhoto(req, res) {
    try {
        const { filename } = req.params;
        const photo = await prisma_1.default.listingPhoto.findFirst({
            where: { photoUrl: `/media/listings/${filename}` },
            include: { listing: { select: { approvalStatus: true, ownerId: true } } },
        });
        if (!photo) {
            (0, response_1.sendError)(res, 'Image not found', 404);
            return;
        }
        const canView = photo.listing.approvalStatus === 'APPROVED'
            || req.user?.role === 'ADMIN'
            || req.user?.id === photo.listing.ownerId;
        if (!canView) {
            (0, response_1.sendError)(res, 'This listing image is not publicly available.', 403);
            return;
        }
        const file = await (0, file_storage_1.readStoredFile)(filename);
        setFileHeaders(res, filename, true);
        res.send(file);
    }
    catch (error) {
        console.error('getListingPhoto error:', error);
        (0, response_1.sendError)(res, 'Image not found', 404);
    }
}
async function getProfilePicture(req, res) {
    try {
        const reference = `/media/profiles/${req.params.userId}/${req.params.filename}`;
        const user = await prisma_1.default.user.findUnique({ where: { id: req.params.userId }, select: { profilePicture: true } });
        if (!user || user.profilePicture !== reference) {
            (0, response_1.sendError)(res, 'Image not found', 404);
            return;
        }
        const file = await (0, file_storage_1.readStoredFile)(req.params.filename);
        setFileHeaders(res, req.params.filename, true, true);
        res.send(file);
    }
    catch (error) {
        console.error('getProfilePicture error:', error);
        (0, response_1.sendError)(res, 'Image not found', 404);
    }
}
async function getMessageAttachment(req, res) {
    try {
        const reference = `/media/messages/${req.params.filename}`;
        const message = await prisma_1.default.message.findFirst({
            where: { attachmentUrl: reference },
            include: { conversation: { select: { studentId: true, landlordId: true } } },
        });
        if (!message) {
            (0, response_1.sendError)(res, 'Attachment not found', 404);
            return;
        }
        if (!req.user || (req.user.id !== message.conversation.studentId && req.user.id !== message.conversation.landlordId)) {
            (0, response_1.sendError)(res, 'You do not have access to this attachment.', 403);
            return;
        }
        const file = await (0, file_storage_1.readStoredFile)(req.params.filename);
        setFileHeaders(res, req.params.filename, false);
        res.send(file);
    }
    catch (error) {
        console.error('getMessageAttachment error:', error);
        (0, response_1.sendError)(res, 'Attachment not found', 404);
    }
}
