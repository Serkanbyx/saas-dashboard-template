import nodemailer from 'nodemailer';
import env from '../config/env.js';
import { logger } from '../config/logger.js';
import { htmlToText, renderEmail } from '../utils/renderEmail.js';

const hasSmtpConfig = Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    })
  : null;

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

const buildClientUrl = (pathname) => new URL(pathname, env.CLIENT_URL).toString();

const sanitizeSubject = (subject) => String(subject).replace(/[\r\n]+/g, ' ').trim();

const sendMailSafely = async ({ to, subject, html, text }) => {
  if (!transporter) {
    logger.info({ to, subject }, 'Email skipped because SMTP is not configured');
    return { sent: false, skipped: true };
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    return { sent: true, skipped: false };
  } catch (error) {
    logger.error({ err: error, to, subject }, 'Email delivery failed');
    return { sent: false, skipped: false };
  }
};

export const sendInvitationEmail = async ({ to, inviterName, orgName, role, acceptUrl, expiresAt }) => {
  const html = await renderEmail('invitation', {
    inviterName,
    orgName,
    role,
    acceptUrl,
    expiresAt: formatDate(expiresAt),
  });

  return sendMailSafely({
    to,
    subject: sanitizeSubject(`You're invited to ${orgName}`),
    html,
    text: htmlToText(html),
  });
};

export const sendWelcomeEmail = async ({ to, name, orgName }) => {
  const html = await renderEmail('welcome', {
    name,
    orgName,
    dashboardUrl: buildClientUrl('/dashboard'),
  });

  return sendMailSafely({
    to,
    subject: sanitizeSubject(`Welcome to ${orgName}`),
    html,
    text: htmlToText(html),
  });
};

export const sendRoleChangedEmail = async ({ to, name, orgName, newRole }) => {
  const html = await renderEmail('role-changed', {
    name,
    orgName,
    newRole,
    dashboardUrl: buildClientUrl('/dashboard'),
  });

  return sendMailSafely({
    to,
    subject: sanitizeSubject(`Your role changed in ${orgName}`),
    html,
    text: htmlToText(html),
  });
};

export const sendPlanChangedEmail = async ({ to, name, orgName, newPlan }) => {
  const html = await renderEmail('plan-changed', {
    name,
    orgName,
    newPlan,
    billingUrl: buildClientUrl('/billing'),
  });

  return sendMailSafely({
    to,
    subject: sanitizeSubject(`${orgName} plan updated`),
    html,
    text: htmlToText(html),
  });
};

export const sendOrgSuspendedEmail = async ({ to, ownerName, orgName, reason }) => {
  const html = await renderEmail('org-suspended', {
    ownerName,
    orgName,
    reason,
    supportUrl: buildClientUrl('/support'),
  });

  return sendMailSafely({
    to,
    subject: sanitizeSubject(`${orgName} has been suspended`),
    html,
    text: htmlToText(html),
  });
};
