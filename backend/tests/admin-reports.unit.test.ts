import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    report: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import prisma from '../src/config/prisma';
import { getAdminReports, updateReportStatus } from '../src/controllers/report.controller';

const mockedFindMany = prisma.report.findMany as jest.MockedFunction<typeof prisma.report.findMany>;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('admin report listing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('selects only report fields used by the admin page and returns reports', async () => {
    const reports = [{
      id: 'report-1',
      reason: 'Misleading listing',
      description: 'The listing details do not match the property.',
      status: 'PENDING' as const,
      createdAt: new Date('2026-10-08T09:00:00.000Z'),
      updatedAt: new Date('2026-10-08T09:00:00.000Z'),
      userId: 'student-1',
      listingId: 'listing-1',
      adminReviewNote: null,
      listing: { id: 'listing-1', title: 'Student room', approvalStatus: 'APPROVED' },
      user: { id: 'student-1', name: 'Student', email: 'student@example.com' },
    }];
    mockedFindMany.mockResolvedValue(reports);
    const response = responseMock();

    await getAdminReports({} as Request, response);

    expect(mockedFindMany).toHaveBeenCalledWith({
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        listing: { select: { id: true, title: true, approvalStatus: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      data: reports,
    });
  });

  describe('admin report status notifications', () => {
    const mockedFindUnique = prisma.report.findUnique as jest.Mock;
    const mockedTransaction = prisma.$transaction as jest.Mock;
    const report = {
      id: 'report-1',
      userId: 'student-1',
      status: 'PENDING',
      listing: { title: 'Student room' },
    };

    beforeEach(() => jest.clearAllMocks());

    it.each([
      ['IN_REVIEW', 'in review'],
      ['RESOLVED', 'resolved'],
      ['DISMISSED', 'dismissed'],
    ] as const)('updates to %s and notifies the reporting student', async (status, readableStatus) => {
      const savedReport = { id: report.id, status, updatedAt: new Date('2026-10-08T09:00:00.000Z') };
      const transaction = {
        report: { update: jest.fn().mockResolvedValue(savedReport) },
        auditLog: { create: jest.fn().mockResolvedValue({}) },
        notification: { create: jest.fn().mockResolvedValue({}) },
      };
      mockedFindUnique.mockResolvedValue(report);
      mockedTransaction.mockImplementation(async (callback) => callback(transaction));
      const response = responseMock();

      await updateReportStatus(
        {
          params: { id: report.id },
          user: { id: 'admin-1' },
          body: { status, adminReviewNote: '  We reviewed your report.  ' },
        } as unknown as Request,
        response
      );

      expect(mockedFindUnique).toHaveBeenCalledWith({
        where: { id: report.id },
        select: {
          id: true,
          userId: true,
          status: true,
          listing: { select: { title: true } },
        },
      });
      expect(transaction.report.update).toHaveBeenCalledWith({
        where: { id: report.id },
        data: { status },
        select: { id: true, status: true, updatedAt: true },
      });
      expect(transaction.auditLog.create).toHaveBeenCalled();
      expect(transaction.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'student-1',
          type: 'REPORT_STATUS',
          title: 'Your report was reviewed',
          message: `Your report about "Student room" is now ${readableStatus}.\n\nAdmin note: We reviewed your report.`,
        },
      });
      expect(response.status).toHaveBeenCalledWith(200);
      expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
        success: true,
        data: savedReport,
      });
    });
  });
});
