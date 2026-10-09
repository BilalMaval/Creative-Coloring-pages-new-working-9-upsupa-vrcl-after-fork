import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/SearchBar';
import HeroLogo from '@/components/HeroLogo';
import SubscribeButton from '@/components/SubscribeButton';
import CategoryIcon from '@/components/CategoryIcon';
import { Sparkles, Star, Heart, Download, Palette, Smile } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { getAllActiveCategories, getSettingByKey, getHomeProducts } from '@/lib/db';
import { generateMetadata as genMeta, generateWebsiteSchema, generateOrganizationSchema, descriptionParagraphs, firstSentence } from '@/lib/seo';
import { getBrandByKey, getSiteUrl } from '@/config/brands';

// Generate homepage metadata
export async function generateMetadata({ params }) {
  const { brand: brandKey } = await params;
  const brand = getBrandByKey(brandKey);
  
  return genMeta({
    brand,
    title: brand.seo.defaultTitle,
    description: brand.description,
    path: '',
    image: brand.logo,
    keywords: brand.keywords
  });
}

// Cache for 1 hour - collections change infrequently; use on-demand revalidation from admin for updates
export const revalidate = 3600;

async function getHomeData() {
  try {
    // Run settings + categories in PARALLEL (was sequential — 2 round trips one after another)
    const [limitSetting, allCategories, homeProducts] = await Promise.all([
      getSettingByKey('homepage_category_limit'),
      getAllActiveCategories(),
      getHomeProducts(12),
    ]);

    let categoryLimit = 12;
    if (limitSetting) categoryLimit = parseInt(limitSetting.value) || 12;

    const collections = allCategories
      .filter(c => c.parentId === null)
      .slice(0, 4)
      .map(collection => ({
        ...collection,
        categories: allCategories
          .filter(c => c.parentId === collection.id && c.showOnHomepage)
          .sort((a, b) => a.homepageOrder - b.homepageOrder)
          .slice(0, categoryLimit)
      }));

    return { collections, categoryLimit, latest: homeProducts.latest, popular: homeProducts.popular };
  } catch (error) {
    console.error('Error fetching home data:', error);
    throw error;
  }
}

