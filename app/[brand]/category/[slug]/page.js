import CategoryContent, { buildCategoryMetadata } from './CategoryContent';
import { getBrandByKey } from '@/config/brands';

import { categoryStaticParams } from '@/lib/staticParams';
export const revalidate = 86400; // 24h; admin edits refresh the affected pages immediately (lib/revalidate.js)

// Most visited pages are built at deploy time; the rest on first request, then cached (see lib/staticParams.js).
export async function generateStaticParams() {
  return categoryStaticParams();
}

export async function generateMetadata({ params }) {
  const { brand: brandKey, slug } = await params;
  return buildCategoryMetadata(getBrandByKey(brandKey), slug, 1);
}

export default async function CategoryPage({ params }) {
  const { brand: brandKey, slug } = await params;
  return <CategoryContent brand={getBrandByKey(brandKey)} slug={slug} page={1} />;
}
