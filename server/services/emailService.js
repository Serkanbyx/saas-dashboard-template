import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import env from '../config/env.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const invitationTemplatePath = path.resolve(__dirname, '../templates/emails/invitation.html');

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

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

const renderTemplate = (template, variables) =>
  Object.entries(variables).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, escapeHtml(value)),
    template,
  );

const renderInvitationEmail = async ({ inviterName, orgName, role, acceptUrl, expiresAt }) => {
  const variables = {
    inviterName,
    orgName,
    role,
    acceptUrl,
    expiresAt: formatDate(expiresAt),
  };

  try {
    const template = await readFile(invitationTemplatePath, 'utf8');
    return renderTemplate(template, variables);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.warn({ err: error }, 'Invitation email template could not be rendered');
    }

    return `
      <p>${escapeHtml(inviterName)} invited you to join ${escapeHtml(orgName)} as ${escapeHtml(role)}.</p>
      <p>This invitation expires on ${escapeHtml(variables.expiresAt)}.</p>
      <p><a href="${escapeHtml(acceptUrl)}">Accept invitation</a></p>
    `;
  }
};

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
  const html = await renderInvitationEmail({ inviterName, orgName, role, acceptUrl, expiresAt });
  const text = `${inviterName} invited you to join ${orgName} as ${role}. Accept: ${acceptUrl}`;

  return sendMailSafely({
    to,
    subject: `Invitation to join ${orgName}`,
    html,
    text,
  });
};

export const sendWelcomeEmail = async ({ to, name, orgName }) =>
  sendMailSafely({
    to,
    subject: `Welcome to ${orgName}`,
    html: `<p>Hi ${escapeHtml(name)}, welcome to ${escapeHtml(orgName)}.</p>`,
    text: `Hi ${name}, welcome to ${orgName}.`,
  });

export const sendRoleChangedEmail = async ({ to, name, orgName, newRole }) =>
  sendMailSafely({
    to,
    subject: `Your role changed in ${orgName}`,
    html: `<p>Hi ${escapeHtml(name)}, your role in ${escapeHtml(orgName)} is now ${escapeHtml(newRole)}.</p>`,
    text: `Hi ${name}, your role in ${orgName} is now ${newRole}.`,
  });

export const sendPlanChangedEmail = async ({ to, name, orgName, newPlan }) =>
  sendMailSafely({
    to,
    subject: `${orgName} plan updated`,
    html: `<p>Hi ${escapeHtml(name)}, ${escapeHtml(orgName)} is now on the ${escapeHtml(newPlan)} plan.</p>`,
    text: `Hi ${name}, ${orgName} is now on the ${newPlan} plan.`,
  });

export const sendOrgSuspendedEmail = async ({ to, ownerName, orgName, reason }) =>
  sendMailSafely({
    to,
    subject: `${orgName} has been suspended`,
    html: `<p>Hi ${escapeHtml(ownerName)}, ${escapeHtml(orgName)} has been suspended.</p><p>${escapeHtml(reason)}</p>`,
    text: `Hi ${ownerName}, ${orgName} has been suspended. ${reason}`,
  });
