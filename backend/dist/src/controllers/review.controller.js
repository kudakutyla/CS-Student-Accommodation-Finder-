"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListingReviews = getListingReviews;
exports.createReview = createReview;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const reviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().min(3, 'Review comment must be at least 3 characters').max(1200),
});
async function getListingReviews(req, res) {
    try {
        const { id } = req.params;
        const listing = await prisma_1.default.listing.findUnique({ where: { id } });
        if (!listing) {
            (0, response_1.sendError)(res, 'Listing not found', 404);
            return;
        }
        if (listing.approvalStatus !== 'APPROVED') {
            (0, response_1.sendError)(res, 'Reviews are only available for approved listings.', 404);
            return;
        }
        const reviews = await prisma_1.default.review.findMany({
            where: { listingId: id },
            include: {
                user: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.sendSuccess)(res, reviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            user: review.user,
        })));
    }
    catch (error) {
        console.error('getListingReviews error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch reviews', 500);
    }
}
async function createReview(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (req.user.role !== 'STUDENT') {
            (0, response_1.sendError)(res, 'Only students can submit reviews.', 403);
            return;
        }
        const { id } = req.params;
        const parsed = reviewSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, response_1.sendError)(res, parsed.error.errors[0].message, 400);
            return;
        }
        const listing = await prisma_1.default.listing.findUnique({ where: { id } });
        if (!listing) {
            (0, response_1.sendError)(res, 'Listing not found', 404);
            return;
        }
        if (listing.approvalStatus !== 'APPROVED') {
            (0, response_1.sendError)(res, 'Only approved listings can be reviewed.', 400);
            return;
        }
        const existing = await prisma_1.default.review.findFirst({
            where: { userId: req.user.id, listingId: id },
        });
        if (existing) {
            (0, response_1.sendError)(res, 'You have already reviewed this listing.', 409);
            return;
        }
        const review = await prisma_1.default.review.create({
            data: {
                userId: req.user.id,
                listingId: id,
                rating: parsed.data.rating,
                comment: parsed.data.comment,
            },
            include: {
                user: {
                    select: { id: true, name: true },
                },
            },
        });
        (0, response_1.sendSuccess)(res, {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            user: review.user,
        }, 'Review submitted successfully', 201);
    }
    catch (error) {
        console.error('createReview error:', error);
        (0, response_1.sendError)(res, 'Failed to create review', 500);
    }
}
