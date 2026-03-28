/**
 * Brand Environment Variable Helper
 * 
 * This module provides functions to safely retrieve brand-specific
 * environment variables at runtime.
 * 
 * VERCEL ENVIRONMENT VARIABLES NAMING CONVENTION:
 * ================================================
 * Each brand should have its own prefixed env vars:
 * 
 * For creativecoloringpages.online (prefix: CCP_):
 *   - CCP_BREVO_API_KEY
 *   - CCP_STRIPE_PUBLIC_KEY
 *   - CCP_STRIPE_SECRET_KEY
 *   - CCP_GTM_ID
 *   - CCP_GA_ID
 * 
 * For colorkiddy.com (prefix: COLORKIDDY_):
 *   - COLORKIDDY_BREVO_API_KEY
 *   - COLORKIDDY_STRIPE_PUBLIC_KEY
 *   - COLORKIDDY_STRIPE_SECRET_KEY
 *   - COLORKIDDY_GTM_ID
 *   - COLORKIDDY_GA_ID
 * 
 * FALLBACK BEHAVIOR:
 * ==================
 * If a brand-specific env var is not set, it falls back to
 * the default (non-prefixed) env var if available.
 * 
 * Example: If CCP_BREVO_API_KEY is not set, it falls back to BREVO_API_KEY
 */

/**
 * Get an environment variable value for a specific brand
 * @param {Object} brand - The brand configuration object
 * @param {string} key - The key name from brand.envKeys (e.g., 'brevoApiKey')
 * @param {string} fallbackEnvVar - Optional fallback env var name if brand-specific not found
 * @returns {string} The environment variable value or empty string
 */
export function getBrandEnv(brand, key, fallbackEnvVar = null) {
  if (!brand || !brand.envKeys || !brand.envKeys[key]) {
    // If no brand config, try fallback
    return fallbackEnvVar ? (process.env[fallbackEnvVar] || '') : '';
  }
  
  const envVarName = brand.envKeys[key];
  const value = process.env[envVarName];
  
  // If brand-specific var exists, use it
  if (value) {
    return value;
  }
  
  // Otherwise try fallback
  if (fallbackEnvVar) {
    return process.env[fallbackEnvVar] || '';
  }
  
  return '';
}

/**
 * Get all runtime secrets for a brand (server-side only)
 * @param {Object} brand - The brand configuration object
 * @returns {Object} Object containing all resolved env values
 */
export function getBrandSecrets(brand) {
  return {
    // Payment
    stripePublicKey: getBrandEnv(brand, 'stripePublicKey', 'STRIPE_PUBLIC_KEY'),
    stripeSecretKey: getBrandEnv(brand, 'stripeSecretKey', 'STRIPE_SECRET_KEY'),
    paypalClientId: getBrandEnv(brand, 'paypalClientId', 'PAYPAL_CLIENT_ID'),
    paypalSecret: getBrandEnv(brand, 'paypalSecret', 'PAYPAL_SECRET'),
    
    // Analytics
    gaId: getBrandEnv(brand, 'gaId', 'GA_ID'),
    gtmId: getBrandEnv(brand, 'gtmId', 'GTM_ID'),
    
    // Email
    brevoApiKey: getBrandEnv(brand, 'brevoApiKey', 'BREVO_API_KEY'),
  };
}

/**
 * Get public (client-safe) config for a brand
 * Only includes values safe to expose to the browser
 * @param {Object} brand - The brand configuration object
 * @returns {Object} Object containing public-safe values
 */
export function getBrandPublicConfig(brand) {
  const secrets = getBrandSecrets(brand);
  
  return {
    // Only include PUBLIC keys (safe for browser)
    stripePublicKey: secrets.stripePublicKey,
    gaId: secrets.gaId,
    gtmId: secrets.gtmId,
    // DO NOT include secret keys here!
  };
}

export default getBrandEnv;
