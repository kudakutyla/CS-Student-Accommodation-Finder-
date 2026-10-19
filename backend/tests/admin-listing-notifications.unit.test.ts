import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    listing: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import prisma from '../src/config/prisma';
import { approveListing, rejectListing } from '../src/controllers/admin.controller';

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function requestMock(body: Record<string, unknown> = {}): Request {
  return {
    user: { id: 'admin-id', role: 'ADMIN' },
    params: { id: 'listing-id' },
    body,
  } as unknown as Request;
}

describe('Listing moderation notifications', () => {
  const findListing = prisma.listing.findUnique as jest.Mock;
  const transaction = prisma.$transaction as jest.Mock;
  const updateListing = jest.fn();
  const createAuditLog = jest.fn();
  const createNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const tx = {
      listing: { update: updateListing },
      auditLog: { create: createAuditLog },
      notification: { create: createNotification },
    };
    findListing.mockResolvedValue({
      id: 'listing-id',
      title: 'Student accommodation',
      ownerId: 'landlord-id',
      owner: { name: 'Landlord', email: 'landlord@example.com' },
    });
    updateListing.mockResolvedValue({ id: 'listing-id' });
    createAuditLog.mockResolvedValue({});
    createNotification.mockResolvedValue({});
    transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
  });

  it('includes the approved listing id in the landlord notification', async () => {
    const response = responseMock();

    await approveListing(requestMock(), response);

    expect(createNotification).toHaveBeenCalledWith({
      data: {
        userId: 'landlord-id',
        listingId: 'listing-id',
        type: 'LISTING_APPROVED',
        title: 'Listing approved',
        message: '"Student accommodation" is now visible to students.',
      },
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('includes the rejected listing id in the landlord notification', async () => {
    const response = responseMock();

    await rejectListing(requestMock({ reason: 'Missing required property details.' }), response);

    expect(createNotification).toHaveBeenCalledWith({
      data: {
        userId: 'landlord-id',
        listingId: 'listing-id',
        type: 'LISTING_REJECTED',
        title: 'Listing needs changes',
        message: '"Student accommodation" was not approved: Missing required property details.',
      },
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });
});
