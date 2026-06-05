import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { generateMetadata as genMeta, getCurrentBrand, generateOrganizationSchema } from '@/lib/seo';
import { getBrandByDomain } from '@/config/brands';

export async function generateMetadata() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  return genMeta({
    title: `About Us - ${brand.name}`,
    description: `Learn about ${brand.name} - our mission to provide free, high-quality printable coloring pages and mandalas for kids and adults. Discover who we are and what we do.`,
    path: '/about',
    keywords: `about ${brand.name}, coloring pages company, printable coloring sheets, free coloring pages, ${brand.name} mission`
  });
}

export const revalidate = 3600; // Cache for 1 hour

async function getPageContent() {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: 'about' }
    });
    return page ? JSON.parse(JSON.stringify(page)) : null;
  } catch (error) {
    console.error('Error fetching about page:', error);
    return null;
  }
}

export default async function AboutPage() {
  const pageContent = await getPageContent();
  const brand = await getCurrentBrand();
  const orgSchema = await generateOrganizationSchema();

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      
      <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-12 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              About {brand.name}
            </h1>
            <p className="text-xl md:text-2xl font-bold text-white/90">
              {brand.tagline}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {pageContent?.body ? (
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
                <div className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: pageContent.body }} />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Welcome Section */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-purple-200">
                  <h2 className="text-3xl font-black text-purple-600 mb-6 flex items-center gap-3">
                    <span className="text-4xl">👋</span> Welcome to {brand.name}
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    We are passionate about bringing joy, creativity, and relaxation to people of all ages through the art of coloring. Our mission is simple: to provide a comprehensive collection of free, high-quality printable coloring pages and mandala designs that anyone can download and enjoy.
                  </p>
                </div>

                {/* Our Story Section */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-pink-200">
                  <h2 className="text-3xl font-black text-pink-600 mb-6 flex items-center gap-3">
                    <span className="text-4xl">📖</span> Our Story
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Founded with a love for art and creativity, {brand.name} was created to make coloring accessible to everyone. We believe that coloring is not just a children's activity – it's a powerful tool for stress relief, mindfulness, and creative expression for people of all ages.
                  </p>
                </div>

                {/* What We Offer Section */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-blue-200">
                  <h2 className="text-3xl font-black text-blue-600 mb-6 flex items-center gap-3">
                    <span className="text-4xl">🎨</span> What We Offer
                  </h2>
                  <ul className="space-y-4">
                    {[
                      { emoji: '✏️', text: 'Thousands of free printable coloring pages' },
                      { emoji: '🌀', text: 'Beautiful mandala designs for relaxation and meditation' },
                      { emoji: '👶', text: 'Designs suitable for all skill levels - from kids to adults' },
                      { emoji: '🆕', text: 'Regular updates with new content every week' },
                      { emoji: '📄', text: 'High-quality PDFs optimized for printing' },
                      { emoji: '🆓', text: 'No registration or subscription required' },
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-4 text-lg text-gray-700">
                        <span className="text-2xl">{item.emoji}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Our Values Section */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-green-200">
                  <h2 className="text-3xl font-black text-green-600 mb-6 flex items-center gap-3">
                    <span className="text-4xl">💚</span> Our Values
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-800 mb-2">Accessibility</h3>
                      <p className="text-lg text-gray-700">
                        We believe everyone should have access to quality coloring resources, which is why all our content is completely free.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-800 mb-2">Quality</h3>
                      <p className="text-lg text-gray-700">
                        Each design is carefully selected and optimized to ensure the best printing and coloring experience.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-800 mb-2">Community</h3>
                      <p className="text-lg text-gray-700">
                        We're building a community of coloring enthusiasts who share a love for creativity and self-expression.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 md:p-12 shadow-xl text-center text-white">
                  <h2 className="text-3xl font-black mb-4 flex items-center justify-center gap-3">
                    <span className="text-4xl">💌</span> Get in Touch
                  </h2>
                  <p className="text-lg mb-6">
                    We love hearing from our users! If you have suggestions, requests, or just want to share your colored creations, please don't hesitate to contact us.
                  </p>
                  <a 
                    href="/contact" 
                    className="inline-block bg-white text-purple-600 font-black text-lg py-4 px-8 rounded-full hover:scale-105 transition-transform shadow-lg"
                  >
                    Contact Us →
                  </a>
                </div>

                {/* Thank You Section */}
                <div className="text-center py-8">
                  <p className="text-2xl font-black text-gray-800">
                    Thank you for being part of our coloring community! 🌈
                  </p>
                  <p className="text-xl text-gray-600 mt-2">
                    Happy coloring from the {brand.name} team! ❤️
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
