// Brand configuration for creativecoloringpages.online
// Environment variables should be prefixed with CCP_

const brand = {
  // Brand identifier (used for env var prefix)
  id: 'CCP',
  domain: 'creativecoloringpages.online',
  name: 'Creative Coloring Pages',
  shortName: 'CCP',
  tagline: 'Fun for Kids & Families!',
  description: 'Download and print free coloring pages, mandalas, and printable activities for kids and adults. New designs added regularly!',
  keywords: 'coloring pages, printable coloring pages, mandalas, free printables, coloring sheets, kids coloring, adult coloring, mandala designs',
  
  // Branding
  logo: 'https://cdn.creativecoloringpages.online/brand/ccp-logo.png',
  // 320px WebP for header/footer/hero, served from this site's own domain (public/brand/) so the first paint
  // needs no extra connection to another host. The full-size logo stays on the CDN for OG images and schema.
  logoSmall: '/brand/ccp-logo-320.webp',
  favicon: 'https://cdn.creativecoloringpages.online/brand/ccp-icon-64.png',
  appleIcon: 'https://cdn.creativecoloringpages.online/brand/ccp-icon-180.png',
  
  // Colors (Tailwind class names)
  colors: {
    primary: 'purple',
    secondary: 'pink',
    accent: 'blue',
    headerBorder: 'yellow-400',
    gradient: 'from-blue-50 via-purple-50 to-pink-50'
  },
  
  // Contact Information
  contact: {
    email: 'admin@creativecoloringpages.online',
    supportEmail: 'admin@creativecoloringpages.online',
    phone: '+1 (902) 707-8554',
    address: '1001 S Main St Ste 500, Kalispell, MT 59901'
  },
  
  // Social Media Links
  socialLinks: {
    facebook: 'https://facebook.com/creativecoloringpages',
    instagram: 'https://instagram.com/creativecoloringpages',
    tiktok: 'https://tiktok.com/@creativecoloringpages',
    pinterest: 'https://pinterest.com/creativecoloringpages',
    twitter: '',
    youtube: ''
  },
  
  // Analytics (hardcoded - these are public anyway)
  analytics: {
    gtmId: 'GTM-KGTWF7HK',
    gaId: '',
  },
  
  // Environment variable keys (actual values loaded at runtime)
  // These define WHICH env vars to read for this brand
  envKeys: {
    // Payment
    stripePublicKey: 'CCP_STRIPE_PUBLIC_KEY',
    stripeSecretKey: 'CCP_STRIPE_SECRET_KEY',
    paypalClientId: 'CCP_PAYPAL_CLIENT_ID',
    paypalSecret: 'CCP_PAYPAL_SECRET',
    
    // Email Service
    brevoApiKey: 'CCP_BREVO_API_KEY',
  },
  
  // Static values (not from env)
  payment: {
    currency: 'USD'
  },
  
  // Email Service Configuration (static parts)
  emailService: {
    provider: 'brevo',
    senderEmail: 'alisafyan1122@gmail.com',
    senderName: 'Creative Coloring Pages',
    replyToEmail: 'sufyan.afzalk@gmail.com',
    replyToName: 'Support',
    contactRecipients: ['sufyan.afzalk@gmail.com', 'admin@creativecoloringpages.online']
  },
  
  // SEO & Meta
  seo: {
    titleTemplate: '%s | Creative Coloring Pages',
    defaultTitle: 'Free Printable Coloring Pages & Mandalas',
    pinterestVerify: 'cec57036f897cd1954e89b997411ade0',
    ogImage: 'https://cdn.creativecoloringpages.online/brand/ccp-logo.png'
  }
};

export default brand;
