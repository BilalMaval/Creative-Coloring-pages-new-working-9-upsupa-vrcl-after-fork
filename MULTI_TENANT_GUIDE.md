# Multi-Tenant Architecture Guide

## Overview
This application supports multiple domains/brands sharing the same codebase and database. Each domain can have its own branding, analytics, email configuration, etc.

---

## ⚠️ IMPORTANT: Never Hardcode These Values

Instead of hardcoding, always use the brand configuration:

| ❌ DON'T Hardcode | ✅ DO Use Brand Config |
|-------------------|------------------------|
| `"Creative Coloring Pages"` | `brand.name` |
| `"CCP"` | `brand.shortName` |
| `"Fun for Kids & Families!"` | `brand.tagline` |
| Logo URLs | `brand.logo` / `brand.favicon` |
| `"GTM-KGTWF7HK"` | `brand.analytics.gtmId` |
| `"GA-XXXXXXXX"` | `brand.analytics.gaId` |
| Email addresses | `brand.contact.email` / `brand.emailService.*` |
| Social media URLs | `brand.socialLinks.facebook`, etc. |
| Color values like `"purple"` | `brand.colors.primary` |

---

## How to Access Brand in Different Contexts

### 1. Server Components (page.js, layout.js, etc.)

```javascript
import { headers } from 'next/headers';
import { getBrandByDomain } from '@/config/brands';

export default async function MyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  return <h1>{brand.name}</h1>;
}
```

### 2. Client Components ('use client')

```javascript
'use client';
import { useBrand } from '@/components/BrandProvider';

export default function MyComponent() {
  const brand = useBrand();
  
  return <h1>{brand.name}</h1>;
}
```

### 3. API Routes

```javascript
import { headers } from 'next/headers';
import { getBrandByDomain } from '@/config/brands';

export async function POST(request) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  // Use brand.emailService, brand.payment, etc.
}
```

---

## Brand Configuration Structure

Each brand file in `/config/brands/` contains:

```javascript
const brand = {
  // Identity
  domain: 'example.com',
  name: 'Brand Name',
  shortName: 'BN',
  tagline: 'Your tagline here',
  description: 'SEO description',
  keywords: 'seo, keywords',
  
  // Branding
  logo: 'https://...',
  favicon: 'https://...',
  
  // Colors (Tailwind class names)
  colors: {
    primary: 'purple',      // Used as: text-${primary}-500, bg-${primary}-600
    secondary: 'pink',
    accent: 'blue',
    headerBorder: 'yellow-400',
    gradient: 'from-blue-50 via-purple-50 to-pink-50'
  },
  
  // Contact
  contact: {
    email: 'admin@example.com',
    supportEmail: 'support@example.com',
    phone: '',
    address: ''
  },
  
  // Social Media
  socialLinks: {
    facebook: 'https://facebook.com/...',
    instagram: 'https://instagram.com/...',
    tiktok: 'https://tiktok.com/@...',
    pinterest: 'https://pinterest.com/...',
    twitter: '',
    youtube: ''
  },
  
  // Payment (read from env vars)
  payment: {
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    currency: 'USD'
  },
  
  // Analytics
  analytics: {
    gaId: '',           // Google Analytics ID
    gtmId: 'GTM-XXXXX'  // Google Tag Manager ID
  },
  
  // Email Service
  emailService: {
    provider: 'brevo',
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: 'noreply@example.com',
    senderName: 'Brand Name',
    replyToEmail: 'support@example.com',
    replyToName: 'Support',
    contactRecipients: ['admin@example.com']  // Who receives contact form emails
  },
  
  // SEO
  seo: {
    titleTemplate: '%s | Brand Name',
    defaultTitle: 'Default Page Title',
    ogImage: 'https://...'
  }
};

export default brand;
```

---

## Adding a New Brand/Domain

1. **Create brand config file:**
   ```
   /config/brands/newdomain.com.js
   ```

2. **Register in index.js:**
   ```javascript
   // /config/brands/index.js
   import newdomain from './newdomain.com.js';
   
   export const brands = {
     // ... existing brands
     'newdomain.com': newdomain,
     'www.newdomain.com': newdomain,
   };
   ```

3. **Point domain to deployment** (Vercel/hosting provider)

---

## Available Brand Properties in Client Components

The `useBrand()` hook returns a serialized version (no sensitive data):

```javascript
{
  domain,
  name,
  shortName,
  tagline,
  description,
  logo,
  favicon,
  colors,
  contact,
  socialLinks,
  seo
}
```

**Note:** Payment keys and email API keys are NOT passed to client components for security.

---

## Files Using Brand Configuration

| File | How Brand is Used |
|------|-------------------|
| `/app/layout.js` | Metadata, favicon, GTM/GA scripts |
| `/components/Header.js` | Logo, name, tagline, colors |
| `/components/Footer.js` | Logo, name, tagline, social links |
| `/components/HeroLogo.js` | Logo image |
| `/components/BrandTitle.js` | Brand name in hero |
| `/components/SubscribeModal.js` | Brand name in messages |
| `/lib/email.js` | Email sender info, recipients |
| `/app/api/subscribe/route.js` | Welcome email branding |
| `/app/api/contact/route.js` | Contact email recipients |
| `/app/robots.txt/route.js` | Domain-specific robots.txt |
| `/app/sitemap.xml/route.js` | Domain-specific sitemap |

---

## Quick Reference: Common Patterns

### Display brand name:
```jsx
// Client component
const brand = useBrand();
<span>{brand.name}</span>
```

### Conditional social link:
```jsx
{brand.socialLinks.facebook && (
  <a href={brand.socialLinks.facebook}>Facebook</a>
)}
```

### Use brand color:
```jsx
<div className={`bg-${brand.colors.primary}-500`}>
```

### Send branded email (API route):
```javascript
import { sendContactEmail } from '@/lib/email';

await sendContactEmail({
  name,
  email,
  message,
  brandDomain: host  // Pass the domain!
});
```

---

## Default Brand

If a domain is not recognized, the default brand is used:
- Currently set to: `creativecoloringpages.online`
- Change in: `/config/brands/index.js` → `defaultBrand`
