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

/** Admin-written description as clean paragraphs (markdown markers and a leading heading line removed). */
export function descriptionParagraphs(text) {
  const lines = (text || '').replace(/\*\*|__/g, '').split(/\r?\n/).map((l) => l.replace(/^#+\s*/, '').trim()).filter(Boolean);
  if (lines.length > 1 && lines[0].length <= 100 && !/[.!?]$/.test(lines[0])) lines.shift();
  return lines;
}

/** First sentence (or ~max chars at a word boundary) for hero banners. */
export function firstSentence(text, max = 200) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  const s = m ? m[0] : t;
  return s.length <= max ? s : cleanDescription(s, max);
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
  noindex = false,
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
      index: !noindex,
      follow: true,
      googleBot: {
        index: !noindex,
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
      url: `${baseUrl}/product/${product.slug}`,
      price: product.isFree ? '0' : String(product.salePrice || product.price || '0'),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: brand.name },
      priceSpecification: (!product.isFree && product.salePrice && product.price > product.salePrice) ? {
        '@type': 'UnitPriceSpecification',
        price: String(product.price),
        priceCurrency: 'USD',
        priceType: 'https://schema.org/StrikethroughPrice'
      } : undefined
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
 * Visible FAQ for coloring-page categories (rendered on the page and mirrored in FAQPage JSON-LD).
 * Answers avoid claims that could be false (everything free, licensing, exact paper sizes).
 */
export function categoryFaqs({ categoryName, totalCount }) {
  const name = categoryName;
  return [
    {
      q: `Are ${name} coloring pages free to download?`,
      a: `Pages marked FREE can be downloaded and printed at no cost, with no account or sign-up needed. If a design has a price, it is shown on its card and on its page.`,
    },
    {
      q: `How many ${name} coloring pages are there?`,
      a: `There ${totalCount === 1 ? 'is' : 'are'} currently ${totalCount > 0 ? totalCount : 'a growing number of'} ${totalCount === 1 ? 'design' : 'designs'} in this category, and new ones are added regularly.`,
    },
    {
      q: `Are these ${name} coloring pages suitable for kids or adults?`,
      a: `Designs vary: some have simple, bold outlines that suit younger children, while others have finer detail that older kids and adults may prefer. Open any page to preview it before you download.`,
    },
    {
      q: `How do I print a ${name} coloring page?`,
      a: `Open the page, choose Download, then print the file from your PDF viewer at actual size on standard US Letter or A4 paper. You can print as many copies as you need.`,
    },
  ];
}

export function faqSchemaFrom(faqs) {
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
