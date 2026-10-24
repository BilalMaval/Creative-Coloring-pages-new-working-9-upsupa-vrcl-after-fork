// Shopper-only page: keep it out of search results
export const metadata = {
  title: 'Your Cart',
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }) {
  return children;
}
