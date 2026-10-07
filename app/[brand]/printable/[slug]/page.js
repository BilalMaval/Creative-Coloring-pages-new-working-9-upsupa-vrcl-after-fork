import { redirect } from 'next/navigation';

// Redirect old /printable/[slug] to new /product/[slug]
export default function PrintableRedirect({ params }) {
  const { slug } = params;
  redirect(`/product/${slug}`);
}
