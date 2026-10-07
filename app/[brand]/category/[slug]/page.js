import CategoryContent, { buildCategoryMetadata } from './CategoryContent';
import { getBrandByKey } from '@/config/brands';

export const revalidate = 120;

// Empty list: pages are built on first request, then cached and revalidated (ISR).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { brand: brandKey, slug } = await params;
  return buildCategoryMetadata(getBrandByKey(brandKey), slug, 1);
}

export default async function CategoryPage({ params }) {
  const { brand: brandKey, slug } = await params;
  return <CategoryContent brand={getBrandByKey(brandKey)} slug={slug} page={1} />;
}
