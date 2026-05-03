import slugify from 'slugify';
import Organization from '../models/Organization.js';

export const generateUniqueSlug = async (name) => {
  const baseSlug = slugify(name, { lower: true, strict: true }) || 'organization';
  let slug = baseSlug;
  let counter = 1;

  while (await Organization.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};
