import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emailTemplateDir = path.resolve(__dirname, '../templates/emails');

const allowedTemplates = new Set(['invitation', 'welcome', 'role-changed', 'plan-changed', 'org-suspended']);
const templateCache = new Map();

export const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });

const readTemplate = async (templateName) => {
  if (!allowedTemplates.has(templateName)) {
    throw new Error(`Unknown email template: ${templateName}`);
  }

  if (!templateCache.has(templateName)) {
    const [baseTemplate, bodyTemplate] = await Promise.all([
      readFile(path.join(emailTemplateDir, '_base.html'), 'utf8'),
      readFile(path.join(emailTemplateDir, `${templateName}.html`), 'utf8'),
    ]);

    templateCache.set(templateName, baseTemplate.replace('{{content}}', bodyTemplate));
  }

  return templateCache.get(templateName);
};

export const renderEmail = async (templateName, variables = {}) => {
  const template = await readTemplate(templateName);
  const templateVariables = {
    appName: 'SaaS Dashboard',
    ...variables,
  };

  return template.replace(/{{\s*([a-zA-Z0-9]+)\s*}}/g, (_match, key) => escapeHtml(templateVariables[key] ?? ''));
};

export const htmlToText = (html = '') =>
  String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '$&\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
