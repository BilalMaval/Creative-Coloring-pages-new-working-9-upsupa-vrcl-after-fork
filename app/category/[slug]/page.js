import CategoryContent, { buildCategoryMetadata } from './CategoryContent';

export const revalidate = 120;

// Empty list: pages are built on first request, then cached and revalidated (ISR).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildCategoryMetadata(slug, 1);
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  return <CategoryContent slug={slug} page={1} />;
}
