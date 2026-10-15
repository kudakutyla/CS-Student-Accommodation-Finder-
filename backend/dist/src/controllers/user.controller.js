"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUserProfile = getCurrentUserProfile;
exports.updateCurrentUserProfile = updateCurrentUserProfile;
exports.uploadCurrentUserProfilePicture = uploadCurrentUserProfilePicture;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const file_storage_1 = require("../utils/file-storage");
const updateCurrentUserSchema = zod_1.z.object({}).strict();
async function getCurrentUserProfile(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const user = await prisma_1.default.user.findUnique({
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
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { user });
    }
    catch (error) {
        console.error('getCurrentUserProfile error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch profile', 500);
    }
}
async function updateCurrentUserProfile(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const parsed = updateCurrentUserSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        (0, response_1.sendError)(res, 'Use the profile picture upload endpoint to change your photo.', 400);
    }
    catch (error) {
        console.error('updateCurrentUserProfile error:', error);
        (0, response_1.sendError)(res, 'Failed to update profile', 500);
    }
}
async function uploadCurrentUserProfilePicture(req, res) {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Authentication required', 401);
        return;
    }
    if (!req.file) {
        (0, response_1.sendError)(res, 'Choose an image to upload.', 400);
        return;
    }
    let stored;
    try {
        stored = await (0, file_storage_1.storeUploadedFile)(req.file, true);
        const profilePicture = `/media/profiles/${req.user.id}/${stored.filename}`;
        const existing = await prisma_1.default.user.findUnique({ where: { id: req.user.id }, select: { profilePicture: true } });
        const user = await prisma_1.default.user.update({
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
        if (oldFilename)
            await (0, file_storage_1.deleteStoredFile)(oldFilename);
        (0, response_1.sendSuccess)(res, { user }, 'Profile picture uploaded successfully');
    }
    catch (error) {
        if (stored)
            await (0, file_storage_1.deleteStoredFile)(stored.filename).catch(() => undefined);
        console.error('uploadCurrentUserProfilePicture error:', error);
        (0, response_1.sendError)(res, error instanceof Error ? error.message : 'Failed to upload profile picture', 400);
    }
}
