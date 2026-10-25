// Brand configuration for colorkiddy.com
// Environment variables should be prefixed with COLORKIDDY_
// TODO: Fill in your brand-specific values

const brand = {
  // Brand identifier (used for env var prefix)
  id: 'COLORKIDDY',
  domain: 'colorkiddy.com',
  name: 'ColorKiddy',
  shortName: 'CK',
  tagline: 'Coloring Fun for Everyone!',
  description: 'Free printable coloring pages for kids and adults. Download and print beautiful coloring sheets!',
  keywords: 'coloring pages, kids coloring, free printables, coloring sheets, printable activities',
  
  // Branding - TODO: Update with your logo
  logo: 'https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png',
  favicon: 'https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png',
  
  // Colors (Tailwind class names)
  colors: {
    primary: 'blue',
    secondary: 'green',
    accent: 'orange',
    headerBorder: 'blue-400',
    gradient: 'from-blue-50 via-green-50 to-yellow-50'
  },
  
  // Contact Information - TODO: Update
  contact: {
    email: 'admin@colorkiddy.com',
    supportEmail: 'support@colorkiddy.com',
    phone: '',
    address: ''
  },
  
  // Social Media Links - TODO: Update
  socialLinks: {
    facebook: 'https://facebook.com/colorkiddy',
    instagram: 'https://instagram.com/colorkiddy',
    tiktok: 'https://tiktok.com/@colorkiddy',
    pinterest: 'https://pinterest.com/colorkiddy',
    twitter: '',
    youtube: ''
  },
  
  // Analytics (hardcoded - these are public anyway)
  // TODO: Add your GTM/GA IDs here
  analytics: {
    gtmId: '',  // e.g., 'GTM-XXXXXXX'
    gaId: '',   // e.g., 'G-XXXXXXX'
  },
  
  // Environment variable keys (actual values loaded at runtime)
  // These define WHICH env vars to read for this brand
  envKeys: {
    // Payment
    stripePublicKey: 'COLORKIDDY_STRIPE_PUBLIC_KEY',
    stripeSecretKey: 'COLORKIDDY_STRIPE_SECRET_KEY',
    stripeWebhookSecret: 'COLORKIDDY_STRIPE_WEBHOOK_SECRET',
    paypalClientId: 'COLORKIDDY_PAYPAL_CLIENT_ID',
    paypalSecret: 'COLORKIDDY_PAYPAL_SECRET',
    
    // Email Service
    brevoApiKey: 'COLORKIDDY_BREVO_API_KEY',
  },
  
  // Static values (not from env)
  payment: {
    currency: 'USD'
  },
  
  // Email Service Configuration (static parts)
  emailService: {
    provider: 'brevo',
    senderEmail: 'noreply@colorkiddy.com',
    senderName: 'ColorKiddy',
    replyToEmail: 'support@colorkiddy.com',
    replyToName: 'Support',
    contactRecipients: ['support@colorkiddy.com']
  },
  
  // SEO & Meta
  seo: {
    titleTemplate: '%s | ColorKiddy',
    defaultTitle: 'Free Coloring Pages for Kids',
    ogImage: 'https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png'
  }
};

export default brand;
