import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductPageClient from './ProductPageClient';

// Revalidate every 60 seconds for faster page loads
export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = params;
  
  try {
    const product = await prisma.product.findFirst({
      where: { slug },
      include: { category: true }
    });
    
    if (!product) {
      return {};
    }
    
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
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true
      },
      include: {
        category: {
          include: {
            parent: true
          }
        }
      }
    });
    
    if (!product) return null;
    
    // Get related products from same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id }
      },
      take: 6,
      orderBy: [
        { isFeatured: 'desc' },
        { downloads: 'desc' }
      ]
    });
    
    // Increment view count
    await prisma.product.update({
      where: { id: product.id },
      data: { views: { increment: 1 } }
    });
    
    return {
      product: JSON.parse(JSON.stringify(product)),
      relatedProducts: JSON.parse(JSON.stringify(relatedProducts))
    };
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
