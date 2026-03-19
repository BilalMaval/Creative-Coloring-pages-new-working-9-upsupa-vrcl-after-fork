// Brand configuration for creativecoloringpages.online
const brand = {
  domain: 'creativecoloringpages.online',
  name: 'Creative Coloring Pages',
  shortName: 'CCP',
  tagline: 'Fun for Kids & Families!',
  description: 'Download and print free coloring pages, mandalas, and printable activities for kids and adults. New designs added regularly!',
  keywords: 'coloring pages, printable coloring pages, mandalas, free printables, coloring sheets, kids coloring, adult coloring, mandala designs',
  
  // Branding
  logo: 'https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png',
  favicon: 'https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png',
  
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
    supportEmail: 'sufyan.afzalk@gmail.com',
    phone: '',
    address: ''
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
  
  // Payment Configuration
  payment: {
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    paypalSecret: process.env.PAYPAL_SECRET || '',
    currency: 'USD'
  },
  
  // Analytics
  analytics: {
    gaId: '',
    gtmId: 'GTM-KGTWF7HK'
  },
  
  // Email Service Configuration
  emailService: {
    provider: 'brevo',
    apiKey: process.env.BREVO_API_KEY || '',
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
    ogImage: 'https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png'
  }
};

export default brand;
