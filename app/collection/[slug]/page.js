import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';

// Cache for 5 minutes for faster loads
export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = params;
  
  try {
    const collection = await prisma.category.findFirst({
      where: { slug, parentId: null },
      select: { name: true, description: true }
    });
    
    if (!collection) return {};
    
    return {
      title: `${collection.name} - Creative Coloring Pages`,
      description: collection.description || `Browse ${collection.name.toLowerCase()} categories and find amazing printables.`,
    };
  } catch (error) {
    return {};
  }
}

async function getCollectionData(slug) {
  try {
    // Single query - get collection and its categories
    const collection = await prisma.category.findFirst({
      where: { slug, parentId: null, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        }
      }
    });
    
    if (!collection) return null;
    
    return {
      collection: { 
        id: collection.id, 
        name: collection.name, 
        slug: collection.slug, 
        description: collection.description 
      },
      categories: collection.children
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export default async function CollectionPage({ params }) {
  const { slug } = params;
  const data = await getCollectionData(slug);
  
  if (!data) {
    notFound();
  }
  
  const { collection, categories } = data;
  
  const collectionStyles = {
    'coloring-pages': {
      gradient: 'from-purple-500 to-pink-500',
      emoji: '🎨',
      categoryEmojis: ['🐾', '👑', '🎮', '📺', '🦄', '🎄', '📚', '🌸', '🌳', '🚗', '⚽', '🍦']
    },
    'calendars': {
      gradient: 'from-green-500 to-teal-500',
      emoji: '📅',
      categoryEmojis: ['📅', '📆', '📋', '📝', '🎓', '🎂', '🍽️', '✅', '🎯', '💪', '💰', '📄']
    },
    'printables': {
      gradient: 'from-orange-500 to-red-500',
      emoji: '📄',
      categoryEmojis: ['📝', '🃏', '🏆', '💌', '🏷️', '🎉', '🏷️', '🔖', '🖼️', '✓', '🎈', '🎲']
    },
    'bookshop': {
      gradient: 'from-indigo-500 to-purple-600',
      emoji: '📚',
      categoryEmojis: ['📖', '🧒', '📚', '🎨', '🍳', '💪', '📈', '🔮', '💕', '🎭', '🌍', '📓']
    }
  };
  
  const style = collectionStyles[slug] || collectionStyles['coloring-pages'];

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className={`bg-gradient-to-r ${style.gradient} rounded-3xl p-8 md:p-12 shadow-2xl mb-8`}>
          <div className="text-center space-y-4">
            <div className="text-8xl mb-4">{style.emoji}</div>
            <h1 className="text-4xl md:text-6xl font-black text-white">
              {collection.name}
            </h1>
            <p className="text-xl md:text-2xl font-bold text-white max-w-2xl mx-auto">
              {collection.description}
            </p>
            <div className="bg-white text-gray-800 font-black py-3 px-6 rounded-full inline-block">
              {categories.length} Categories Available!
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600 transition-colors font-bold">
            Home
          </Link>
          <span>›</span>
          <span className="text-gray-800 font-bold">{collection.name}</span>
        </div>

        {categories.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2">
                <Star className="h-8 w-8 text-yellow-500" />
                Browse Categories
              </h2>
              <p className="text-gray-600 font-medium mt-2">
                Click any category to see products
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {categories.map((category, idx) => {
                const colors = ['blue', 'pink', 'green', 'purple', 'orange', 'yellow', 'teal', 'indigo', 'red'];
                const color = colors[idx % colors.length];
                
                return (
                  <Link key={category.id} href={`/category/${category.slug}`}>
                    <div className={`bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-${color}-400`}>
                      <div className={`aspect-square bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-xl mb-3 flex items-center justify-center`}>
                        <span className="text-5xl">{style.categoryEmojis[idx] || '🎨'}</span>
                      </div>
                      <h3 className="font-black text-center text-gray-800 text-sm md:text-base">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-xs text-center text-gray-600 mt-1 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Link href="/">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-black text-xl py-6 px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-600 mb-4">
              No categories yet
            </h3>
            <p className="text-gray-500 mb-6">
              Categories will appear here soon!
            </p>
            <Link href="/">
              <Button size="lg">
                ← Back to Home
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}