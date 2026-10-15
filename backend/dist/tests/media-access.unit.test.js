"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../src/config/prisma', () => ({
    __esModule: true,
    default: {
        listingPhoto: { findFirst: jest.fn() },
        user: { findUnique: jest.fn() },
        message: { findFirst: jest.fn() },
    },
}));
jest.mock('../src/utils/file-storage', () => ({ readStoredFile: jest.fn() }));
const prisma_1 = __importDefault(require("../src/config/prisma"));
const media_controller_1 = require("../src/controllers/media.controller");
const file_storage_1 = require("../src/utils/file-storage");
const mockedPrisma = prisma_1.default;
const mockedReadFile = file_storage_1.readStoredFile;
function responseMock() {
    const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };
    return response;
}
function requestMock(user) {
    return { params: { filename: '123e4567-e89b-12d3-a456-426614174000.jpg' }, user };
}
describe('uploaded media access rules', () => {
    beforeEach(() => jest.clearAllMocks());
    it('does not serve a pending listing image to a guest', async () => {
        mockedPrisma.listingPhoto.findFirst.mockResolvedValue({
            listing: { approvalStatus: 'PENDING', ownerId: 'landlord-1' },
        });
        const response = responseMock();
        await (0, media_controller_1.getListingPhoto)(requestMock(), response);
        expect(response.status).toHaveBeenCalledWith(403);
        expect(mockedReadFile).not.toHaveBeenCalled();
    });
    it('allows the listing owner to review their pending image', async () => {
        mockedPrisma.listingPhoto.findFirst.mockResolvedValue({
            listing: { approvalStatus: 'PENDING', ownerId: 'landlord-1' },
        });
        mockedReadFile.mockResolvedValue(Buffer.from('image'));
        const response = responseMock();
        await (0, media_controller_1.getListingPhoto)(requestMock({ id: 'landlord-1', role: 'LANDLORD' }), response);
        expect(response.send).toHaveBeenCalled();
    });
    it('restricts message attachments to conversation participants', async () => {
        mockedPrisma.message.findFirst.mockResolvedValue({
            conversation: { studentId: 'student-1', landlordId: 'landlord-1' },
        });
        const response = responseMock();
        await (0, media_controller_1.getMessageAttachment)(requestMock({ id: 'other-user', role: 'STUDENT' }), response);
        expect(response.status).toHaveBeenCalledWith(403);
        expect(mockedReadFile).not.toHaveBeenCalled();
    });
});
