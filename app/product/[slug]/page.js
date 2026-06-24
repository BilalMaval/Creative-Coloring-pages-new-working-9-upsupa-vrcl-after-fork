import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getProductBySlug } from '@/lib/db';
import ProductPageClient from './ProductPageClient';
import { generateMetadata as genMeta, generateProductSchema, generateBreadcrumbSchema, generateHowToPrintSchema, getBaseUrl } from '@/lib/seo';
import { getBrandByDomain } from '@/config/brands';

// Cache for 2 minutes - ISR for fast page loads
export const revalidate = 120;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  try {
    const data = await getProductBySlug(slug);
    if (!data) return {};

    const { product } = data;
    const categoryPath = product.category?.parent
      ? `${product.category.parent.name} > ${product.category.name}`
      : product.category?.name || 'Coloring Page';
    const priceText = product.isFree ? 'FREE' : 'Premium';

    return genMeta({
      title: `${product.title} - ${priceText} Download`,
      description: product.description || `Download ${product.title} - a beautiful ${categoryPath.toLowerCase()} printable. High-quality PDF ready to print and color. ${brand.tagline}`,
      path: `/product/${slug}`,
      image: product.webpPath || brand.logo,
      keywords: `${product.title.toLowerCase()}, free coloring page, printable ${product.category?.name?.toLowerCase() || 'coloring page'}, download coloring sheet`,
      type: 'product'
    });
  } catch (error) {
    console.error('Error generating product metadata:', error);
    return {};
  }
}

async function getProductData(slug) {
  try {
    return await getProductBySlug(slug);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
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
  const { slug } = await params;
  const data = await getProductData(slug);
  
  if (!data) {
    notFound();
  }
  
  const { product, relatedProducts } = data;
  const gradient = getGradient(product);
  const baseUrl = await getBaseUrl();
  
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
  
  const breadcrumbSchema = await generateBreadcrumbSchema(breadcrumbItems);
  
  // Generate product schema
  const productSchema = await generateProductSchema({ product, baseUrl });

  // Generate HowTo schema — "How to print this coloring page"
  const howToSchema = await generateHowToPrintSchema({ productTitle: product.title, baseUrl });

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      
      <ProductPageClient 
        product={product}
        relatedProducts={relatedProducts}
        gradient={gradient}
      />
    </>
  );
}
