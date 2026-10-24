// Shopper-only page: keep it out of search results
export const metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }) {
  return children;
}
