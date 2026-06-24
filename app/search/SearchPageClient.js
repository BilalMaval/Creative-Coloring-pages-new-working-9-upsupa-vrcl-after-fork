'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import PrintableCard from '@/components/PrintableCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [printables, setPrintables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchPrintables = async () => {
      setLoading(true);
      try {
        let url = '';
        if (query) {
          url = `/api/search?q=${encodeURIComponent(query)}&page=${page}`;
          if (selectedCategory) {
            url += `&category=${selectedCategory}`;
          }
        } else {
          url = `/api/printables?page=${page}`;
          if (selectedCategory) {
            url += `&category=${selectedCategory}`;
          }
        }

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setPrintables(data.data);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Error fetching printables:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrintables();
  }, [query, selectedCategory, page]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {query ? `Search Results for "${query}"` : 'Browse All Coloring Pages'}
        </h1>
        <SearchBar initialQuery={query} />
      </div>

      {categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('')}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : printables.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {pagination?.total || 0} results found
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {printables.map((printable) => (
              <PrintableCard key={printable.id} printable={printable} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {query
              ? 'No results found. Try a different search term.'
              : 'No printables available yet.'}
          </p>
        </div>
      )}

      {!query && categories.length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
