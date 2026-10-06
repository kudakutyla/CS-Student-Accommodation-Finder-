import { Request, Response } from 'express';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    listingPhoto: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    message: { findFirst: jest.fn() },
  },
}));

jest.mock('../src/utils/file-storage', () => ({ readStoredFile: jest.fn() }));

import prisma from '../src/config/prisma';
import { getListingPhoto, getMessageAttachment, getProfilePicture } from '../src/controllers/media.controller';
import { readStoredFile } from '../src/utils/file-storage';

const mockedPrisma = prisma as unknown as {
  listingPhoto: { findFirst: jest.Mock };
  user: { findUnique: jest.Mock };
  message: { findFirst: jest.Mock };
};
const mockedReadFile = readStoredFile as jest.MockedFunction<typeof readStoredFile>;

function responseMock() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return response as unknown as Response & typeof response;
}

function requestMock(user?: Request['user']): Request {
  return { params: { filename: '123e4567-e89b-12d3-a456-426614174000.jpg' }, user } as unknown as Request;
}

describe('uploaded media access rules', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not serve a pending listing image to a guest', async () => {
    mockedPrisma.listingPhoto.findFirst.mockResolvedValue({
      listing: { approvalStatus: 'PENDING', ownerId: 'landlord-1' },
    });
    const response = responseMock();

    await getListingPhoto(requestMock(), response);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(mockedReadFile).not.toHaveBeenCalled();
  });

  it('allows the listing owner to review their pending image', async () => {
    mockedPrisma.listingPhoto.findFirst.mockResolvedValue({
      listing: { approvalStatus: 'PENDING', ownerId: 'landlord-1' },
    });
    mockedReadFile.mockResolvedValue(Buffer.from('image'));
    const response = responseMock();

    await getListingPhoto(requestMock({ id: 'landlord-1', role: 'LANDLORD' } as Request['user']), response);

    expect(response.send).toHaveBeenCalled();
  });

  it('allows profile images to load across the frontend and API origins', async () => {
    const filename = '123e4567-e89b-12d3-a456-426614174000.png';
    mockedPrisma.user.findUnique.mockResolvedValue({ profilePicture: `/media/profiles/user-1/${filename}` });
    mockedReadFile.mockResolvedValue(Buffer.from('image'));
    const response = responseMock();

    await getProfilePicture({ params: { userId: 'user-1', filename } } as unknown as Request, response);

    expect(response.setHeader).toHaveBeenCalledWith('Cross-Origin-Resource-Policy', 'cross-origin');
    expect(response.send).toHaveBeenCalled();
  });

  it('restricts message attachments to conversation participants', async () => {
    mockedPrisma.message.findFirst.mockResolvedValue({
      conversation: { studentId: 'student-1', landlordId: 'landlord-1' },
    });
    const response = responseMock();

    await getMessageAttachment(requestMock({ id: 'other-user', role: 'STUDENT' } as Request['user']), response);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(mockedReadFile).not.toHaveBeenCalled();
  });
});
