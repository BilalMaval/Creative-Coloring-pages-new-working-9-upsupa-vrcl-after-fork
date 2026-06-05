import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import ProductPageClient from './ProductPageClient';
import { generateMetadata as genMeta, generateProductSchema, generateBreadcrumbSchema, getBaseUrl } from '@/lib/seo';
import { getBrandByDomain } from '@/config/brands';

// Cache for 2 minutes - ISR for fast page loads
export const revalidate = 120;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  try {
    const product = await prisma.product.findFirst({
      where: { slug },
      select: { 
        title: true, 
        description: true, 
        webpPath: true,
        isFree: true,
        category: { 
          select: { 
            name: true,
            parent: { select: { name: true } }
          } 
        } 
      }
    });
    
    if (!product) return {};
    
    // Build category path for better SEO
    const categoryPath = product.category?.parent 
      ? `${product.category.parent.name} > ${product.category.name}`
      : product.category?.name || 'Coloring Page';
    
    const priceText = product.isFree ? 'FREE' : 'Premium';
    
    return genMeta({
      title: `${product.title} - ${priceText} Download`,
      description: product.description || `Download ${product.title} - a beautiful ${categoryPath.toLowerCase()} printable. High-quality PDF ready to print and color. ${brand.tagline}`,
      path: `/product/${slug}`,
      // CRITICAL: Use the actual product image for OG (important for Pinterest!)
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
    // Single optimized query with select
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        webpPath: true,
        pdfPath: true,
        price: true,
        isFree: true,
        isFeatured: true,
        downloads: true,
        views: true,
        createdAt: true,
        categoryId: true,
        customFields: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true }
        }
      }
    });
    
    if (!product) return null;
    
    // Calculate average rating
    const ratings = product.reviews || [];
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    // Get related products - simpler query
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id }
      },
      take: 6,
      orderBy: { downloads: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        webpPath: true,
        isFree: true,
        price: true
      }
    });
    
    // Increment view count in background (don't wait)
    prisma.product.update({
      where: { id: product.id },
      data: { views: { increment: 1 } }
    }).catch(() => {});
    
    // Serialize data for client components (convert Decimal to number)
    const serializedProduct = {
      ...product,
      price: product.price ? Number(product.price) : 0,
      createdAt: product.createdAt.toISOString(),
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: ratings.length
    };
    
    const serializedRelated = relatedProducts.map(p => ({
      ...p,
      price: p.price ? Number(p.price) : 0
    }));
    
    return { product: serializedProduct, relatedProducts: serializedRelated };
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
        gradient={gradient}
      />
    </>
  );
}
