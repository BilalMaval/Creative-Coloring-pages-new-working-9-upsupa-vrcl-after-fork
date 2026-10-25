import SuccessClient from './SuccessClient';

// Private, per-customer page: kept out of search results (the checkout layout also sets noindex)
export const metadata = {
  title: 'Order confirmation',
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return <SuccessClient />;
}
