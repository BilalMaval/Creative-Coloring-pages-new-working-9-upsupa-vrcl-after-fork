import { headers } from 'next/headers';
import { getBrandByDomain, defaultBrand } from '@/config/brands';

// Server-side function to get brand from request headers
export async function getBrand() {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
    return getBrandByDomain(host);
  } catch (error) {
    // Fallback for static generation or errors
    console.error('Error getting brand:', error);
    return defaultBrand;
  }
}

// Synchronous version for use in generateMetadata
export function getBrandSync(host) {
  return getBrandByDomain(host);
}

// Get the current domain URL
export async function getBrandUrl() {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    return `${protocol}://${host}`;
  } catch (error) {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
}

export default getBrand;
