"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeUploadedFile = storeUploadedFile;
exports.readStoredFile = readStoredFile;
exports.deleteStoredFile = deleteStoredFile;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const mimeExtensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
};
function hasValidSignature(buffer, mimetype) {
    if (mimetype === 'image/jpeg')
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimetype === 'image/png')
        return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (mimetype === 'image/webp')
        return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    if (mimetype === 'application/pdf')
        return buffer.toString('ascii', 0, 5) === '%PDF-';
    return false;
}
function getUploadDirectory() {
    return path_1.default.resolve(process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads'));
}
function getSafeUploadPath(filename) {
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(filename)) {
        throw new Error('Invalid stored file reference.');
    }
    return path_1.default.join(getUploadDirectory(), filename);
}
async function storeUploadedFile(file, imagesOnly = false) {
    const extension = mimeExtensions[file.mimetype];
    if (!extension || (imagesOnly && file.mimetype === 'application/pdf') || !hasValidSignature(file.buffer, file.mimetype)) {
        throw new Error('The selected file content does not match a supported file type.');
    }
    const filename = `${(0, crypto_1.randomUUID)()}.${extension}`;
    await (0, promises_1.mkdir)(getUploadDirectory(), { recursive: true });
    await (0, promises_1.writeFile)(getSafeUploadPath(filename), file.buffer, { flag: 'wx' });
    return { filename, mimetype: file.mimetype };
}
async function readStoredFile(filename) {
    return (0, promises_1.readFile)(getSafeUploadPath(filename));
}
async function deleteStoredFile(filename) {
    try {
        await (0, promises_1.unlink)(getSafeUploadPath(filename));
    }
    catch (error) {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'))
            throw error;
    }
}
