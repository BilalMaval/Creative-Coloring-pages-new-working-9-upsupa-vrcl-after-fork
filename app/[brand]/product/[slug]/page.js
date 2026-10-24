import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/db';
import { getBundlesForProduct } from '@/lib/bundles';
import ProductPageClient from './ProductPageClient';
import { generateMetadata as genMeta, generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { getBrandByKey, getSiteUrl } from '@/config/brands';

import { productStaticParams } from '@/lib/staticParams';
// Cache for 2 minutes - ISR for fast page loads
export const revalidate = 86400; // 24h; admin edits refresh the affected pages immediately (lib/revalidate.js)

// Most visited pages are built at deploy time; the rest on first request, then cached (see lib/staticParams.js).
export async function generateStaticParams() {
  return productStaticParams();
}

export async function generateMetadata({ params }) {
  const { brand: brandKey, slug } = await params;
  const brand = getBrandByKey(brandKey);
  
  try {
    const data = await getProductBySlug(slug);
    if (!data) return {};

    const { product } = data;
    const categoryPath = product.category?.parent
      ? `${product.category.parent.name} > ${product.category.name}`
      : product.category?.name || 'Coloring Page';
    const priceText = product.isFree ? 'FREE' : 'Premium';

    const metaTitle = product.customFields?.metaTitle || `${product.title} - ${priceText} Download`;
    const metaDesc = product.customFields?.metaDescription
      || product.description
      || `Download ${product.title} - a beautiful ${categoryPath.toLowerCase()} printable. High-quality PDF ready to print and color. ${brand.tagline}`;

    return genMeta({
      brand,
      title: metaTitle,
      description: metaDesc,
      path: `/product/${slug}`,
      image: product.webpPath || brand.logo,
      keywords: `${product.title.toLowerCase()}, free coloring page, printable ${product.category?.name?.toLowerCase() || 'coloring page'}, download coloring sheet`,
      type: 'product'
    });
  } catch (error) {
    console.error('Error generating product metadata:', error);
    throw error;
  }
}

async function getProductData(slug) {
  try {
    return await getProductBySlug(slug);
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

function getGradient(product) {
  if (!product.category?.parent) return 'from-blue-500 to-purple-500';
  
  const parentSlug = product.category.parent.slug;
  if (parentSlug === 'coloring-pages') return 'from-purple-500 to-pink-500';
  if (parentSlug === 'calendars') return 'from-green-500 to-teal-500';
  if (parentSlug === 'printables') return 'from-orange-500 to-red-500';
  return 'from-blue-500 to-purple-500';
}

export default async function ProductPage({ params }) {
  const { brand: brandKey, slug } = await params;
  const brand = getBrandByKey(brandKey);
  const data = await getProductData(slug);
  
  if (!data) {
    notFound();
  }
  
  const { product, relatedProducts } = data;
  let bundles = [];
  try { bundles = await getBundlesForProduct(product.id); } catch (e) { console.error('Bundles for product error:', e); }
  const gradient = getGradient(product);
  const baseUrl = getSiteUrl(brand);
  
  // Generate breadcrumb schema
  const breadcrumbItems = [
    { name: 'Home', url: '/' }
  ];
  
  if (product.category?.parent) {
    breadcrumbItems.push({
      name: product.category.parent.name,
      url: `/collection/${product.category.parent.slug}`
    });
  }
  
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `/category/${product.category.slug}`
    });
  }
  
  breadcrumbItems.push({
    name: product.title,
    url: `/product/${product.slug}`
  });
  
  const breadcrumbSchema = await generateBreadcrumbSchema(breadcrumbItems, baseUrl);
  
  // Generate product schema
  const productSchema = await generateProductSchema({ product, brand, baseUrl });

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      
      <ProductPageClient 
        product={product}
        relatedProducts={relatedProducts}
        bundles={bundles}
        gradient={gradient}
      />
    </>
  );
}
