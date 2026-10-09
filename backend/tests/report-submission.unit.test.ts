import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    listing: { findUnique: jest.fn() },
    report: { create: jest.fn() },
    user: { findMany: jest.fn() },
    notification: { createMany: jest.fn() },
  },
}));

import prisma from '../src/config/prisma';
import { createReport } from '../src/controllers/report.controller';

const mockedListingFindUnique = prisma.listing.findUnique as jest.Mock;
const mockedReportCreate = prisma.report.create as jest.Mock;
const mockedUserFindMany = prisma.user.findMany as jest.Mock;
const mockedNotificationCreateMany = prisma.notification.createMany as jest.Mock;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function requestMock() {
  return {
    params: { id: 'listing-id' },
    body: { reason: 'Incorrect details', description: 'The details do not match the property.' },
    user: { id: 'student-id', email: 'student@example.com', role: 'STUDENT' },
  } as unknown as Request;
}

describe('student report submission', () => {
  const savedReport = { id: 'report-id', status: 'PENDING' };
  const listing = { id: 'listing-id', title: 'Student accommodation', approvalStatus: 'APPROVED' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedListingFindUnique.mockResolvedValue(listing);
    mockedReportCreate.mockResolvedValue(savedReport);
    mockedUserFindMany.mockResolvedValue([{ id: 'admin-id' }]);
    mockedNotificationCreateMany.mockResolvedValue({ count: 1 });
  });

  it('submits the report and notifies active admins', async () => {
    const response = responseMock();

    await createReport(requestMock(), response);

    expect(mockedReportCreate).toHaveBeenCalledWith({
      data: {
        userId: 'student-id',
        listingId: 'listing-id',
        reason: 'Incorrect details',
        description: 'The details do not match the property.',
        status: 'PENDING',
      },
      select: {
        id: true,
        userId: true,
        listingId: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(mockedUserFindMany).toHaveBeenCalledWith({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    expect(mockedNotificationCreateMany).toHaveBeenCalledWith({
      data: [{
        userId: 'admin-id',
        type: 'NEW_REPORT',
        title: 'A listing was reported',
        message: 'A student reported "Student accommodation" for Incorrect details.',
      }],
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      message: 'Report submitted successfully',
      data: savedReport,
    });
  });

  it('keeps the report submitted and explains when admin notification fails', async () => {
    const notificationError = new Error('Notification table unavailable');
    mockedNotificationCreateMany.mockRejectedValue(notificationError);
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = responseMock();

    await createReport(requestMock(), response);

    expect(mockedReportCreate).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(201);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      message: 'Report submitted successfully, but administrators could not be notified.',
      data: savedReport,
    });
    expect(logError).toHaveBeenCalledWith('createReport admin notification error:', notificationError);
    logError.mockRestore();
  });

  it('returns an error when saving the report fails', async () => {
    mockedReportCreate.mockRejectedValue(new Error('Report table unavailable'));
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = responseMock();

    await createReport(requestMock(), response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: false,
      message: 'Failed to submit report',
    });
    expect(mockedUserFindMany).not.toHaveBeenCalled();
    logError.mockRestore();
  });
});
