import { Request, Response } from 'express';
import { createHash } from 'crypto';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    passwordResetToken: { deleteMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../src/utils/password-reset-email', () => ({
  isPasswordResetEmailConfigured: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';
import { forgotPassword, login, resetPassword } from '../src/controllers/auth.controller';
import { updateCurrentUserProfile } from '../src/controllers/user.controller';
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from '../src/utils/password-reset-email';

const database = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock };
  passwordResetToken: { deleteMany: jest.Mock; create: jest.Mock };
  $transaction: jest.Mock;
};
const mailer = {
  isConfigured: isPasswordResetEmailConfigured as jest.Mock,
  send: sendPasswordResetEmail as jest.Mock,
};

function responseMock() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return response as unknown as Response & typeof response;
}

function requestMock(body: Record<string, unknown>) {
  return {
    body,
    user: { id: 'user-1', name: 'A User', email: 'a@example.test', role: 'STUDENT', isVerified: false },
  } as unknown as Request;
}

describe('profile settings and password reset', () => {
  const originalMailEnvironment = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    CLIENT_URL: process.env.CLIENT_URL,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'mailer';
    process.env.SMTP_PASS = 'private-test-secret';
    process.env.SMTP_FROM = 'Abode <no-reply@example.test>';
    process.env.CLIENT_URL = 'https://abode.example.test';
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalMailEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('updates only validated profile fields and returns the public user shape', async () => {
    const user = { id: 'user-1', name: 'Updated Name', email: 'new@example.test', phone: null, role: 'STUDENT' };
    database.user.update.mockResolvedValue(user);
    const response = responseMock();

    await updateCurrentUserProfile(requestMock({
      name: ' Updated Name ',
      email: 'NEW@example.test',
      phone: '',
    }), response);

    expect(database.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: { name: 'Updated Name', email: 'new@example.test', phone: null },
      select: expect.not.objectContaining({ passwordHash: expect.anything() }),
    }));
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('rejects empty profile updates', async () => {
    const response = responseMock();
    await updateCurrentUserProfile(requestMock({}), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(database.user.update).not.toHaveBeenCalled();
  });

  it('returns a conflict when the updated email belongs to another account', async () => {
    database.user.update.mockRejectedValue({ code: 'P2002' });
    const response = responseMock();

    await updateCurrentUserProfile(requestMock({ email: 'duplicate@example.test' }), response);

    expect(response.status).toHaveBeenCalledWith(409);
  });

  it('uses a generic response and sends no email for an unknown account', async () => {
    mailer.isConfigured.mockReturnValue(true);
    database.user.findUnique.mockResolvedValue(null);
    const response = responseMock();

    await forgotPassword(requestMock({ email: 'unknown@example.test' }), response);

    expect(response.status).toHaveBeenCalledWith(202);
    expect(mailer.send).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'If an account exists for that email, a password reset link will be sent.',
    }));
  });

  it('stores only a token digest and mails the raw reset token', async () => {
    mailer.isConfigured.mockReturnValue(true);
    database.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'known@example.test' });
    database.$transaction.mockResolvedValue([]);
    mailer.send.mockResolvedValue(undefined);
    const response = responseMock();

    await forgotPassword(requestMock({ email: 'KNOWN@example.test' }), response);

    const rawToken = mailer.send.mock.calls[0][1] as string;
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(database.$transaction).toHaveBeenCalled();
    expect(database.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      }),
    });
    expect(mailer.send).toHaveBeenCalledWith('known@example.test', rawToken);
    expect(response.status).toHaveBeenCalledWith(202);
  });

  it('consumes an unexpired reset token once before updating the password', async () => {
    const token = 'a'.repeat(64);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const transaction = {
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reset-1', userId: 'user-1', expiresAt: new Date(Date.now() + 60_000), usedAt: null,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      user: { update: jest.fn().mockResolvedValue({ id: 'user-1' }) },
    };
    database.$transaction.mockImplementation((callback: (tx: typeof transaction) => unknown) => callback(transaction));
    const response = responseMock();

    await resetPassword(requestMock({ token, password: 'new-secure-password' }), response);

    expect(transaction.passwordResetToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash }, select: expect.any(Object) });
    expect(transaction.passwordResetToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'reset-1', tokenHash, usedAt: null }),
    }));
    expect(transaction.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: { passwordHash: expect.any(String) },
    }));
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('rejects expired reset tokens without updating the account', async () => {
    const transaction = {
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reset-1', userId: 'user-1', expiresAt: new Date(Date.now() - 1000), usedAt: null,
        }),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: { update: jest.fn() },
    };
    database.$transaction.mockImplementation((callback: (tx: typeof transaction) => unknown) => callback(transaction));
    const response = responseMock();

    await resetPassword(requestMock({ token: 'b'.repeat(64), password: 'new-secure-password' }), response);

    expect(transaction.passwordResetToken.updateMany).not.toHaveBeenCalled();
    expect(transaction.user.update).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it('rejects a reset token that has already been consumed', async () => {
    const transaction = {
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reset-1', userId: 'user-1', expiresAt: new Date(Date.now() + 60_000), usedAt: new Date(),
        }),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: { update: jest.fn() },
    };
    database.$transaction.mockImplementation((callback: (tx: typeof transaction) => unknown) => callback(transaction));
    const response = responseMock();

    await resetPassword(requestMock({ token: 'c'.repeat(64), password: 'new-secure-password' }), response);

    expect(transaction.passwordResetToken.updateMany).not.toHaveBeenCalled();
    expect(transaction.user.update).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it('allows login with a newly reset password', async () => {
    const password = 'brand-new-password';
    database.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'known@example.test',
      passwordHash: await bcrypt.hash(password, 10),
      role: 'STUDENT',
      isVerified: false,
      isActive: true,
      name: 'Known User',
      phone: null,
      profilePicture: null,
      createdAt: new Date(),
    });
    const response = responseMock();

    await login(requestMock({ email: 'known@example.test', password }), response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect((response.json as jest.Mock).mock.calls[0][0].data.user.passwordHash).toBeUndefined();
  });
});
