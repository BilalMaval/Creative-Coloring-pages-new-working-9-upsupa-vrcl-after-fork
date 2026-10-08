// Brand Registry - Maps domains to their configurations
import creativecoloringpages from './creativecoloringpages.online.js';
import colorkiddy from './colorkiddy.com.js';

// Map of all registered brands
export const brands = {
  'creativecoloringpages.online': creativecoloringpages,
  'www.creativecoloringpages.online': creativecoloringpages,
  'colorkiddy.com': colorkiddy,
  'www.colorkiddy.com': colorkiddy,
};

// Default brand for unknown domains
export const defaultBrand = creativecoloringpages;

// Get brand by domain
export function getBrandByDomain(domain) {
  if (!domain) return defaultBrand;
  
  // Clean the domain
  const cleanDomain = domain.toLowerCase().replace(/:\d+$/, ''); // Remove port if present
  
  // Try exact match first
  if (brands[cleanDomain]) {
    return brands[cleanDomain];
  }
  
  // Try without www
  const withoutWww = cleanDomain.replace(/^www\./, '');
  if (brands[withoutWww]) {
    return brands[withoutWww];
  }
  
  // Return default brand for unknown domains
  return defaultBrand;
}

// ── Brand keys: the URL segment middleware rewrites each domain to (/[brand]/...) ──
const uniqueBrands = [creativecoloringpages, colorkiddy];

export function getBrandKey(brand) {
  return brand.id.toLowerCase();
}

export function getBrandKeys() {
  return uniqueBrands.map(getBrandKey);
}

export function getBrandByKey(key) {
  return uniqueBrands.find((b) => getBrandKey(b) === key) || null;
}

// Canonical public origin for a brand (www by default; override with brand.canonicalHost)
export function getSiteUrl(brand) {
  return `https://${brand.canonicalHost || `www.${brand.domain}`}`;
}

// Brand fields that are safe to send to client components (no secrets)
export function toClientBrand(brand) {
  return {
    domain: brand.domain,
    name: brand.name,
    shortName: brand.shortName,
    tagline: brand.tagline,
    description: brand.description,
    logo: brand.logo,
    logoSmall: brand.logoSmall || brand.logo,
    favicon: brand.favicon,
    colors: brand.colors,
    contact: brand.contact,
    socialLinks: brand.socialLinks,
    seo: brand.seo,
  };
}

export default brands;
