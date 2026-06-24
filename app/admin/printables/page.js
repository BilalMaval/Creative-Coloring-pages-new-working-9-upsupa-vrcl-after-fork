import { redirect } from 'next/navigation';

export default function PrintablesRedirect() {
  redirect('/admin/products');
}
