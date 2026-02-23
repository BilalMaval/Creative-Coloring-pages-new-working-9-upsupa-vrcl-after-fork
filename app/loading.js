import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/SearchBar';
import { Sparkles, Star, Heart, Download, Palette, Smile } from 'lucide-react';

// Static fallback data for instant loading
const STATIC_COLLECTIONS = [
  { id: '1', name: 'Coloring Pages', slug: 'coloring-pages', description: 'Beautiful coloring pages for all ages', categories: [] },
  { id: '2', name: 'Calendars', slug: 'calendars', description: 'Free printable calendars', categories: [] },
  { id: '3', name: 'Printables', slug: 'printables', description: 'Useful printable templates', categories: [] },
  { id: '4', name: 'Book Shop', slug: 'bookshop', description: 'eBooks and coloring books', categories: [] },
];

// This is a skeleton component that shows immediately
function HomeSkeleton() {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Hero Section - Static content loads instantly */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              <Image
                src="https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png"
                alt="Creative Coloring Pages Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
                sizes="(max-width: 768px) 192px, 256px"
              />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-black text-gray-800">
                Creative Coloring Pages
              </h1>
              <div className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-xl md:text-3xl py-3 px-8 rounded-full shadow-xl">
                <Palette className="inline-block mr-2 h-8 w-8" />
                100% FREE Coloring Pages!
              </div>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Perfect for kids and families! Download, print, and color amazing pages!
          </p>
          <div className="flex justify-center pt-4">
            <div className="w-full max-w-2xl">
              <SearchBar />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <div className="bg-white border-4 border-blue-400 text-blue-600 font-bold py-4 px-6 rounded-2xl shadow-lg">
              <Star className="inline-block mr-2 h-5 w-5" />
              48+ Collections
            </div>
            <div className="bg-white border-4 border-pink-400 text-pink-600 font-bold py-4 px-6 rounded-2xl shadow-lg">
              <Palette className="inline-block mr-2 h-5 w-5" />
              New Pages Daily
            </div>
            <div className="bg-white border-4 border-green-400 text-green-600 font-bold py-4 px-6 rounded-2xl shadow-lg">
              <Download className="inline-block mr-2 h-5 w-5" />
              Easy to Print!
            </div>
          </div>
        </div>
      </section>

      {/* Collections Section */}
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
          {STATIC_COLLECTIONS.map((collection, index) => {
            const gradients = ['from-blue-500 to-purple-600', 'from-green-500 to-teal-600', 'from-pink-500 to-orange-500', 'from-indigo-500 to-purple-600'];
            const emojis = ['🎨', '📅', '📄', '📚'];
            return (
              <Link key={collection.id} href={`/collection/${collection.slug}`}>
                <div className={`bg-gradient-to-br ${gradients[index]} rounded-3xl p-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-white`}>
                  <div className="text-center space-y-4">
                    <div className="text-8xl mb-4">{emojis[index]}</div>
                    <h3 className="text-3xl md:text-4xl font-black text-white">{collection.name}</h3>
                    <p className="text-white font-bold text-lg">{collection.description}</p>
                    <div className="bg-white text-gray-800 font-black py-3 px-6 rounded-full inline-block">
                      Browse Collection
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-purple-300">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">
            Why Kids Love CCP!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-xl">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="font-black text-2xl mb-3 text-white">Super Fun!</h3>
              <p className="text-white font-bold">Thousands of cool coloring pages that kids love!</p>
            </div>
            <div className="text-center bg-gradient-to-br from-pink-500 to-orange-500 rounded-3xl p-8 shadow-xl">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="font-black text-2xl mb-3 text-white">Always Free!</h3>
              <p className="text-white font-bold">Download and print as many times as you want - FREE!</p>
            </div>
            <div className="text-center bg-gradient-to-br from-green-500 to-blue-500 rounded-3xl p-8 shadow-xl">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="font-black text-2xl mb-3 text-white">Easy Peasy!</h3>
              <p className="text-white font-bold">One click to download, print, and start coloring!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeSkeleton;
