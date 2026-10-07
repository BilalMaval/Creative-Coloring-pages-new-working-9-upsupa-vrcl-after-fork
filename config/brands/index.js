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

// Single live site: canonical host (www) used for all URLs so pages can be cached
export const SITE_HOST = 'www.creativecoloringpages.online';
export const SITE_URL = `https://${SITE_HOST}`;

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

export default brands;
