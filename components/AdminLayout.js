'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, FolderOpen, FileText, Settings, Library, Package, Home, BookOpen, Tag, Users } from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
                A
              </div>
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/" target="_blank">
                <Button variant="outline" size="sm">View Site</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="space-y-2">
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/homepage">
                <Button variant="ghost" className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                  <Home className="h-4 w-4 mr-2" />
                  Homepage Manager
                </Button>
              </Link>
              <Link href="/admin/collections">
                <Button variant="ghost" className="w-full justify-start">
                  <Library className="h-4 w-4 mr-2" />
                  Collections
                </Button>
              </Link>
              <Link href="/admin/categories">
                <Button variant="ghost" className="w-full justify-start">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Categories
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Products
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Orders
                </Button>
              </Link>
              <Link href="/admin/coupons">
                <Button variant="ghost" className="w-full justify-start">
                  <Tag className="h-4 w-4 mr-2" />
                  Coupons
                </Button>
              </Link>
              <Link href="/admin/team">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </Button>
              </Link>
              <Link href="/admin/blog">
                <Button variant="ghost" className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Blog Posts
                </Button>
              </Link>
              <Link href="/admin/pages">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Pages
                </Button>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
