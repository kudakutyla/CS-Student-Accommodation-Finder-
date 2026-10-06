"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageAttachmentUpload = exports.profilePictureUpload = exports.listingPhotosUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const documentTypes = new Set([...imageTypes, 'application/pdf']);
function createUpload(allowedTypes, fileSize, files) {
    return (0, multer_1.default)({
        storage: multer_1.default.memoryStorage(),
        limits: { fileSize, files },
        fileFilter: (_req, file, callback) => {
            if (!allowedTypes.has(file.mimetype)) {
                callback(new Error('Choose a supported image or PDF file.'));
                return;
            }
            callback(null, true);
        },
    });
}
exports.listingPhotosUpload = createUpload(imageTypes, 5 * 1024 * 1024, 8).array('photos', 8);
exports.profilePictureUpload = createUpload(imageTypes, 5 * 1024 * 1024, 1).single('picture');
exports.messageAttachmentUpload = createUpload(documentTypes, 10 * 1024 * 1024, 1).single('attachment');
