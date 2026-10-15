"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const file_storage_1 = require("../src/utils/file-storage");
describe('uploaded file validation and persistence', () => {
    let directory = '';
    let originalUploadDir;
    beforeEach(async () => {
        originalUploadDir = process.env.UPLOAD_DIR;
        directory = await (0, promises_1.mkdtemp)(path_1.default.join(os_1.default.tmpdir(), 'abode-uploads-'));
        process.env.UPLOAD_DIR = directory;
    });
    afterEach(async () => {
        if (originalUploadDir === undefined)
            delete process.env.UPLOAD_DIR;
        else
            process.env.UPLOAD_DIR = originalUploadDir;
        await (0, promises_1.rm)(directory, { recursive: true, force: true });
    });
    it('persists a signature-verified image under a generated filename', async () => {
        const file = {
            mimetype: 'image/png',
            buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        };
        const stored = await (0, file_storage_1.storeUploadedFile)(file, true);
        expect(stored.filename).toMatch(/^[0-9a-f-]{36}\.png$/i);
        expect(await (0, file_storage_1.readStoredFile)(stored.filename)).toEqual(file.buffer);
        await (0, file_storage_1.deleteStoredFile)(stored.filename);
        await expect((0, promises_1.readFile)(path_1.default.join(directory, stored.filename))).rejects.toMatchObject({ code: 'ENOENT' });
    });
    it('rejects a file whose bytes do not match its declared image MIME type', async () => {
        const file = {
            mimetype: 'image/png',
            buffer: Buffer.from('%PDF-1.7'),
        };
        await expect((0, file_storage_1.storeUploadedFile)(file, true)).rejects.toThrow(/does not match/i);
    });
});
