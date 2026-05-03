const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const getUploadPayload = (file) => {
  if (!file?.url || !file?.publicId) {
    throw createHttpError(400, 'Image file is required.');
  }

  return {
    url: file.url,
    publicId: file.publicId,
  };
};

export const uploadUserAvatar = async (req, res, next) => {
  try {
    return res.status(201).json({ success: true, data: getUploadPayload(req.file) });
  } catch (error) {
    return next(error);
  }
};

export const uploadOrganizationLogo = async (req, res, next) => {
  try {
    return res.status(201).json({ success: true, data: getUploadPayload(req.file) });
  } catch (error) {
    return next(error);
  }
};
