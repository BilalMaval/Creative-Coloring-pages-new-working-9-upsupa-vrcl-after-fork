import { getBrandByDomain, SITE_HOST, SITE_URL } from '@/config/brands';

// Server-side function to get brand from request headers
export async function getBrand() {
  return getBrandByDomain(SITE_HOST);
}

// Synchronous version for use in generateMetadata
export function getBrandSync(host) {
  return getBrandByDomain(host);
}

// Get the current domain URL
export async function getBrandUrl() {
  return SITE_URL;
}

export default getBrand;
