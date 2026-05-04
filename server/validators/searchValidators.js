import { query } from 'express-validator';

const allowedSearchTypes = ['members', 'invitations', 'activities'];

export const globalSearchRules = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .escape(),
  query('types')
    .optional({ values: 'falsy' })
    .custom((value) => {
      const requestedTypes = String(value)
        .split(',')
        .map((type) => type.trim())
        .filter(Boolean);

      return requestedTypes.length > 0 && requestedTypes.every((type) => allowedSearchTypes.includes(type));
    })
    .withMessage('Invalid search type'),
  query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10'),
];
