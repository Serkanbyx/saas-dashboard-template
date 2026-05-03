import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const maxUploadSizeBytes = 5 * 1024 * 1024;

const imageMimeTypes = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const createFileFilter = (allowedFormats) => {
  const allowedMimeTypes = new Set(allowedFormats.map((format) => imageMimeTypes[format]));

  return (_req, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(createHttpError(400, `Only ${allowedFormats.join(', ')} image files are allowed.`));
  };
};

const createCloudinaryStorage = ({ folder, allowedFormats, transformation }) => ({
  _handleFile(_req, file, callback) {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: allowedFormats,
        resource_type: 'image',
        transformation,
      },
      (error, result) => {
        if (error) {
          callback(error);
          return;
        }

        callback(null, {
          publicId: result.public_id,
          url: result.secure_url,
          size: result.bytes,
          format: result.format,
        });
      },
    );

    file.stream.pipe(uploadStream);
  },

  _removeFile(_req, file, callback) {
    if (!file.publicId) {
      callback(null);
      return;
    }

    cloudinary.uploader.destroy(file.publicId, callback);
  },
});

const createUploadMiddleware = (options) =>
  multer({
    storage: createCloudinaryStorage(options),
    limits: { fileSize: maxUploadSizeBytes },
    fileFilter: createFileFilter(options.allowedFormats),
  });

export const uploadAvatar = createUploadMiddleware({
  folder: 'saas-dashboard/avatars',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
});

export const uploadOrgLogo = createUploadMiddleware({
  folder: 'saas-dashboard/logos',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
  transformation: [{ width: 512, height: 512, crop: 'fit', background: 'transparent' }],
});
