import { getSiteUrl } from '@/config/brands';

/**
 * Collapse whitespace and cut to ~158 chars at a word boundary (Google truncates meta descriptions ~160).
 */
export function cleanDescription(text, max = 158) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).replace(/[\s,;:.\-–—]+$/, '') + '…';
}

/**
 * Drop a leading heading-like line ("Cat Coloring Pages — Free Printable Sheets") from
 * admin-written descriptions so the meta description starts with a real sentence.
 */
export function descriptionBody(text) {
  const lines = (text || '').replace(/\*\*|__/g, '').split(/\r?\n/).map((l) => l.replace(/^#+\s*/, '').trim()).filter(Boolean);
  if (lines.length > 1 && lines[0].length <= 100 && !/[.!?]$/.test(lines[0])) return lines.slice(1).join(' ');
  return lines.join(' ');
}

/** Stub descriptions (<70 chars) get a generic follow-up sentence so snippets aren't one short phrase. */
export function padDescription(body, extra) {
  const b = (body || '').trim();
  if (b.length >= 70) return b;
  return b ? `${b.replace(/[.!\s]+$/, '')}. ${extra}` : extra;
}

/** Page <title> (without brand suffix) for a subcategory, based on its parent collection. */
export function categoryTitle(name, parentName) {
  const parent = (parentName || '').toLowerCase();
  if (parent.includes('coloring')) return /coloring/i.test(name) ? `Free ${name}` : `Free ${name} Coloring Pages`;
  if (parent.includes('book')) return `${name} - Printable Books & Downloads`;
  return `Free Printable ${name}`;
}

/** Page <title> (without brand suffix) for a top-level collection. */
export function collectionTitle(name) {
  if (/printables?$/i.test(name)) return `Free ${name} - Download & Print`;
  if (/book/i.test(name)) return `${name} - Printable Books & Downloads`;
  return `Free Printable ${name}`;
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
 * @param {string} options.baseUrl - Base URL (optional, defaults to the brand's canonical origin)
 * @param {Object} options.brand - Brand config (required)
 */
export async function generateMetadata({ 
  title, 
  description, 
  keywords, 
  path = '', 
  image, 
  type = 'website',
  baseUrl: providedBaseUrl,
  brand
}) {
  const baseUrl = providedBaseUrl || getSiteUrl(brand);
  
  // Build full title with brand name
  const siteName = brand.name;
  const fullTitle = title ? `${title} | ${siteName}` : brand.seo.defaultTitle;
  
  // Use brand description as fallback
  const finalDescription = cleanDescription(description || brand.description);
  
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
export async function generateBreadcrumbSchema(items, baseUrl) {
  
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
export async function generateProductSchema({ product, brand, baseUrl: providedBaseUrl }) {
  const baseUrl = providedBaseUrl || getSiteUrl(brand);
  
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
export async function generateWebsiteSchema(brand) {
  const baseUrl = getSiteUrl(brand);
  
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
export async function generateOrganizationSchema(brand) {
  const baseUrl = getSiteUrl(brand);
  
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
export async function generateHowToPrintSchema({ productTitle, baseUrl }) {

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
export async function generateArticleSchema({ title, description, image, publishDate, modifiedDate, author = 'Admin', brand }) {
  const baseUrl = getSiteUrl(brand);
  
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
