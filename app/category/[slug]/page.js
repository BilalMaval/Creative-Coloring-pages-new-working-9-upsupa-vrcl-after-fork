import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Download, ArrowLeft, Grid3x3, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';

// Cache for 5 minutes for faster loads
export const revalidate = 300;

// Star rating component
function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = params;
  
  try {
    const category = await prisma.category.findFirst({
      where: { slug },
      select: { name: true, description: true, parent: { select: { name: true } } }
    });
    
    if (!category) return {};
    
    return {
      title: `${category.name} - Creative Coloring Pages`,
      description: category.description || `Browse ${category.name.toLowerCase()} and find amazing printables.`,
    };
  } catch (error) {
    return {};
  }
}

async function getCategoryData(slug) {
  try {
    // Single query to get category with parent
    const category = await prisma.category.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parent: { select: { id: true, name: true, slug: true } }
      }
    });
    
    if (!category) return null;
    
    // Optimized: Only get products for THIS category directly
    const products = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        webpPath: true,
        isFree: true,
        isFeatured: true,
        price: true,
        downloads: true,
        reviews: {
          where: { isApproved: true },
          select: { rating: true }
        }
      },
      take: 50 // Limit for performance
    });
    
    // Calculate average rating for each product
    const productsWithRating = products.map(product => {
      const ratings = product.reviews || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length
      };
    });
    
    return {
      category,
      products: productsWithRating
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

export default async function CategoryPage({ params }) {
  const { slug } = params;
  const data = await getCategoryData(slug);
  
  if (!data) {
    notFound();
  }
  
  const { category, products } = data;
  
  // Determine gradient based on parent collection
  const getGradient = () => {
    if (!category.parent) return 'from-blue-500 to-purple-500';
    
    const parentSlug = category.parent.slug;
    if (parentSlug === 'coloring-pages') return 'from-purple-500 to-pink-500';
    if (parentSlug === 'calendars') return 'from-green-500 to-teal-500';
    if (parentSlug === 'printables') return 'from-orange-500 to-red-500';
    if (parentSlug === 'bookshop') return 'from-indigo-500 to-purple-500';
    return 'from-blue-500 to-purple-500';
  };

  const gradient = getGradient();

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradient} rounded-3xl p-8 md:p-12 shadow-2xl mb-8`}>
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xl md:text-2xl font-bold text-white max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white text-gray-800 font-black py-3 px-6 rounded-full inline-block">
                <Grid3x3 className="inline-block mr-2 h-5 w-5" />
                {products.length} {products.length === 1 ? 'Item' : 'Items'}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600 transition-colors font-bold">
            Home
          </Link>
          <span>›</span>
          {category.parent && (
            <>
              <Link href={`/collection/${category.parent.slug}`} className="hover:text-blue-600 transition-colors font-bold">
                {category.parent.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-gray-800 font-bold">{category.name}</span>
        </div>

        {products.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2">
                <Star className="h-8 w-8 text-yellow-500" />
                Available Products
              </h2>
              <p className="text-gray-600 font-medium mt-2">
                Click any product to view details and download
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`}>
                  <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-gray-200 hover:border-blue-400">
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 relative overflow-hidden">
                      {product.webpPath ? (
                        <Image
                          src={product.webpPath}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-4xl">🎨</span>
                        </div>
                      )}
                      {product.isFeatured && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full">
                          ⭐ Featured
                        </div>
                      )}
                      {product.isFree ? (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-black px-2 py-1 rounded-full">
                          FREE
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-black px-2 py-1 rounded-full">
                          ${Number(product.price).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-center text-gray-800 text-xs md:text-sm line-clamp-2 mb-1">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <StarRating rating={product.averageRating || 0} />
                      {product.reviewCount > 0 && (
                        <span className="text-xs text-gray-500">({product.reviewCount})</span>
                      )}
                    </div>
                    {/* Only show downloads when >= 1000 */}
                    {product.downloads >= 1000 && (
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <Download className="h-3 w-3" />
                        <span>{product.downloads}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              {category.parent ? (
                <Link href={`/collection/${category.parent.slug}`}>
                  <Button size="lg" className={`bg-gradient-to-r ${gradient} text-white font-black text-xl py-6 px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all`}>
                    <ArrowLeft className="mr-2 h-6 w-6" />
                    Back to {category.parent.name}
                  </Button>
                </Link>
              ) : (
                <Link href="/">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-black text-xl py-6 px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all">
                    <ArrowLeft className="mr-2 h-6 w-6" />
                    Back to Home
                  </Button>
                </Link>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl p-12 shadow-xl max-w-2xl mx-auto">
              <Heart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
              <h3 className="text-3xl font-black text-gray-600 mb-4">
                No Products Yet
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                We're working on adding amazing {category.name.toLowerCase()} for you!
              </p>
              {category.parent ? (
                <Link href={`/collection/${category.parent.slug}`}>
                  <Button size="lg" className={`bg-gradient-to-r ${gradient} text-white font-black text-xl py-4 px-8 rounded-full shadow-xl`}>
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Browse Other Categories
                  </Button>
                </Link>
              ) : (
                <Link href="/">
                  <Button size="lg">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Home
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
