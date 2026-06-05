# Multi-Tenant Architecture Guide

## Overview
This application supports multiple domains/brands sharing the same codebase and database. Each domain has its own branding, analytics, email service, and payment configuration.

---

## 🔑 Environment Variables Setup (VERCEL)

Each brand has **prefixed environment variables** for sensitive data like API keys. Set these in your Vercel project settings:

### For creativecoloringpages.online (prefix: `CCP_`)
```bash
# Email Service
CCP_BREVO_API_KEY=your_brevo_api_key

# Payment
CCP_STRIPE_PUBLIC_KEY=pk_live_xxx
CCP_STRIPE_SECRET_KEY=sk_live_xxx
CCP_PAYPAL_CLIENT_ID=xxx
CCP_PAYPAL_SECRET=xxx
```

### For colorkiddy.com (prefix: `COLORKIDDY_`)
```bash
# Email Service
COLORKIDDY_BREVO_API_KEY=different_brevo_api_key

# Payment
COLORKIDDY_STRIPE_PUBLIC_KEY=pk_live_yyy
COLORKIDDY_STRIPE_SECRET_KEY=sk_live_yyy
COLORKIDDY_PAYPAL_CLIENT_ID=yyy
COLORKIDDY_PAYPAL_SECRET=yyy
```

### Fallback Variables (Optional)
If a brand-specific variable isn't set, the system falls back to non-prefixed versions:
```bash
BREVO_API_KEY=fallback_key
STRIPE_PUBLIC_KEY=fallback_key
```

---

## 📊 Analytics (GTM/GA) - In Config Files, NOT Env Vars

**GTM and GA IDs are stored directly in brand config files** (not environment variables) because:
- They are public (visible in page source anyway)
- Easier to manage per brand
- No need to update Vercel env vars for analytics changes

### Where to set GTM/GA IDs:
```javascript
// /config/brands/creativecoloringpages.online.js
analytics: {
  gtmId: 'GTM-KGTWF7HK',  // Google Tag Manager ID
  gaId: '',               // Google Analytics ID (optional)
},

// /config/brands/colorkiddy.com.js
analytics: {
  gtmId: 'GTM-XXXXXXX',  // Your GTM ID
  gaId: 'G-XXXXXXX',     // Your GA ID
},
```

### Summary: What Goes Where

| Setting | Location | Example |
|---------|----------|---------|
| GTM ID | Brand config file | `analytics: { gtmId: 'GTM-XXX' }` |
| GA ID | Brand config file | `analytics: { gaId: 'G-XXX' }` |
| Brevo API Key | Vercel env var | `CCP_BREVO_API_KEY=xxx` |
| Stripe Keys | Vercel env var | `CCP_STRIPE_SECRET_KEY=sk_xxx` |
| PayPal Keys | Vercel env var | `CCP_PAYPAL_CLIENT_ID=xxx` |

---

## ⚠️ IMPORTANT: Never Hardcode These Values

| ❌ DON'T Hardcode | ✅ DO Use |
|-------------------|-----------|
| `"Creative Coloring Pages"` | `brand.name` |
| `"GTM-KGTWF7HK"` | `getBrandEnv(brand, 'gtmId')` |
| `process.env.BREVO_API_KEY` | `getBrandEnv(brand, 'brevoApiKey')` |
| `process.env.STRIPE_SECRET_KEY` | `getBrandEnv(brand, 'stripeSecretKey')` |

---

## How to Access Brand Configuration

### 1. Server Components (page.js, layout.js)

```javascript
import { headers } from 'next/headers';
import { getBrandByDomain } from '@/config/brands';
import { getBrandSecrets } from '@/lib/brandEnv';

export default async function MyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  const secrets = getBrandSecrets(brand);
  
  // Use brand.name, brand.logo, etc.
  // Use secrets.gtmId, secrets.stripePublicKey, etc.
}
```

### 2. Client Components ('use client')

```javascript
'use client';
import { useBrand } from '@/components/BrandProvider';

export default function MyComponent() {
  const brand = useBrand();
  // brand contains: name, logo, colors, contact, socialLinks, seo
  // Does NOT contain secrets (API keys, etc.)
}
```

### 3. API Routes

```javascript
import { headers } from 'next/headers';
import { getBrandByDomain } from '@/config/brands';
import { getBrandEnv } from '@/lib/brandEnv';

export async function POST(request) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  // Get brand-specific API key
  const apiKey = getBrandEnv(brand, 'brevoApiKey', 'BREVO_API_KEY');
  const stripeKey = getBrandEnv(brand, 'stripeSecretKey', 'STRIPE_SECRET_KEY');
}
```

