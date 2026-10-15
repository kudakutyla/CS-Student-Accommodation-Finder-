import { mkdtemp, readFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import type { Express } from 'express';
import { deleteStoredFile, readStoredFile, storeUploadedFile } from '../src/utils/file-storage';

describe('uploaded file validation and persistence', () => {
  let directory = '';
  let originalUploadDir: string | undefined;

  beforeEach(async () => {
    originalUploadDir = process.env.UPLOAD_DIR;
    directory = await mkdtemp(path.join(os.tmpdir(), 'abode-uploads-'));
    process.env.UPLOAD_DIR = directory;
  });

  afterEach(async () => {
    if (originalUploadDir === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = originalUploadDir;
    await rm(directory, { recursive: true, force: true });
  });

  it('persists a signature-verified image under a generated filename', async () => {
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    } as Express.Multer.File;

    const stored = await storeUploadedFile(file, true);

    expect(stored.filename).toMatch(/^[0-9a-f-]{36}\.png$/i);
    expect(await readStoredFile(stored.filename)).toEqual(file.buffer);
    await deleteStoredFile(stored.filename);
    await expect(readFile(path.join(directory, stored.filename))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects a file whose bytes do not match its declared image MIME type', async () => {
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from('%PDF-1.7'),
    } as Express.Multer.File;

    await expect(storeUploadedFile(file, true)).rejects.toThrow(/does not match/i);
  });
});
