import { notFound, permanentRedirect } from 'next/navigation';
import CategoryContent, { buildCategoryMetadata } from '../../CategoryContent';
import { getBrandByKey } from '@/config/brands';

export const revalidate = 86400; // 24h; admin edits refresh the affected pages immediately (lib/revalidate.js)

export async function generateStaticParams() {
  return [];
}

function parsePage(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

export async function generateMetadata({ params }) {
  const { brand: brandKey, slug, page } = await params;
  const n = parsePage(page);
  if (!n || n === 1) return {};
  return buildCategoryMetadata(getBrandByKey(brandKey), slug, n);
}

export default async function CategoryPageN({ params }) {
  const { brand: brandKey, slug, page } = await params;
  const n = parsePage(page);
  if (!n) notFound();
  if (n === 1) permanentRedirect(`/category/${slug}`);
  return <CategoryContent brand={getBrandByKey(brandKey)} slug={slug} page={n} />;
}
