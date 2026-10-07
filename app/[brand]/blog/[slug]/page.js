import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, ArrowLeft, ArrowRight, Calendar, Tag, Layers } from 'lucide-react';
import { getAllPublishedPosts, getPostBySlug, formatDate } from '@/lib/blog-db';
import { getBrandByKey, getSiteUrl } from '@/config/brands';
import { cleanDescription } from '@/lib/seo';

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getAllPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { brand: brandKey, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const brand = getBrandByKey(brandKey);
  const canonical = `${getSiteUrl(brand)}/blog/${slug}`;
  const image = post.coverImage && post.coverImage.startsWith('http') ? post.coverImage : brand.logo;
  const description = cleanDescription(post.description);
  return {
    title: post.metaTitle || post.title,
    description,
    alternates: { canonical },
    twitter: { card: 'summary_large_image', title: post.metaTitle || post.title, description, images: [image] },
    openGraph: {
      title: post.metaTitle || post.title,
      description,
      url: canonical,
      siteName: brand.name,
      images: [image],
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime:  post.updatedAt,
      tags: post.tags,
    },
  };
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionBlock({ section }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-4 leading-tight">
        {section.heading}
      </h2>

      {section.items && (
        <ul className="space-y-3">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="mt-1.5 flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full" />
              <span
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>'),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {section.content && (
        <div>
          {section.content.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="text-gray-700 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{
                __html: para
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                  .replace(/\n/g, '<br />'),
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FAQBlock({ faqs }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-6">
        Frequently Asked Questions
      </h2>
      <div className="space-y-5">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="font-black text-gray-800 mb-2 text-lg">{faq.q}</h3>
            <p className="text-gray-700 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Tag → category-slug lookup ──────────────────────────────────────────────
// Maps common tag words / themes to a live category slug so blog posts can
// deep-link into the topical cluster they belong to.
const TAG_CATEGORY_MAP = {
  // Animals
  animals: { slug: 'animals', label: 'Animals' },
  animal: { slug: 'animals', label: 'Animals' },
  dogs: { slug: 'dogs', label: 'Dogs' },
  dog: { slug: 'dogs', label: 'Dogs' },
  cats: { slug: 'cats', label: 'Cats' },
  cat: { slug: 'cats', label: 'Cats' },
  horses: { slug: 'horses', label: 'Horses' },
  horse: { slug: 'horses', label: 'Horses' },
  birds: { slug: 'birds', label: 'Birds' },
  bird: { slug: 'birds', label: 'Birds' },
  dinosaurs: { slug: 'dinosaurs', label: 'Dinosaurs' },
  dinosaur: { slug: 'dinosaurs', label: 'Dinosaurs' },
  fish: { slug: 'fish', label: 'Fish' },
  // Nature & Plants
  flowers: { slug: 'flowers', label: 'Flowers' },
  flower: { slug: 'flowers', label: 'Flowers' },
  butterflies: { slug: 'butterflies', label: 'Butterflies' },
  butterfly: { slug: 'butterflies', label: 'Butterflies' },
  nature: { slug: 'nature', label: 'Nature' },
  trees: { slug: 'trees', label: 'Trees' },
  // Holidays & Seasonal
  christmas: { slug: 'christmas', label: 'Christmas' },
  halloween: { slug: 'halloween', label: 'Halloween' },
  easter: { slug: 'easter', label: 'Easter' },
  valentines: { slug: 'valentines', label: "Valentine's Day" },
  thanksgiving: { slug: 'thanksgiving', label: 'Thanksgiving' },
  // Characters & Fantasy
  unicorns: { slug: 'unicorns', label: 'Unicorns' },
  unicorn: { slug: 'unicorns', label: 'Unicorns' },
  dragons: { slug: 'dragons', label: 'Dragons' },
  dragon: { slug: 'dragons', label: 'Dragons' },
  mermaids: { slug: 'mermaids', label: 'Mermaids' },
  fairies: { slug: 'fairies', label: 'Fairies' },
  superheroes: { slug: 'superheroes', label: 'Superheroes' },
  // Kids themes
  princesses: { slug: 'princesses', label: 'Princesses' },
  princess: { slug: 'princesses', label: 'Princesses' },
  robots: { slug: 'robots', label: 'Robots' },
  space: { slug: 'space', label: 'Space' },
  vehicles: { slug: 'vehicles', label: 'Vehicles' },
  cars: { slug: 'vehicles', label: 'Vehicles' },
  trucks: { slug: 'vehicles', label: 'Vehicles' },
  // Art styles
  mandalas: { slug: 'mandalas', label: 'Mandalas' },
  mandala: { slug: 'mandalas', label: 'Mandalas' },
  // Calendars
  calendars: { slug: 'calendars', label: 'Calendars' },
  calendar: { slug: 'calendars', label: 'Calendars' },
};

/**
 * Given a list of tags, return up to 4 unique category links for the cluster box.
 * Skips tags that don't match anything in the map.
 */
function resolveClusterLinks(tags = []) {
  const seen = new Set();
  const links = [];
  for (const tag of tags) {
    const key = tag.toLowerCase().replace(/\s+/g, '');
    const match = TAG_CATEGORY_MAP[key];
    if (match && !seen.has(match.slug)) {
      seen.add(match.slug);
      links.push(match);
      if (links.length === 4) break;
    }
  }
  return links;
}

// ── Topical Cluster Box ─────────────────────────────────────────────────────
function TopicalClusterBox({ tags, relatedCategory }) {
  // Combine tag-derived links with the admin-set relatedCategory
  const tagLinks = resolveClusterLinks(tags);

  // Build the final list, putting relatedCategory first (if not already included)
  const allLinks = [];
  if (relatedCategory) {
    allLinks.push({ slug: relatedCategory.slug, label: relatedCategory.name });
  }
  for (const tl of tagLinks) {
    if (!allLinks.find((l) => l.slug === tl.slug)) {
      allLinks.push(tl);
      if (allLinks.length === 5) break;
    }
  }

  if (allLinks.length === 0) return null;

  return (
    <aside className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-10">
      <h2 className="flex items-center gap-2 font-black text-gray-800 text-lg mb-4">
        <Layers className="h-5 w-5 text-purple-500" />
        Explore Related Coloring Categories
      </h2>
      <div className="flex flex-wrap gap-3">
        {allLinks.map(({ slug, label }) => (
          <Link
            key={slug}
            href={`/category/${slug}`}
            className="inline-flex items-center gap-1.5 bg-white border-2 border-purple-200 hover:border-purple-400 text-purple-700 font-black text-sm px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            🎨 {label} Coloring Pages
          </Link>
        ))}
      </div>
    </aside>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }) {
  const { brand: brandKey, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const allPosts   = await getAllPublishedPosts();
  const currentIdx = allPosts.findIndex((p) => p.slug === slug);
  const prevPost   = currentIdx < allPosts.length - 1 ? allPosts[currentIdx + 1] : null;
  const nextPost   = currentIdx > 0                   ? allPosts[currentIdx - 1] : null;

  const brand = getBrandByKey(brandKey);
  const baseUrl = getSiteUrl(brand);

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline:      post.title,
    description:   post.description,
    image:         post.coverImage ? (post.coverImage.startsWith('http') ? post.coverImage : `${baseUrl}${post.coverImage}`) : brand.logo,
    datePublished: post.publishedAt,
    dateModified:  post.updatedAt || post.publishedAt,
    url:           `${baseUrl}/blog/${post.slug}`,
    author: {
      '@type': 'Organization',
      name:    brand.name,
      url:     baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name:    brand.name,
      logo: {
        '@type': 'ImageObject',
        url:     brand.logo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id':   `${baseUrl}/blog/${post.slug}`,
    },
    keywords: (post.tags || []).join(', '),
  };

  const faqSchema = post.faqs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
        <div className="container mx-auto px-4 py-10 max-w-3xl">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8 flex-wrap font-medium">
            <Link href="/" className="hover:text-purple-600 transition-colors font-bold">Home</Link>
            <span>›</span>
            <Link href="/blog" className="hover:text-purple-600 transition-colors font-bold">Blog</Link>
            <span>›</span>
            <span className="text-gray-800 font-bold line-clamp-1">{post.title}</span>
          </nav>

          {/* Hero */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-10 text-center mb-8 shadow-2xl">
            {post.coverImage ? (
              <img src={post.coverImage} alt={post.title} className="w-24 h-24 object-cover rounded-2xl mx-auto mb-4 shadow-lg" />
            ) : (
              <div className="text-6xl mb-4">{post.coverEmoji}</div>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{post.title}</h1>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-600">
            <div className="flex items-center gap-1 font-medium">
              <Calendar className="h-4 w-4" />
              Published {formatDate(post.publishedAt)}
            </div>
            {post.updatedAt && post.updatedAt !== post.publishedAt && (
              <div className="flex items-center gap-1 font-medium">
                <Clock className="h-4 w-4" />
                Updated {formatDate(post.updatedAt)}
              </div>
            )}
            <div className="flex items-center gap-1 font-medium">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </div>
          </div>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {post.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                  <Tag className="h-3 w-3" />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Intro description */}
          <p className="text-xl text-gray-700 leading-relaxed mb-10 font-medium border-l-4 border-purple-400 pl-5">
            {post.description}
          </p>

          {/* Related category CTA */}
          {post.relatedCategory && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="font-black text-gray-800 text-lg mb-1">Browse Free {post.relatedCategory.name} Coloring Pages</p>
                <p className="text-gray-600 text-sm">Download and print high-quality PDFs instantly — no account needed.</p>
              </div>
              <Link
                href={`/category/${post.relatedCategory.slug}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
              >
                Browse Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Article body — raw HTML or structured sections */}
          {post.htmlContent ? (
            <article
              className="bg-white rounded-3xl p-8 md:p-12 shadow-xl mb-10 prose prose-purple max-w-none"
              dangerouslySetInnerHTML={{ __html: post.htmlContent }}
            />
          ) : post.sections?.length > 0 && (
            <article className="bg-white rounded-3xl p-8 md:p-12 shadow-xl mb-10">
              {post.sections.map((section, i) => (
                <SectionBlock key={i} section={section} />
              ))}
            </article>
          )}

          {/* Topical cluster — internal links to related category pages */}
          <TopicalClusterBox tags={post.tags} relatedCategory={post.relatedCategory} />

          {/* FAQs */}
          {post.faqs?.length > 0 && <FAQBlock faqs={post.faqs} />}

          {/* Closing CTA */}
          {post.relatedCategory && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 text-center text-white shadow-2xl mb-10">
              <h2 className="text-2xl font-black mb-3">Ready to Download {post.relatedCategory.name} Coloring Pages?</h2>
              <p className="opacity-90 mb-6 font-medium">All pages are 100% free. Print as many times as you like.</p>
              <Link
                href={`/category/${post.relatedCategory.slug}`}
                className="inline-flex items-center gap-2 bg-white text-purple-700 font-black px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-all"
              >
                See All {post.relatedCategory.name} Pages <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          )}

          {/* Post navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {prevPost && (
              <Link href={`/blog/${prevPost.slug}`}>
                <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-purple-300 flex items-center gap-3">
                  <ArrowLeft className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">Previous</p>
                    <p className="font-black text-gray-800 text-sm line-clamp-2">{prevPost.title}</p>
                  </div>
                </div>
              </Link>
            )}
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}`} className="sm:col-start-2">
                <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-purple-300 flex items-center justify-end gap-3 text-right">
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">Next</p>
                    <p className="font-black text-gray-800 text-sm line-clamp-2">{nextPost.title}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-purple-500 flex-shrink-0" />
                </div>
              </Link>
            )}
          </div>

          {/* Back to blog */}
          <div className="text-center">
            <Link href="/blog" className="inline-flex items-center gap-2 bg-white text-gray-700 font-black px-8 py-4 rounded-full shadow-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all">
              <ArrowLeft className="h-5 w-5" />
              Back to All Guides
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
