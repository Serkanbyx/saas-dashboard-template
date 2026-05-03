import { body } from 'express-validator';
import { validate } from './authValidators.js';

const createLogoRule = () =>
  body('logo')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Logo must be a valid URL');

const createDescriptionRule = () =>
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters');

export const createOrgRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Organization name must be between 2 and 80 characters'),
  createDescriptionRule(),
  createLogoRule(),
];

export const updateOrgRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Organization name must be between 2 and 80 characters'),
  createDescriptionRule(),
  createLogoRule(),
];

export const deleteOrgRules = [
  body('confirmName').trim().notEmpty().withMessage('Organization name confirmation is required'),
];

export { validate };
