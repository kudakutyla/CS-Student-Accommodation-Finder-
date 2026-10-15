import multer from 'multer';

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const documentTypes = new Set([...imageTypes, 'application/pdf']);

function createUpload(allowedTypes: Set<string>, fileSize: number, files: number) {
  return multer({
    storage: multer.memoryStorage(),
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

export const listingPhotosUpload = createUpload(imageTypes, 5 * 1024 * 1024, 8).array('photos', 8);
export const profilePictureUpload = createUpload(imageTypes, 5 * 1024 * 1024, 1).single('picture');
export const messageAttachmentUpload = createUpload(documentTypes, 10 * 1024 * 1024, 1).single('attachment');