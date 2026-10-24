import { notFound } from 'next/navigation';
import { getBundleBySlug, getActiveBundles, jsonLd } from '@/lib/bundles';
import BundlePageClient from './BundlePageClient';
import { generateMetadata as genMeta, generateBreadcrumbSchema } from '@/lib/seo';
import { getBrandByKey, getSiteUrl } from '@/config/brands';

import { bundleStaticParams } from '@/lib/staticParams';
export const revalidate = 86400; // 24h; admin edits refresh the affected pages immediately (lib/revalidate.js)

// Pages are built on first request, then cached (ISR), like product pages
export async function generateStaticParams() {
  return bundleStaticParams();
}

export async function generateMetadata({ params }) {
  const { brand: brandKey, slug } = await params;
  const brand = getBrandByKey(brandKey);
  const bundle = await getBundleBySlug(slug);
  if (!bundle) return {};

  const saving = bundle.percentOff > 0 ? ` Save ${bundle.percentOff}%.` : '';
  return genMeta({
    brand,
    title: `${bundle.title} - Printable Bundle (${bundle.items.length} items)`,
    description: bundle.description
      ? bundle.description.slice(0, 155)
      : `${bundle.title}: ${bundle.items.length} printables in one bundle for $${bundle.price.toFixed(2)}.${saving} Instant download from ${brand.name}.`,
    path: `/bundle/${slug}`,
    image: bundle.cover || brand.logo,
    keywords: [bundle.title.toLowerCase(), 'printable bundle', ...bundle.tags].join(', '),
    type: 'product',
  });
}

export default async function BundlePage({ params }) {
  const { brand: brandKey, slug } = await params;
  const brand = getBrandByKey(brandKey);
  const baseUrl = getSiteUrl(brand);
  const bundle = await getBundleBySlug(slug);
  if (!bundle) notFound();

  let others = [];
  try {
    others = (await getActiveBundles({ limit: 8 })).filter((b) => b.id !== bundle.id).slice(0, 4);
  } catch {}

  const breadcrumb = await generateBreadcrumbSchema(
    [{ name: 'Home', url: '/' }, { name: 'Bundles', url: '/bundles' }, { name: bundle.title, url: `/bundle/${bundle.slug}` }],
    baseUrl
  );
  const abs = (u) => (u ? (u.startsWith('http') ? u : `${baseUrl}${u}`) : undefined);
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: bundle.title,
    description: bundle.description || `${bundle.title} - a bundle of ${bundle.items.length} printables`,
    image: abs(bundle.cover) || brand.logo,
    url: `${baseUrl}/bundle/${bundle.slug}`,
    brand: { '@type': 'Brand', name: brand.name },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/bundle/${bundle.slug}`,
      price: bundle.price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: brand.name },
      priceSpecification: bundle.savings > 0 ? {
        '@type': 'UnitPriceSpecification',
        price: bundle.regularTotal.toFixed(2),
        priceCurrency: 'USD',
        priceType: 'https://schema.org/StrikethroughPrice',
      } : undefined,
    },
    isRelatedTo: bundle.items.map((i) => ({ '@type': 'Product', name: i.title, url: `${baseUrl}/product/${i.slug}` })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }} />
      <BundlePageClient bundle={bundle} others={others} />
    </>
  );
}
