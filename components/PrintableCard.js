'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Download, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function PrintableCard({ printable }) {
  // Get the image from webpPath or thumbnailPath
  const imageUrl = printable.webpPath || printable.thumbnailPath || printable.image;
  
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/product/${printable.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={printable.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">🎨</span>
            </div>
          )}
          {/* Price badge */}
          <div className="absolute top-2 right-2">
            {printable.isFree ? (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">FREE</span>
            ) : (
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">${Number(printable.price).toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/product/${printable.slug}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {printable.title}
          </h3>
        </Link>
        {printable.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {printable.description}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Link href={`/product/${printable.slug}`} className="w-full">
          <Button variant="outline" className="w-full" size="sm">
            {printable.isFree ? (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Free
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                ${Number(printable.price).toFixed(2)} - View
              </>
            )}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
