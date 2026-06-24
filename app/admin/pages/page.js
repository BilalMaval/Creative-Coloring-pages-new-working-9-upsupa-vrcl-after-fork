'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save } from 'lucide-react';

export default function AdminPagesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState({
    about: { slug: 'about', title: 'About Us', body: '' },
    'privacy-policy': { slug: 'privacy-policy', title: 'Privacy Policy', body: '' },
    'terms-of-service': { slug: 'terms-of-service', title: 'Terms of Service', body: '' }
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      
      if (data.success && data.data) {
        const pagesMap = {};
        data.data.forEach(page => {
          pagesMap[page.slug] = page;
        });
        
        setPages(prev => ({
          ...prev,
          ...pagesMap
        }));
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (slug) => {
    setSaving(true);
    try {
      const page = pages[slug];
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page)
      });

      const data = await res.json();
      if (data.success) {
        alert('Page saved successfully!');
      } else {
        alert(data.error || 'Failed to save page');
      }
    } catch (error) {
      alert('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (slug, field, value) => {
    setPages(prev => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Edit Pages</h1>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="privacy-policy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="terms-of-service">Terms of Service</TabsTrigger>
        </TabsList>

        {Object.entries(pages).map(([slug, page]) => (
          <TabsContent key={slug} value={slug}>
            <Card>
              <CardHeader>
                <CardTitle>Edit {page.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`${slug}-title`}>Page Title</Label>
                  <Input
                    id={`${slug}-title`}
                    value={page.title}
                    onChange={(e) => handleChange(slug, 'title', e.target.value)}
                    placeholder="Page title"
                  />
                </div>

                <div>
                  <Label htmlFor={`${slug}-body`}>Page Content</Label>
                  <Textarea
                    id={`${slug}-body`}
                    value={page.body}
                    onChange={(e) => handleChange(slug, 'body', e.target.value)}
                    placeholder="Enter HTML or plain text content..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    You can use HTML tags for formatting. The content will be displayed as-is on the page.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleSave(slug)} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>

                {page.body && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Preview:</h3>
                    <div className="border rounded-lg p-4 bg-muted/50 prose prose-sm dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: page.body }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Use HTML tags for rich formatting (e.g., &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;)</p>
          <p>• Keep content clear and concise for better user experience</p>
          <p>• Include relevant keywords for SEO optimization</p>
          <p>• Preview your changes before saving</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}