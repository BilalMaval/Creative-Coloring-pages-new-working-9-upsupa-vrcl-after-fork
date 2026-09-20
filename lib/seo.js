import { headers } from 'next/headers';
import { getBrandByDomain } from '@/config/brands';

/**
 * Get the base URL for the current request
 * This function properly handles both server-side and build-time scenarios
 */
export async function getBaseUrl() {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    
    if (host) {
      return `${protocol}://${host}`;
    }
  } catch (error) {
    // During build time, headers() may not be available
  }
  
  // Fallback to environment variable (should be set in Vercel)
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://creativecoloringpages.online';
}

/**
 * Get brand configuration for the current request
 */
export async function getCurrentBrand() {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    return getBrandByDomain(host);
  } catch (error) {
    // Fallback to default brand
    return getBrandByDomain('');
  }
}

/**
 * Generate SEO metadata for a page
 * @param {Object} options - Metadata options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.keywords - SEO keywords
 * @param {string} options.path - Page path (e.g., '/about')
 * @param {string} options.image - OG image URL (full URL or path)
 * @param {string} options.type - OG type (default: 'website')
 * @param {string} options.baseUrl - Base URL (optional, will be detected)
 * @param {Object} options.brand - Brand config (optional, will be detected)
 */
export async function generateMetadata({ 
  title, 
  description, 
  keywords, 
  path = '', 
  image, 
  type = 'website',
  baseUrl: providedBaseUrl,
  brand: providedBrand
}) {
  // Get base URL and brand
  const baseUrl = providedBaseUrl || await getBaseUrl();
  const brand = providedBrand || await getCurrentBrand();
  
  // Build full title with brand name
  const siteName = brand.name;
  const fullTitle = title ? `${title} | ${siteName}` : brand.seo.defaultTitle;
  
  // Use brand description as fallback
  const finalDescription = description || brand.description;
  
  // Build canonical URL
  const canonicalUrl = path ? `${baseUrl}${path}` : baseUrl;
  
  // Build OG image URL
  let ogImage;
  if (image) {
    // If image is already a full URL, use it directly
    ogImage = image.startsWith('http') ? image : `${baseUrl}${image}`;
  } else {
    // Use brand logo as default OG image
    ogImage = brand.logo;
  }
  
  // Default keywords
  const finalKeywords = keywords || brand.keywords;
  
  // Normalize OG type - Next.js only supports certain types
  // Valid types: website, article, book, profile, music.song, music.album, video.movie, etc.
  const validOgTypes = ['website', 'article', 'book', 'profile'];
  const ogType = validOgTypes.includes(type) ? type : 'website';

  return {
    title: fullTitle,
    description: finalDescription,
    keywords: finalKeywords,
    // Generates <meta name="author" content="..."> in Next.js App Router
    authors: [{ name: siteName, url: baseUrl }],
    // Explicit fallback for parsers that look for the other field
    other: {
      author: siteName,
    },
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: ogType,
      locale: 'en_US',
      url: canonicalUrl,
      siteName,
      title: fullTitle,
      description: finalDescription,
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title || siteName
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: finalDescription,
      images: [ogImage]
    },
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

/**
 * Generate breadcrumb schema
 */
export async function generateBreadcrumbSchema(items) {
  const baseUrl = await getBaseUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
    }))
  };
}

/**
 * Generate product schema for a coloring page
 */
