import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';

const mimeExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

function hasValidSignature(buffer: Buffer, mimetype: string): boolean {
  if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimetype === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (mimetype === 'application/pdf') return buffer.toString('ascii', 0, 5) === '%PDF-';
  return false;
}

function getUploadDirectory(): string {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
}

function getSafeUploadPath(filename: string): string {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(filename)) {
    throw new Error('Invalid stored file reference.');
  }
  return path.join(getUploadDirectory(), filename);
}

export async function storeUploadedFile(file: Express.Multer.File, imagesOnly = false): Promise<{ filename: string; mimetype: string }> {
  const extension = mimeExtensions[file.mimetype];
  if (!extension || (imagesOnly && file.mimetype === 'application/pdf') || !hasValidSignature(file.buffer, file.mimetype)) {
    throw new Error('The selected file content does not match a supported file type.');
  }

  const filename = `${randomUUID()}.${extension}`;
  await mkdir(getUploadDirectory(), { recursive: true });
  await writeFile(getSafeUploadPath(filename), file.buffer, { flag: 'wx' });
  return { filename, mimetype: file.mimetype };
}

export async function readStoredFile(filename: string): Promise<Buffer> {
  return readFile(getSafeUploadPath(filename));
}

export async function deleteStoredFile(filename: string): Promise<void> {
  try {
    await unlink(getSafeUploadPath(filename));
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
  }
}