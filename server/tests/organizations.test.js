import { describe, expect, it } from 'vitest';
import { deleteOrgRules } from '../validators/organizationValidators.js';

describe('Organization security rules', () => {
  it('requires name and password confirmation before deleting an organization', () => {
    const deleteFields = deleteOrgRules.flatMap((rule) => rule.builder?.fields || []);

    expect(deleteFields).toContain('confirmName');
    expect(deleteFields).toContain('confirmPassword');
  });
});
