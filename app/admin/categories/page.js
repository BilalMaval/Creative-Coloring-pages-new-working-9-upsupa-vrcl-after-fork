'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, FolderOpen, Search } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [filterCollection, setFilterCollection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    iconImage: '',
    emoji: '🎨',
    parentId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, collectionsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/collections')
      ]);
      
      const categoriesData = await categoriesRes.json();
      const collectionsData = await collectionsRes.json();
      
      if (categoriesData.success) {
        // Filter to show only child categories (not main collections)
        const childCategories = categoriesData.data.filter(cat => cat.parentId !== null);
        setCategories(childCategories);
      }
      if (collectionsData.success) {
        setCollections(collectionsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'image');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.url }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'image');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, iconImage: data.url }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.parentId) {
      alert('Please select a collection');
      return;
    }
    
    try {
      const url = '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory ? { ...formData, id: editingCategory.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', slug: '', description: '', image: '', iconImage: '', emoji: '🎨', parentId: '' });
        fetchData();
      } else {
        alert(data.error || 'Failed to save category');
      }
    } catch (error) {
      alert('Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      iconImage: category.iconImage || '',
      emoji: category.emoji || '🎨',
      parentId: category.parentId || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  const openNewDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', image: '', iconImage: '', emoji: '🎨', parentId: collections[0]?.id || '' });
    setDialogOpen(true);
  };

  const filteredCategories = categories.filter(cat => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        cat.name?.toLowerCase().includes(query) ||
        cat.slug?.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Collection filter
    if (filterCollection !== 'all' && cat.parentId !== filterCollection) return false;
    return true;
  });

  const getCollectionName = (parentId) => {
    const collection = collections.find(c => c.id === parentId);
    return collection?.name || 'Unknown';
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} disabled={collections.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Update category information' : 'Create a new category inside a collection'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="collection">Collection *</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="e.g. Animals, Mandalas, Nature"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="auto-generated-from-name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image">Category Image (Cover)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {formData.image && (
                  <div className="mt-2">
                    <img src={formData.image} alt="Preview" className="h-20 w-auto rounded" />
                  </div>
                )}
                {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
              </div>

              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <Label htmlFor="iconImage" className="text-purple-800 font-bold">🎨 Category Icon (Display on homepage)</Label>
                <p className="text-xs text-muted-foreground mb-2">This icon appears on the homepage and collection pages. Recommended: 128x128px square image.</p>
                <Input
                  id="iconImage"
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  disabled={uploadingIcon}
                />
                {formData.iconImage && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={formData.iconImage} alt="Icon Preview" className="h-16 w-16 rounded-lg object-cover border-2 border-purple-400" />
                    <span className="text-green-600 text-sm font-medium">✓ Icon uploaded</span>
                  </div>
                )}
                {uploadingIcon && <p className="text-sm text-muted-foreground mt-2">Uploading icon...</p>}
              </div>

              <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <Label htmlFor="emoji" className="text-yellow-800 font-bold">😀 Emoji Icon (Fallback)</Label>
                <p className="text-xs text-muted-foreground mb-2">This emoji shows if no icon image is uploaded. Click the field and use emoji picker.</p>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="🎨"
                  maxLength={2}
                  className="text-2xl text-center w-20"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 && (
        <Card className="mb-4">
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center">
              Please create at least one collection before adding categories.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filter by Collection */}
      {collections.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Label>Search Categories</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label>Filter by Collection</Label>
            <Select value={filterCollection} onValueChange={setFilterCollection}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                {category.image && (
                  <div className="mb-2 aspect-video relative rounded overflow-hidden bg-muted">
                    <img src={category.image} alt={category.name} className="object-cover w-full h-full" />
                  </div>
                )}
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  {category.name}
                </CardTitle>
                <p className="text-xs text-blue-600 font-medium">
                  Collection: {getCollectionName(category.parentId)}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {category.description || 'No description'}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {category._count?.products || 0} products
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(category.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-20">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No categories yet</p>
            {collections.length > 0 && (
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