---

## Brand Configuration File Structure

Each brand file (`/config/brands/yourdomain.com.js`) contains:

```javascript
const brand = {
  // Brand identifier (used for logging)
  id: 'MYBRAND',
  domain: 'mybrand.com',
  name: 'My Brand Name',
  shortName: 'MB',
  tagline: 'Your tagline',
  
  // Visual branding
  logo: 'https://...',
  favicon: 'https://...',
  colors: {
    primary: 'purple',
    secondary: 'pink',
    accent: 'blue',
    headerBorder: 'yellow-400',
    gradient: 'from-blue-50 via-purple-50 to-pink-50'
  },
  
  // Contact info
  contact: {
    email: 'admin@mybrand.com',
    supportEmail: 'support@mybrand.com'
  },
  
  // Social links
  socialLinks: {
    facebook: 'https://...',
    instagram: 'https://...'
  },
  
  // Analytics - STORED IN CONFIG FILE (not env vars)
  analytics: {
    gtmId: 'GTM-XXXXXXX',  // Google Tag Manager ID
    gaId: 'G-XXXXXXX',     // Google Analytics ID
  },
  
  // ENV VAR KEYS - Maps to Vercel environment variables
  // Only for sensitive data (API keys, secrets)
  envKeys: {
    stripePublicKey: 'MYBRAND_STRIPE_PUBLIC_KEY',
    stripeSecretKey: 'MYBRAND_STRIPE_SECRET_KEY',
    paypalClientId: 'MYBRAND_PAYPAL_CLIENT_ID',
    paypalSecret: 'MYBRAND_PAYPAL_SECRET',
    brevoApiKey: 'MYBRAND_BREVO_API_KEY',
  },
  
  // Email service (static config)
  emailService: {
    provider: 'brevo',
    senderEmail: 'noreply@mybrand.com',
    senderName: 'My Brand',
    contactRecipients: ['admin@mybrand.com']
  },
  
  // SEO
  seo: {
    titleTemplate: '%s | My Brand',
    defaultTitle: 'My Brand - Homepage'
  }
};

export default brand;
```

---

## Adding a New Brand

### Step 1: Create brand config file
```bash
/config/brands/newdomain.com.js
```

### Step 2: Set up the config with analytics and envKeys
```javascript
const brand = {
  id: 'NEWBRAND',
  domain: 'newdomain.com',
  name: 'New Brand',
  // ... other config ...
  
  // Analytics - directly in config (public values)
  analytics: {
    gtmId: 'GTM-XXXXXXX',
    gaId: 'G-XXXXXXX',
  },
  
  // Env var keys - for secrets only
  envKeys: {
    stripePublicKey: 'NEWBRAND_STRIPE_PUBLIC_KEY',
    stripeSecretKey: 'NEWBRAND_STRIPE_SECRET_KEY',
    brevoApiKey: 'NEWBRAND_BREVO_API_KEY',
  },
};
```

### Step 3: Register in index.js
```javascript
// /config/brands/index.js
import newbrand from './newdomain.com.js';

export const brands = {
  // ... existing
  'newdomain.com': newbrand,
  'www.newdomain.com': newbrand,
};
```

### Step 4: Set environment variables in Vercel (secrets only)
```
NEWBRAND_STRIPE_PUBLIC_KEY=pk_xxx
NEWBRAND_STRIPE_SECRET_KEY=sk_xxx
NEWBRAND_BREVO_API_KEY=xxx
```

### Step 5: Point domain to Vercel deployment

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/config/brands/*.js` | Brand configurations |
| `/config/brands/index.js` | Brand registry & domain mapping |
| `/lib/brandEnv.js` | Environment variable helper |
| `/lib/getBrand.js` | Domain detection utility |
| `/components/BrandProvider.js` | React Context for client |

---

## Security Notes

1. **Never expose secret keys to client** - Only `getBrandPublicConfig()` values are safe for browser
2. **Use envKeys mapping** - Never hardcode env var names in application code
3. **Fallback behavior** - System falls back to non-prefixed env vars if brand-specific not found

---

## Testing Multiple Brands Locally

You can test by modifying your `/etc/hosts`:
```
127.0.0.1 colorkiddy.local
127.0.0.1 creativecoloringpages.local
```

Then add these domains to the brands registry and access via `http://colorkiddy.local:3000`
