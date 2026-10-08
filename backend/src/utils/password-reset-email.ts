import nodemailer from 'nodemailer';

export function isPasswordResetEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM &&
    process.env.CLIENT_URL
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  if (!isPasswordResetEmailConfigured()) {
    throw new Error('SMTP password reset email is not configured.');
  }

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid TCP port.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const resetUrl = new URL('/reset-password', process.env.CLIENT_URL);
  resetUrl.searchParams.set('token', token);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset your Abode password',
    text: `Use this link to reset your password. It expires in 30 minutes and can only be used once:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
  });
}
