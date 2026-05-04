import crypto from 'node:crypto';

export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `INV-${year}${month}-${shortId}`;
};
