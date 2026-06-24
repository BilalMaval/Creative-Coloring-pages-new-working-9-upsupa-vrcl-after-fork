'use client';

import { BookOpen, Globe, Ruler } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function BookParameters({ product }) {
  const { printLength, language, dimensions } = product;
  
  // Check if any book parameters exist
  if (!printLength && !language && !dimensions) return null;
  
  return (
    <Card className="shadow-xl border-2 border-purple-200">
      <CardContent className="p-6">
        <h3 className="font-black text-xl mb-4 text-gray-800 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          Book Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {printLength && (
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <BookOpen className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-bold">Print Length</p>
              <p className="font-black text-gray-800">{printLength}</p>
            </div>
          )}
          {language && (
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Globe className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-bold">Language</p>
              <p className="font-black text-gray-800">{language}</p>
            </div>
          )}
          {dimensions && (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <Ruler className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-bold">Dimensions</p>
              <p className="font-black text-gray-800">{dimensions}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
