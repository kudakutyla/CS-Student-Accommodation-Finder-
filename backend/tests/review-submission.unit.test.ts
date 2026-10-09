import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    listing: { findUnique: jest.fn() },
    review: { findFirst: jest.fn(), create: jest.fn() },
  },
}));

import prisma from '../src/config/prisma';
import { createReview } from '../src/controllers/review.controller';

const mockedListingFindUnique = prisma.listing.findUnique as jest.Mock;
const mockedReviewFindFirst = prisma.review.findFirst as jest.Mock;
const mockedReviewCreate = prisma.review.create as jest.Mock;

function responseMock() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return response as unknown as Response & typeof response;
}

function requestMock(body: unknown) {
  return {
    params: { id: 'listing-id' },
    body,
    user: { id: 'student-id', email: 'student@example.com', role: 'STUDENT' },
  } as unknown as Request;
}

describe('student review submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListingFindUnique.mockResolvedValue({ id: 'listing-id', approvalStatus: 'APPROVED' });
    mockedReviewFindFirst.mockResolvedValue(null);
    mockedReviewCreate.mockImplementation(async ({ data }) => ({
      ...data,
      id: 'review-id',
      createdAt: new Date('2026-10-09T09:00:00Z'),
      user: { id: 'student-id', name: 'Student' },
    }));
  });

  it.each([
    ['omitted comment', { rating: 5 }, ''],
    ['blank comment', { rating: 4, comment: '' }, ''],
    ['whitespace-only comment', { rating: 3, comment: '   ' }, ''],
    ['provided comment', { rating: 2, comment: 'Good place' }, 'Good place'],
  ])('submits a rating with an optional %s', async (_description, body, comment) => {
    const response = responseMock();

    await createReview(requestMock(body), response);

    expect(mockedReviewCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        userId: 'student-id',
        listingId: 'listing-id',
        rating: body.rating,
        comment,
      },
      include: { user: { select: { id: true, name: true } } },
    }));
    expect(response.status).toHaveBeenCalledWith(201);
    expect((response.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      success: true,
      data: { rating: body.rating, comment },
    });
  });

  it('rejects a non-empty comment shorter than three characters', async () => {
    const response = responseMock();

    await createReview(requestMock({ rating: 5, comment: 'ok' }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect((response.json as jest.Mock).mock.calls[0][0].message).toBe('Review comment must be at least 3 characters');
    expect(mockedReviewCreate).not.toHaveBeenCalled();
  });
});
