import { notFound } from 'next/navigation';

// Catch-all so unknown URLs render the branded 404 inside the brand layout.
export default function CatchAll() {
  notFound();
}
