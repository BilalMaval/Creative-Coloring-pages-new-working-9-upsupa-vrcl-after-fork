import Link from 'next/link';
import { getActiveBundles, jsonLd } from '@/lib/bundles';
import BundleCard from '@/components/BundleCard';
import { generateMetadata as genMeta, generateBreadcrumbSchema } from '@/lib/seo';
import { getBrandByKey, getSiteUrl } from '@/config/brands';

// ISR: cached for 2 minutes, and refreshed immediately when the admin edits a bundle
export const revalidate = 86400; // 24h; admin edits refresh the affected pages immediately (lib/revalidate.js)

export async function generateMetadata({ params }) {
  const { brand: brandKey } = await params;
  const brand = getBrandByKey(brandKey);
  return genMeta({
    brand,
    title: 'Printable Bundles - Save When You Buy Together',
    description: `Save money with ${brand.name} bundles: hand-picked sets of printables, coloring pages and activities in one download. Bigger savings than buying one by one.`,
    path: '/bundles',
    keywords: `${brand.name} bundles, printable bundles, coloring page bundles, printable pack, discounted printables`,
  });
}

export default async function BundlesPage({ params }) {
  const { brand: brandKey } = await params;
  const brand = getBrandByKey(brandKey);
  const baseUrl = getSiteUrl(brand);
  let bundles = [];
  try {
    bundles = await getActiveBundles();
  } catch (err) {
    // During `next build` a database hiccup must not fail the whole deploy (the page refreshes itself after 2 minutes).
    // At request time the error is rethrown so a failure is never cached as an empty page.
    if (process.env.NEXT_PHASE !== 'phase-production-build') throw err;
    console.error('Bundles list unavailable during build:', err.message);
  }

  const breadcrumb = await generateBreadcrumbSchema(
    [{ name: 'Home', url: '/' }, { name: 'Bundles', url: '/bundles' }],
    baseUrl
  );
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${brand.name} bundles`,
    itemListElement: bundles.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${baseUrl}/bundle/${b.slug}`,
      name: b.title,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
      {bundles.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemList) }} />
      )}

      <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-blue-600 font-bold">Home</Link>
            <span>›</span>
            <span className="text-gray-800 font-bold">Bundles</span>
          </div>

          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl p-8 shadow-2xl mb-10 text-center text-white">
            <h1 className="text-3xl md:text-5xl font-black mb-2">🎁 Printable Bundles</h1>
            <p className="font-bold text-lg md:text-xl opacity-95">Get more for less - hand-picked sets in one download</p>
          </div>

          {bundles.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">New bundles are coming soon</h2>
              <p className="text-gray-600 mb-6">Check back shortly, or browse our printables in the meantime.</p>
              <Link href="/" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-3 rounded-full">
                Browse the shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bundles.map((b, i) => (
                <BundleCard key={b.id} bundle={b} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
