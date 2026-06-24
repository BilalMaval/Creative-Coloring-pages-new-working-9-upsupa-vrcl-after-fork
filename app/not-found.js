import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export const metadata = {
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-bold mt-4 mb-2">Page Not Found</h2>
          <p className="text-lg text-muted-foreground">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/search">
            <Button size="lg" variant="outline">
              <Search className="h-5 w-5 mr-2" />
              Browse Printables
            </Button>
          </Link>
        </div>
        
        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Looking for coloring pages?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explore our collection of free printable coloring pages and mandalas.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/search">
              <Button variant="link" size="sm">All Printables</Button>
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/about">
              <Button variant="link" size="sm">About Us</Button>
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/contact">
              <Button variant="link" size="sm">Contact</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}