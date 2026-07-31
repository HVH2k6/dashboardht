import slugify from 'slugify';

/**
 * Creates a slug from text. Uses slugify to handle Vietnamese and Latin characters,
 * and falls back to a custom regex for non-Latin characters (CJK like Korean, Japanese, Chinese)
 * which slugify would normally strip out completely.
 */
export const generateSlug = (text: string): string => {
  if (!text) return '';
  
  // Try to use slugify first (handles Vietnamese marks well)
  let slugged = slugify(text, { lower: true, strict: true, locale: 'vi' });
  
  // If slugify stripped everything out (e.g. text is entirely Korean/Japanese/Chinese)
  if (!slugged && text.trim().length > 0) {
    slugged = text
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-') // replace spaces and underscores with hyphens
      .replace(/[^\p{L}\p{N}\-]/gu, ''); // remove all non-letters, non-numbers, non-hyphens
  }
  
  return slugged;
};