export default async function Home({ params }) {
  const { brand: brandKey } = await params;
  const brand = getBrandByKey(brandKey);
  const { collections, latest, popular } = await getHomeData();
  const baseUrl = getSiteUrl(brand);
  const websiteSchema = await generateWebsiteSchema(brand);
  const orgSchema = await generateOrganizationSchema(brand);
  
  // Collection list schema for SEO
  const collectionsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Printable Collections',
    numberOfItems: collections.length,
    itemListElement: collections.map((collection, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/collection/${collection.slug}`,
      name: collection.name
    }))
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionsSchema) }}
      />
      
      <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex-1">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center space-y-6">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <HeroLogo />
            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-black text-gray-800">
                {brand.name}
              </h1>
              <div className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-xl md:text-3xl py-3 px-8 rounded-full shadow-xl transform hover:scale-105 transition-transform">
                <Palette className="inline-block mr-2 h-8 w-8" />
                100% FREE Coloring Pages!
              </div>
            </div>
          </div>
          
          <p className="text-xl md:text-2xl font-bold text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Perfect for kids and families! Download, print, and color amazing pages!
          </p>
          
          {/* Search Bar */}
          <div className="flex justify-center pt-4">
            <div className="w-full max-w-2xl">
              <SearchBar />
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <div className="bg-white border-4 border-blue-400 text-blue-600 font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <Star className="inline-block mr-2 h-5 w-5" />
              {collections.length * 12}+ Collections
            </div>
            <div className="bg-white border-4 border-pink-400 text-pink-600 font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <Palette className="inline-block mr-2 h-5 w-5" />
              New Pages Daily
            </div>
            <div className="bg-white border-4 border-green-400 text-green-600 font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <Download className="inline-block mr-2 h-5 w-5" />
              Easy to Print!
            </div>
          </div>

          {/* ── Trust Badges ──────────────────────────────────────────── */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {/* SSL / Secure */}
            <div className="flex items-center gap-2 bg-green-50 border-2 border-green-300 text-green-700 font-bold text-sm py-2 px-4 rounded-full shadow-sm">
              <span className="text-lg">🔒</span>
              SSL Secured
            </div>
            {/* Family Safe */}
            <div className="flex items-center gap-2 bg-blue-50 border-2 border-blue-300 text-blue-700 font-bold text-sm py-2 px-4 rounded-full shadow-sm">
              <span className="text-lg">👨‍👩‍👧‍👦</span>
              100% Family Safe
            </div>
            {/* No Registration */}
            <div className="flex items-center gap-2 bg-purple-50 border-2 border-purple-300 text-purple-700 font-bold text-sm py-2 px-4 rounded-full shadow-sm">
              <span className="text-lg">✅</span>
              No Registration Required
            </div>
            {/* No Ads / Kid Safe */}
            <div className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-300 text-yellow-700 font-bold text-sm py-2 px-4 rounded-full shadow-sm">
              <span className="text-lg">🚫</span>
              No Intrusive Ads
            </div>
            {/* Free Forever */}
            <div className="flex items-center gap-2 bg-pink-50 border-2 border-pink-300 text-pink-700 font-bold text-sm py-2 px-4 rounded-full shadow-sm">
              <span className="text-lg">🎁</span>
              Always Free
            </div>
          </div>
        </div>
      </section>

      {/* 3 MAIN COLLECTIONS */}
      <section className="container mx-auto px-4 mb-16">
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-2">
            🎨 Choose Your Collection! 🌈
          </h2>
          <p className="text-center text-white font-bold text-lg md:text-xl">
            Click on any collection to explore amazing content!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {collections.map((collection, index) => {
            const gradients = [
              'from-blue-500 to-purple-600',
              'from-green-500 to-teal-600', 
              'from-pink-500 to-orange-500',
              'from-indigo-500 to-purple-600'
            ];
            const emojis = ['🎨', '📅', '📄', '📚'];
            
            return (
              <Link key={collection.id} href={`/collection/${collection.slug}`}>
                <div className={`bg-gradient-to-br ${gradients[index]} rounded-3xl p-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-white`}>
                  <div className="text-center space-y-4">
                    <div className="text-8xl mb-4">{emojis[index]}</div>
                    <h3 className="text-3xl md:text-4xl font-black text-white">
                      {collection.name}
                    </h3>
                    <p className="text-white font-bold text-lg">
                      {firstSentence(descriptionParagraphs(collection.description).join(' ')) || collection.description}
                    </p>
                    <div className="bg-white text-gray-800 font-black py-3 px-6 rounded-full inline-block">
                      {collection.categories?.length || 0} Categories Inside!
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* COLLECTION 1: COLORING PAGES CATEGORIES */}
      {collections[0] && collections[0].categories && (
        <section className="container mx-auto px-4 mb-16">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 shadow-2xl mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
              <h2 className="text-3xl md:text-5xl font-black text-white text-center">
                {collections[0].name} Categories
              </h2>
              <Heart className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-center text-white font-bold text-lg md:text-xl">
              Click any category to see beautiful coloring pages!
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {collections[0].categories.map((category, idx) => {
              const colors = ['blue', 'pink', 'green', 'purple', 'orange', 'yellow'];
              const color = colors[idx % colors.length];
              
              return (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <div className={`bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-${color}-400`}>
                    <div className={`aspect-square bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-xl mb-3 flex items-center justify-center overflow-hidden`}>
                      <CategoryIcon iconImage={category.iconImage} emoji={category.emoji || '🎨'} name={category.name} />
                    </div>
                    <h3 className="font-black text-center text-gray-800 text-sm md:text-base">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* See More Button */}
          <div className="text-center mt-10">
            <Link href={`/collection/${collections[0].slug}`}>
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black text-xl md:text-2xl py-6 md:py-8 px-8 md:px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all">
                <Sparkles className="mr-2 h-6 w-6" />
                See More {collections[0].name}
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* COLLECTION 2: CALENDARS CATEGORIES */}
      {collections[1] && collections[1].categories && (
        <section className="container mx-auto px-4 mb-16">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl p-8 shadow-2xl mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="h-8 w-8 text-yellow-300 animate-pulse" />
              <h2 className="text-3xl md:text-5xl font-black text-white text-center">
                {collections[1].name} Categories
              </h2>
              <Star className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-center text-white font-bold text-lg md:text-xl">
              Plan your days with our free printable calendars!
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {collections[1].categories.map((category, idx) => {
              const colors = ['green', 'teal', 'blue', 'indigo', 'purple', 'pink'];
              const color = colors[idx % colors.length];
              
              return (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <div className={`bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-${color}-400`}>
                    <div className={`aspect-square bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-xl mb-3 flex items-center justify-center overflow-hidden`}>
                      <CategoryIcon iconImage={category.iconImage} emoji={category.emoji || '📅'} name={category.name} />
                    </div>
                    <h3 className="font-black text-center text-gray-800 text-sm md:text-base">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* See More Button */}
          <div className="text-center mt-10">
            <Link href={`/collection/${collections[1].slug}`}>
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-black text-xl md:text-2xl py-6 md:py-8 px-8 md:px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all">
                <Star className="mr-2 h-6 w-6" />
                See More {collections[1].name}
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* COLLECTION 3: PRINTABLES CATEGORIES */}
      {collections[2] && collections[2].categories && (
        <section className="container mx-auto px-4 mb-16">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 shadow-2xl mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Smile className="h-8 w-8 text-yellow-300 animate-pulse" />
              <h2 className="text-3xl md:text-5xl font-black text-white text-center">
                {collections[2].name} Categories
              </h2>
              <Smile className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-center text-white font-bold text-lg md:text-xl">
              Free templates for every occasion!
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {collections[2].categories.map((category, idx) => {
              const colors = ['orange', 'red', 'pink', 'purple', 'blue', 'green'];
              const color = colors[idx % colors.length];
              
              return (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <div className={`bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-${color}-400`}>
                    <div className={`aspect-square bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-xl mb-3 flex items-center justify-center overflow-hidden`}>
                      <CategoryIcon iconImage={category.iconImage} emoji={category.emoji || '📄'} name={category.name} />
                    </div>
                    <h3 className="font-black text-center text-gray-800 text-sm md:text-base">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* See More Button */}
          <div className="text-center mt-10">
            <Link href={`/collection/${collections[2].slug}`}>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black text-xl md:text-2xl py-6 md:py-8 px-8 md:px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all">
                <Smile className="mr-2 h-6 w-6" />
                See More {collections[2].name}
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* COLLECTION 4: BOOKSHOP CATEGORIES */}
      {collections[3] && collections[3].categories && (
        <section className="container mx-auto px-4 mb-16">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-2xl mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
              <h2 className="text-3xl md:text-5xl font-black text-white text-center">
                {collections[3].name} Categories
              </h2>
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-center text-white font-bold text-lg md:text-xl">
              Browse our collection of free and premium eBooks!
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {collections[3].categories.map((category, idx) => {
              const colors = ['indigo', 'purple', 'blue', 'pink', 'violet', 'fuchsia'];
              const color = colors[idx % colors.length];
              
              return (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <div className={`bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-${color}-400`}>
                    <div className={`aspect-square bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-xl mb-3 flex items-center justify-center overflow-hidden`}>
                      <CategoryIcon iconImage={category.iconImage} emoji={category.emoji || '📚'} name={category.name} />
                    </div>
                    <h3 className="font-black text-center text-gray-800 text-sm md:text-base">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* See More Button */}
          <div className="text-center mt-10">
            <Link href={`/collection/${collections[3].slug}`}>
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xl md:text-2xl py-6 md:py-8 px-8 md:px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all">
                <Sparkles className="mr-2 h-6 w-6" />
                See More {collections[3].name}
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Newest + Most popular: direct links from the homepage to product pages */}
      {[['Newest Designs', latest], ['Most Popular Downloads', popular]].map(([title, items]) =>
        items.length > 0 && (
          <section key={title} className="container mx-auto px-4 mb-16">
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border-4 border-purple-200">
              <h2 className="text-3xl md:text-4xl font-black text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">
                {title}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} showRating={false} />
                ))}
              </div>
            </div>
          </section>
        )
      )}

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-purple-300">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">
            Why Kids Love {brand.shortName}!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="font-black text-2xl mb-3 text-white">Super Fun!</h3>
              <p className="text-white font-bold">
                Thousands of cool coloring pages that kids love!
              </p>
            </div>
            <div className="text-center bg-gradient-to-br from-pink-500 to-orange-500 rounded-3xl p-8 shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="font-black text-2xl mb-3 text-white">Always Free!</h3>
              <p className="text-white font-bold">
                Download and print as many times as you want - FREE!
              </p>
            </div>
            <div className="text-center bg-gradient-to-br from-green-500 to-blue-500 rounded-3xl p-8 shadow-xl transform hover:scale-105 transition-transform">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="font-black text-2xl mb-3 text-white">Easy Peasy!</h3>
              <p className="text-white font-bold">
                One click to download, print, and start coloring!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white">
              📬 Never Miss New Coloring Pages!
            </h2>
            <p className="text-white font-bold text-lg md:text-xl max-w-2xl mx-auto">
              Join thousands of families getting FREE coloring pages & creative activities delivered to their inbox!
            </p>
            <div className="pt-4">
              <SubscribeButton />
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}