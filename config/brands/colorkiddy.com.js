// Brand configuration for colorkiddy.com (DEFAULT FALLBACK)
// TODO: Fill in your brand-specific values
const brand = {
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
  
  // Payment Configuration - TODO: Update with your keys
  payment: {
    stripePublicKey: process.env.COLORKIDDY_STRIPE_PUBLIC_KEY || '',
    stripeSecretKey: process.env.COLORKIDDY_STRIPE_SECRET_KEY || '',
    paypalClientId: process.env.COLORKIDDY_PAYPAL_CLIENT_ID || '',
    paypalSecret: process.env.COLORKIDDY_PAYPAL_SECRET || '',
    currency: 'USD'
  },
  
  // Analytics - TODO: Update with your GTM/GA IDs
  analytics: {
    gaId: '',
    gtmId: ''
  },
  
  // Email Service Configuration - TODO: Update
  emailService: {
    provider: 'brevo',
    apiKey: process.env.COLORKIDDY_BREVO_API_KEY || process.env.BREVO_API_KEY || '',
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
