'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FolderOpen, Download, Library, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    collections: 0,
    categories: 0,
    products: 0,
    downloads: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [collectionsRes, categoriesRes, productsRes] = await Promise.all([
          fetch('/api/collections'),
          fetch('/api/categories'),
          fetch('/api/printables?limit=1000')
        ]);

        const collectionsData = await collectionsRes.json();
        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();

        if (collectionsData.success && categoriesData.success && productsData.success) {
          const totalDownloads = productsData.data.reduce((sum, p) => sum + (p.downloads || 0), 0);
          const childCategories = categoriesData.data.filter(cat => cat.parentId !== null);
          
          setStats({
            collections: collectionsData.data.length,
            categories: childCategories.length,
            products: productsData.data.length,
            downloads: totalDownloads
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.collections}</div>
            <p className="text-xs text-muted-foreground">Super categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.categories}</div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.products}</div>
            <p className="text-xs text-muted-foreground">Available for download</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.downloads}</div>
            <p className="text-xs text-muted-foreground">Lifetime downloads</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => router.push('/admin/collections')}
              className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Manage Collections</div>
              <div className="text-sm text-muted-foreground">Add or edit collections (super categories)</div>
            </button>
            <button
              onClick={() => router.push('/admin/categories')}
              className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Manage Categories</div>
              <div className="text-sm text-muted-foreground">Add or edit categories inside collections</div>
            </button>
            <button
              onClick={() => router.push('/admin/products')}
              className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Manage Products</div>
              <div className="text-sm text-muted-foreground">Upload coloring pages, books, and more</div>
            </button>
            <button
              onClick={() => router.push('/admin/blog')}
              className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted transition-colors border-purple-200 bg-purple-50"
            >
              <div className="font-medium flex items-center gap-2 text-purple-700">
                <BookOpen className="h-4 w-4" /> Manage Blog Posts
              </div>
              <div className="text-sm text-muted-foreground">Create, edit, publish and delete blog articles</div>
            </button>
            <button
              onClick={() => router.push('/admin/pages')}
              className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Edit Pages</div>
              <div className="text-sm text-muted-foreground">Update static page content</div>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Set up your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <div className="font-medium">Create Collections</div>
                <div className="text-sm text-muted-foreground">Create super categories like Coloring Pages, Bookshop</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <div className="font-medium">Add Categories</div>
                <div className="text-sm text-muted-foreground">Organize products by theme within each collection</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <div className="font-medium">Upload Products</div>
                <div className="text-sm text-muted-foreground">Add coloring pages, eBooks, and other products</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div>
                <div className="font-medium">Customize Pages</div>
                <div className="text-sm text-muted-foreground">Edit About, Privacy, and Terms pages</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
