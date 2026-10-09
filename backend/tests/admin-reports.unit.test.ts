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

const findMany = prisma.report.findMany as jest.MockedFunction<typeof prisma.report.findMany>;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

describe('admin report retrieval', () => {
 beforeEach(() => jest.clearAllMocks());

 it('selects only fields required by the report directory', async () => {
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
    findMany.mockResolvedValue(reports);
    const response = responseMock();

    await getAdminReports({} as Request, response);

    expect(findMany).toHaveBeenCalledWith({
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
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({ success: true, data: reports });
  });

  it('surfaces a retrieval failure instead of returning an empty success', async () => {
    findMany.mockRejectedValue(new Error('database query failed'));
    const response = responseMock();
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await getAdminReports({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to fetch reports',
    });
    expect(error).toHaveBeenCalledWith('getAdminReports error:', expect.any(Error));
  });

  it('updates status without writing the optional review-note column', async () => {
    const reportUpdate = jest.fn().mockResolvedValue({ id: 'report-1', status: 'RESOLVED' });
    const auditCreate = jest.fn().mockResolvedValue({});
    const notificationCreate = jest.fn().mockResolvedValue({});
    const transaction = {
      report: { update: reportUpdate },
      auditLog: { create: auditCreate },
      notification: { create: notificationCreate },
    };
    prisma.report.findUnique = jest.fn().mockResolvedValue({
      id: 'report-1',
      userId: 'reporter-1',
      status: 'IN_REVIEW',
      listing: { title: 'Campus House' },
    }) as typeof prisma.report.findUnique;
    prisma.$transaction = jest.fn().mockImplementation((callback) => callback(transaction)) as typeof prisma.$transaction;
    const response = responseMock();

    await updateReportStatus({
      params: { id: 'report-1' },
      body: { status: 'RESOLVED', adminReviewNote: 'We checked the concern.' },
      user: { id: 'admin-1', role: 'ADMIN' },
    } as unknown as Request, response);

    expect(reportUpdate).toHaveBeenCalledWith({
      where: { id: 'report-1' },
      data: { status: 'RESOLVED' },
      select: { id: true, status: true, updatedAt: true },
    });
    expect(auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ description: expect.stringContaining('We checked the concern.') }),
    }));
    expect(notificationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'reporter-1',
        message: expect.stringContaining('We checked the concern.'),
      }),
    }));
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it.each([
    ['IN_REVIEW', 'PENDING'],
    ['RESOLVED', 'IN_REVIEW'],
    ['DISMISSED', 'IN_REVIEW'],
  ] as const)('notifies the reporting student when status changes to %s', async (status, previousStatus) => {
    const reportUpdate = jest.fn().mockResolvedValue({ id: 'report-1', status });
    const auditCreate = jest.fn().mockResolvedValue({});
    const notificationCreate = jest.fn().mockResolvedValue({});
    const transaction = {
      report: { update: reportUpdate },
      auditLog: { create: auditCreate },
      notification: { create: notificationCreate },
    };
    prisma.report.findUnique = jest.fn().mockResolvedValue({
      id: 'report-1',
      userId: 'reporter-1',
      status: previousStatus,
      listing: { title: 'Campus House' },
    }) as typeof prisma.report.findUnique;
    prisma.$transaction = jest.fn().mockImplementation((callback) => callback(transaction)) as typeof prisma.$transaction;
    const response = responseMock();

    await updateReportStatus({
      params: { id: 'report-1' },
      body: { status },
      user: { id: 'admin-1', role: 'ADMIN' },
    } as unknown as Request, response);

    expect(reportUpdate).toHaveBeenCalledWith({
      where: { id: 'report-1' },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });
    expect(notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'reporter-1',
        type: 'REPORT_STATUS',
        title: 'Your report was reviewed',
        message: `Your report about "Campus House" is now ${status.toLowerCase().replace('_', ' ')}.`,
      },
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('does not report success if the student update cannot be persisted', async () => {
    const notificationCreate = jest.fn().mockRejectedValue(new Error('notification write failed'));
    const transaction = {
      report: { update: jest.fn().mockResolvedValue({ id: 'report-1', status: 'RESOLVED' }) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      notification: { create: notificationCreate },
    };
    prisma.report.findUnique = jest.fn().mockResolvedValue({
      id: 'report-1',
      userId: 'reporter-1',
      status: 'IN_REVIEW',
      listing: { title: 'Campus House' },
    }) as typeof prisma.report.findUnique;
    prisma.$transaction = jest.fn().mockImplementation((callback) => callback(transaction)) as typeof prisma.$transaction;
    const response = responseMock();
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await updateReportStatus({
      params: { id: 'report-1' },
      body: { status: 'RESOLVED' },
      user: { id: 'admin-1', role: 'ADMIN' },
    } as unknown as Request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to update report status',
    });
    expect(error).toHaveBeenCalledWith('updateReportStatus error:', expect.any(Error));
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
