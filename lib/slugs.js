// A slug that is safe to put in a URL and that the site's own routing can serve: lowercase letters, digits and single hyphens.
// (The middleware lower-cases every path, so a slug containing capitals or spaces can never be reached and would 404.)
export const isCleanSlug = (slug) => typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
