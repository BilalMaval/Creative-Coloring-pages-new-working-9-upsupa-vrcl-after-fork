import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductPageClient from './ProductPageClient';

// Cache for 2 minutes - ISR for fast page loads
export const revalidate = 120;

export async function generateMetadata({ params }) {
  const { slug } = params;
  
  try {
    const product = await prisma.product.findFirst({
      where: { slug },
      select: { title: true, description: true, category: { select: { name: true } } }
    });
    
    if (!product) return {};
    
    return {
      title: `${product.title} - Free Download | Creative Coloring Pages`,
      description: product.description || `Download free ${product.title} printable.`,
    };
  } catch (error) {
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
        }
      }
    });
    
    if (!product) return null;
    
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
      createdAt: product.createdAt.toISOString()
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
  const { slug } = params;
  const data = await getProductData(slug);
  
  if (!data) {
    notFound();
  }
  
  const { product, relatedProducts } = data;
  const gradient = getGradient(product);

  return (
    <ProductPageClient 
      product={product}
      relatedProducts={relatedProducts}
      gradient={gradient}
    />
  );
}
