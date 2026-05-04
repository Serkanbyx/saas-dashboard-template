import { body, param, query } from 'express-validator';
import { PLANS } from '../utils/constants.js';

const planKeys = Object.keys(PLANS);

export const changePlanRules = [
  body('newPlan').isIn(planKeys).withMessage('Invalid plan'),
];

export const listBillingHistoryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

export const invoiceNumberParamRule = [
  param('invoiceNumber')
    .trim()
    .matches(/^INV-\d{6}-[A-F0-9]{6}$/)
    .withMessage('Invalid invoice number'),
];
