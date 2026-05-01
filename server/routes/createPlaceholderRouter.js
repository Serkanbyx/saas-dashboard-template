import { Router } from 'express';

export const createPlaceholderRouter = (resourceName) => {
  const router = Router();

  router.use((_req, res) => {
    res.status(501).json({
      success: false,
      message: `${resourceName} API is not implemented yet.`,
    });
  });

  return router;
};
