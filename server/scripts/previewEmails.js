import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import env from '../config/env.js';
import { logger } from '../config/logger.js';
import { renderEmail } from '../utils/renderEmail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const previewDir = path.resolve(__dirname, '../tmp/email-previews');
const clientUrl = env.CLIENT_URL.replace(/\/$/, '');

const sampleTemplates = [
  {
    templateName: 'invitation',
    variables: {
      inviterName: 'Ada Lovelace',
      orgName: 'Acme Analytics',
      role: 'admin',
      acceptUrl: `${clientUrl}/invitations/accept?token=sample-token`,
      expiresAt: 'May 10, 2026, 11:00 PM',
    },
  },
  {
    templateName: 'welcome',
    variables: {
      name: 'Grace Hopper',
      orgName: 'Acme Analytics',
      dashboardUrl: `${clientUrl}/dashboard`,
    },
  },
  {
    templateName: 'role-changed',
    variables: {
      name: 'Katherine Johnson',
      orgName: 'Acme Analytics',
      newRole: 'manager',
      dashboardUrl: `${clientUrl}/dashboard`,
    },
  },
  {
    templateName: 'plan-changed',
    variables: {
      name: 'Dorothy Vaughan',
      orgName: 'Acme Analytics',
      newPlan: 'Pro',
      billingUrl: `${clientUrl}/billing`,
    },
  },
  {
    templateName: 'org-suspended',
    variables: {
      ownerName: 'Mary Jackson',
      orgName: 'Acme Analytics',
      reason: 'Payment verification is required.',
      supportUrl: `${clientUrl}/support`,
    },
  },
];

await mkdir(previewDir, { recursive: true });

for (const { templateName, variables } of sampleTemplates) {
  const html = await renderEmail(templateName, variables);
  const filePath = path.join(previewDir, `${templateName}.html`);

  await writeFile(filePath, html, 'utf8');
  logger.info({ filePath }, 'Email preview generated');
}
