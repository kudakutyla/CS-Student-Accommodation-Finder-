"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyFavourites = getMyFavourites;
exports.addFavourite = addFavourite;
exports.removeFavourite = removeFavourite;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
async function getMyFavourites(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (req.user.role !== 'STUDENT') {
            (0, response_1.sendError)(res, 'Only students can access favourites.', 403);
            return;
        }
        const favourites = await prisma_1.default.favourite.findMany({
            where: {
                userId: req.user.id,
                listing: { approvalStatus: 'APPROVED' },
            },
            include: {
                listing: {
                    include: {
                        campus: true,
                        photos: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.sendSuccess)(res, favourites.map((entry) => ({
            id: entry.id,
            listingId: entry.listingId,
            createdAt: entry.createdAt,
            listing: entry.listing,
        })));
    }
    catch (error) {
        console.error('getMyFavourites error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch favourites', 500);
    }
}
async function addFavourite(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (req.user.role !== 'STUDENT') {
            (0, response_1.sendError)(res, 'Only students can manage favourites.', 403);
            return;
        }
        const { id } = req.params;
        const listing = await prisma_1.default.listing.findUnique({ where: { id } });
        if (!listing) {
            (0, response_1.sendError)(res, 'Listing not found', 404);
            return;
        }
        if (listing.approvalStatus !== 'APPROVED') {
            (0, response_1.sendError)(res, 'Only approved listings can be added to favourites.', 400);
            return;
        }
        const favourite = await prisma_1.default.favourite.upsert({
            where: {
                userId_listingId: {
                    userId: req.user.id,
                    listingId: id,
                },
            },
            create: {
                userId: req.user.id,
                listingId: id,
            },
            update: {},
        });
        (0, response_1.sendSuccess)(res, {
            id: favourite.id,
            listingId: favourite.listingId,
            isFavourite: true,
        }, 'Listing added to favourites');
    }
    catch (error) {
        console.error('addFavourite error:', error);
        (0, response_1.sendError)(res, 'Failed to update favourite', 500);
    }
}
async function removeFavourite(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (req.user.role !== 'STUDENT') {
            (0, response_1.sendError)(res, 'Only students can manage favourites.', 403);
            return;
        }
        await prisma_1.default.favourite.deleteMany({
            where: { userId: req.user.id, listingId: req.params.id },
        });
        (0, response_1.sendSuccess)(res, { listingId: req.params.id, isFavourite: false }, 'Favourite removed');
    }
    catch (error) {
        console.error('removeFavourite error:', error);
        (0, response_1.sendError)(res, 'Failed to update favourite', 500);
    }
}
