import { getPageBySlug } from '@/lib/db';
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
    return await getPageBySlug('about');
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

                {/* ── Meet the Team ───────────────────────────────────────── */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-yellow-200">
                  <h2 className="text-3xl font-black text-yellow-600 mb-2 flex items-center gap-3">
                    <span className="text-4xl">👋</span> Meet the Team
                  </h2>
                  <p className="text-gray-500 font-medium mb-10">
                    The small but mighty group behind every coloring page on this site.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      {
                        avatar: '🎨',
                        bg: 'from-purple-400 to-pink-400',
                        name: 'Sarah M.',
                        role: 'Creative Director & Co-founder',
                        bio: "Former art teacher with 10+ years in children's education. Sarah hand-picks every design and makes sure it's perfect for little hands.",
                        badge: '🖌️ Art & Design',
                      },
                      {
                        avatar: '💻',
                        bg: 'from-blue-400 to-cyan-400',
                        name: 'James K.',
                        role: 'Lead Developer & Co-founder',
                        bio: 'Full-stack developer passionate about making free resources accessible to every family, anywhere in the world.',
                        badge: '⚙️ Tech & Platform',
                      },
                      {
                        avatar: '✍️',
                        bg: 'from-green-400 to-teal-400',
                        name: 'Priya L.',
                        role: 'Content & SEO Lead',
                        bio: 'Writer and parent of two who researches every coloring theme to make sure our guides and descriptions actually help families.',
                        badge: '📝 Content',
                      },
                      {
                        avatar: '🌈',
                        bg: 'from-orange-400 to-yellow-400',
                        name: 'Lily T.',
                        role: 'Illustrator',
                        bio: 'Freelance illustrator specialising in bold, child-friendly linework. Lily creates our exclusive original coloring pages.',
                        badge: '🖊️ Illustration',
                      },
                      {
                        avatar: '📬',
                        bg: 'from-pink-400 to-rose-400',
                        name: 'Marco R.',
                        role: 'Community Manager',
                        bio: 'Responds to every email, gathers parent feedback, and champions user ideas that make the site better every month.',
                        badge: '💬 Support',
                      },
                      {
                        avatar: '🔒',
                        bg: 'from-indigo-400 to-purple-400',
                        name: 'Chen W.',
                        role: 'Security & Privacy',
                        bio: 'Keeps the site safe and family-friendly. No trackers, no ads targeting kids, no data ever sold — Chen makes sure of it.',
                        badge: '🛡️ Safety',
                      },
                    ].map((member) => (
                      <div
                        key={member.name}
                        className="flex flex-col items-center text-center bg-gray-50 rounded-2xl p-6 border-2 border-gray-100 hover:border-yellow-300 hover:shadow-lg transition-all"
                      >
                        {/* Avatar circle */}
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.bg} flex items-center justify-center text-4xl shadow-lg mb-4`}>
                          {member.avatar}
                        </div>
                        <h3 className="text-xl font-black text-gray-800">{member.name}</h3>
                        <p className="text-sm font-bold text-purple-600 mb-3">{member.role}</p>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>
                        <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-black px-3 py-1 rounded-full">
                          {member.badge}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-gray-500 text-sm mt-10">
                    {"We're a fully remote team spread across 4 countries, united by one goal: making creativity free for every child."}
                  </p>
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