export async function generateProductSchema({ product, baseUrl: providedBaseUrl }) {
  const baseUrl = providedBaseUrl || await getBaseUrl();
  const brand = await getCurrentBrand();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || `Free printable ${product.title}`,
    image: product.webpPath ? (product.webpPath.startsWith('http') ? product.webpPath : `${baseUrl}${product.webpPath}`) : brand.logo,
    url: `${baseUrl}/product/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: brand.name
    },
    offers: {
      '@type': 'Offer',
      price: product.isFree ? '0' : String(product.salePrice || product.price || '0'),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    aggregateRating: (product.averageRating > 0 && product.reviewCount > 0) ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount
    } : undefined
  };
}

/**
 * Generate website schema
 */
export async function generateWebsiteSchema() {
  const baseUrl = await getBaseUrl();
  const brand = await getCurrentBrand();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.name,
    description: brand.description,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Generate organization schema
 */
export async function generateOrganizationSchema() {
  const baseUrl = await getBaseUrl();
  const brand = await getCurrentBrand();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: baseUrl,
    logo: brand.logo,
    description: brand.description,
    contactPoint: {
      '@type': 'ContactPoint',
      email: brand.contact.email,
      contactType: 'customer service'
    },
    sameAs: [
      brand.socialLinks.facebook,
      brand.socialLinks.instagram,
      brand.socialLinks.pinterest,
      brand.socialLinks.tiktok
    ].filter(Boolean)
  };
}

/**
 * Generate HowTo schema — "How to print this coloring page"
 * Attached to every product page for rich results eligibility.
 */
export async function generateHowToPrintSchema({ productTitle, baseUrl: providedBaseUrl }) {
  const baseUrl = providedBaseUrl || await getBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Print "${productTitle}"`,
    description: `Step-by-step guide to download and print ${productTitle} at home.`,
    totalTime: 'PT3M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    supply: [
      { '@type': 'HowToSupply', name: 'A4 or Letter-size paper' },
      { '@type': 'HowToSupply', name: 'Inkjet or laser printer' },
      { '@type': 'HowToSupply', name: 'Coloring pencils, crayons, or markers' },
    ],
    tool: [
      { '@type': 'HowToTool', name: 'PDF viewer (Adobe Reader, browser, or Preview)' },
    ],
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Download the PDF',
        text: 'Click the "Download Free PDF" button on this page. The file will save to your Downloads folder automatically.',
        url: `${baseUrl}/product/${productTitle.toLowerCase().replace(/\s+/g, '-')}`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Open the file',
        text: 'Open the downloaded PDF in Adobe Reader, your browser, or any PDF viewer on your computer or phone.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Set print settings',
        text: 'Go to File → Print. Select A4 or US Letter paper. Set orientation to Portrait. Choose "Fit to page" to fill the entire sheet. Set print quality to Standard or High.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Print and color',
        text: 'Click Print and collect your page. Now color it with pencils, crayons, or markers. You can print unlimited copies for personal or classroom use — completely free!',
      },
    ],
  };
}

/**
 * Generate FAQPage schema for category pages.
 * Creates 5 contextual Q&As based on the category name.
 */
export function generateCategoryFAQSchema({ categoryName, categorySlug, totalCount, baseUrl }) {
  const name = categoryName;
  const nameLower = name.toLowerCase();

  const faqs = [
    {
      q: `Are ${name} coloring pages free to download?`,
      a: `Yes! All ${name} coloring pages on our site are 100% free to download and print. No account, no sign-up, and no hidden fees — just click Download and print instantly.`,
    },
    {
      q: `How many ${name} coloring pages are available?`,
      a: `We currently have ${totalCount > 0 ? totalCount : 'a large collection of'} ${nameLower} coloring pages available, with new designs added regularly. Browse the full collection above.`,
    },
    {
      q: `What age group are ${name} coloring pages suitable for?`,
      a: `Our ${nameLower} coloring pages range from simple bold outlines for toddlers and preschoolers (ages 2–5) to detailed designs for older children (ages 6–12) and intricate patterns for adults and teens.`,
    },
    {
      q: `Can I use ${name} coloring pages in my classroom or homeschool?`,
      a: `Absolutely. All our ${nameLower} coloring pages are free for personal, classroom, and homeschool educational use. Print as many copies as you need for your students.`,
    },
    {
      q: `What format are the ${name} coloring pages in?`,
      a: `Every ${nameLower} coloring page is available as a high-resolution PDF file, optimised for A4 and US Letter paper sizes. Open in any PDF viewer and print in seconds.`,
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/**
 * Generate article schema
 */
export async function generateArticleSchema({ title, description, image, publishDate, modifiedDate, author = 'Admin' }) {
  const baseUrl = await getBaseUrl();
  const brand = await getCurrentBrand();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : brand.logo,
    datePublished: publishDate,
    dateModified: modifiedDate || publishDate,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: brand.name,
      logo: {
        '@type': 'ImageObject',
        url: brand.logo
      }
    }
  };
}
