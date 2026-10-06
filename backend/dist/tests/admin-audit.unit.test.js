"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../src/config/prisma', () => ({
    __esModule: true,
    default: { auditLog: { findMany: jest.fn() } },
}));
const prisma_1 = __importDefault(require("../src/config/prisma"));
const admin_controller_1 = require("../src/controllers/admin.controller");
const mockedFindMany = prisma_1.default.auditLog.findMany;
function responseMock() {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    return response;
}
function requestMock(query) {
    return { query };
}
describe('admin audit query filters', () => {
    beforeEach(() => jest.clearAllMocks());
    it('applies category and inclusive date range filters in the database query', async () => {
        mockedFindMany.mockResolvedValue([]);
        const response = responseMock();
        await (0, admin_controller_1.getAdminAuditLogs)(requestMock({ from: '2026-10-01', to: '2026-10-06', targetType: 'REPORT' }), response);
        expect(mockedFindMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                targetType: 'REPORT',
                createdAt: {
                    gte: new Date('2026-10-01T00:00:00.000Z'),
                    lt: new Date('2026-10-07T00:00:00.000Z'),
                },
            },
        }));
        expect(response.status).toHaveBeenCalledWith(200);
    });
    it('rejects invalid calendar dates before querying', async () => {
        const response = responseMock();
        await (0, admin_controller_1.getAdminAuditLogs)(requestMock({ from: '2026-02-30' }), response);
        expect(response.status).toHaveBeenCalledWith(400);
        expect(mockedFindMany).not.toHaveBeenCalled();
    });
});
