"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../src/config/prisma', () => ({
    __esModule: true,
    default: {
        listing: { findUnique: jest.fn() },
        favourite: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
        conversation: { findFirst: jest.fn(), create: jest.fn() },
        review: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
        report: { findUnique: jest.fn() },
        $transaction: jest.fn(),
    },
}));
const prisma_1 = __importDefault(require("../src/config/prisma"));
const favourite_controller_1 = require("../src/controllers/favourite.controller");
const conversation_controller_1 = require("../src/controllers/conversation.controller");
const review_controller_1 = require("../src/controllers/review.controller");
const report_controller_1 = require("../src/controllers/report.controller");
const mockedPrisma = prisma_1.default;
function responseMock() {
    const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    return response;
}
function requestMock(role, body = {}) {
    return {
        user: { id: 'student-1', name: 'Student', email: 'student@example.test', role, isVerified: false },
        params: { id: 'listing-1' },
        body,
    };
}
describe('student decision workflow authorization', () => {
    beforeEach(() => jest.clearAllMocks());
    it('rejects favourites for listings that are not approved', async () => {
        mockedPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', approvalStatus: 'PENDING' });
        const response = responseMock();
        await (0, favourite_controller_1.addFavourite)(requestMock('STUDENT'), response);
        expect(response.status).toHaveBeenCalledWith(400);
        expect(mockedPrisma.favourite.upsert).not.toHaveBeenCalled();
    });
    it('adds a favourite through the unique key so retries cannot create duplicates', async () => {
        mockedPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', approvalStatus: 'APPROVED' });
        mockedPrisma.favourite.upsert.mockResolvedValue({ id: 'favourite-1', listingId: 'listing-1' });
        const response = responseMock();
        await (0, favourite_controller_1.addFavourite)(requestMock('STUDENT'), response);
        expect(mockedPrisma.favourite.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { userId_listingId: { userId: 'student-1', listingId: 'listing-1' } },
            update: {},
        }));
        expect(response.status).toHaveBeenCalledWith(200);
    });
    it('removes only the authenticated student\'s favourite and is safe when repeated', async () => {
        mockedPrisma.favourite.deleteMany.mockResolvedValue({ count: 0 });
        const response = responseMock();
        await (0, favourite_controller_1.removeFavourite)(requestMock('STUDENT'), response);
        expect(mockedPrisma.favourite.deleteMany).toHaveBeenCalledWith({
            where: { userId: 'student-1', listingId: 'listing-1' },
        });
        expect(response.status).toHaveBeenCalledWith(200);
    });
    it('derives the enquiry landlord from the listing and rejects landlord initiation', async () => {
        const response = responseMock();
        await (0, conversation_controller_1.createConversation)(requestMock('LANDLORD', { listingId: 'listing-1', studentId: 'victim-id' }), response);
        expect(response.status).toHaveBeenCalledWith(403);
        expect(mockedPrisma.conversation.create).not.toHaveBeenCalled();
        mockedPrisma.listing.findUnique.mockResolvedValue({
            id: 'listing-1', ownerId: 'real-landlord', approvalStatus: 'APPROVED',
        });
        mockedPrisma.conversation.findFirst.mockResolvedValue(null);
        mockedPrisma.conversation.create.mockResolvedValue({ id: 'conversation-1' });
        const studentResponse = responseMock();
        await (0, conversation_controller_1.createConversation)(requestMock('STUDENT', {
            listingId: 'listing-1', landlordId: 'attacker-id', studentId: 'victim-id',
        }), studentResponse);
        expect(mockedPrisma.conversation.create).toHaveBeenCalledWith({
            data: { studentId: 'student-1', landlordId: 'real-landlord', listingId: 'listing-1' },
        });
    });
    it('does not expose reviews for listings that are not approved', async () => {
        mockedPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', approvalStatus: 'PENDING' });
        const response = responseMock();
        await (0, review_controller_1.getListingReviews)(requestMock('STUDENT'), response);
        expect(response.status).toHaveBeenCalledWith(404);
        expect(mockedPrisma.review.findMany).not.toHaveBeenCalled();
    });
    it('updates report status with an audit record and reporter-only notification', async () => {
        mockedPrisma.report.findUnique.mockResolvedValue({
            id: 'report-1',
            userId: 'reporter-1',
            status: 'PENDING',
            listing: { title: 'Campus House' },
        });
        const tx = {
            report: { update: jest.fn().mockResolvedValue({ id: 'report-1', status: 'IN_REVIEW' }) },
            auditLog: { create: jest.fn().mockResolvedValue({}) },
            notification: { create: jest.fn().mockResolvedValue({}) },
        };
        mockedPrisma.$transaction.mockImplementation((callback) => callback(tx));
        const response = responseMock();
        await (0, report_controller_1.updateReportStatus)(requestMock('ADMIN', { status: 'IN_REVIEW', adminReviewNote: 'We are checking the listing details.' }), response);
        expect(tx.report.update).toHaveBeenCalledWith({
            where: { id: 'report-1' },
            data: { status: 'IN_REVIEW', adminReviewNote: 'We are checking the listing details.' },
        });
        expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ action: 'UPDATE_REPORT_STATUS', targetId: 'report-1' }),
        }));
        expect(tx.notification.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                userId: 'reporter-1',
                type: 'REPORT_STATUS',
                message: expect.stringContaining('We are checking the listing details.'),
            }),
        }));
        expect(response.status).toHaveBeenCalledWith(200);
    });
});
