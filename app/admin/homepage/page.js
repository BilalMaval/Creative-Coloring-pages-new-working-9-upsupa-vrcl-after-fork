'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import EmojiPicker from '@/components/admin/EmojiPicker';
import { Home, GripVertical, Save, Settings, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminHomepagePage() {
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [categoryLimit, setCategoryLimit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch collections
      const collRes = await fetch('/api/collections');
      const collData = await collRes.json();
      if (collData.success) {
        setCollections(collData.data);
        if (collData.data.length > 0) {
          setSelectedCollection(collData.data[0].id);
        }
      }

      // Fetch all categories
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.data);
      }

      // Fetch settings
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data.homepage_category_limit) {
        setCategoryLimit(parseInt(settingsData.data.homepage_category_limit) || 12);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories
    .filter(cat => cat.parentId === selectedCollection)
    .sort((a, b) => (a.homepageOrder || 0) - (b.homepageOrder || 0));

  const handleToggleHomepage = async (categoryId, currentValue) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryId,
          showOnHomepage: !currentValue
        })
      });
      
      if (res.ok) {
        setCategories(prev => prev.map(cat => 
          cat.id === categoryId ? { ...cat, showOnHomepage: !currentValue } : cat
        ));
      }
    } catch (error) {
      console.error('Error toggling homepage visibility:', error);
    }
  };

  const handleDragStart = (e, category) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetCategory.id) return;

    const draggedIndex = filteredCategories.findIndex(c => c.id === draggedItem.id);
    const targetIndex = filteredCategories.findIndex(c => c.id === targetCategory.id);

    // Reorder categories
    const newCategories = [...filteredCategories];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedItem);

    // Update homepage orders
    const updates = newCategories.map((cat, index) => ({
      id: cat.id,
      homepageOrder: index + 1
    }));

    // Update local state immediately
    setCategories(prev => {
      const updated = [...prev];
      updates.forEach(update => {
        const idx = updated.findIndex(c => c.id === update.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], homepageOrder: update.homepageOrder };
        }
      });
      return updated;
    });

    // Save to server
    try {
      for (const update of updates) {
        await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
      }
    } catch (error) {
      console.error('Error saving order:', error);
    }

    setDraggedItem(null);
  };

  const handleSaveLimit = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'homepage_category_limit',
          value: String(categoryLimit)
        })
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmoji = async (categoryId, emoji) => {
    try {
      await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: categoryId, emoji })
      });
      
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? { ...cat, emoji } : cat
      ));
    } catch (error) {
      console.error('Error updating emoji:', error);
    }
  };

  const visibleCount = filteredCategories.filter(c => c.showOnHomepage).length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Home className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold">Homepage Management</h1>
            <p className="text-muted-foreground">Manage which categories appear on homepage and their order</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {/* Settings Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Homepage Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="w-48">
                  <Label htmlFor="limit">Categories per Collection</Label>
                  <Input
                    id="limit"
                    type="number"
                    min="1"
                    max="24"
                    value={categoryLimit}
                    onChange={(e) => setCategoryLimit(parseInt(e.target.value) || 12)}
                  />
                </div>
                <Button onClick={handleSaveLimit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Maximum number of categories to display per collection on the homepage
              </p>
            </CardContent>
          </Card>

          {/* Collection Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Collection</CardTitle>
              <CardDescription>Choose a collection to manage its homepage categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Categories Management */}
          <Card>
            <CardHeader>
              <CardTitle>
                Categories for {collections.find(c => c.id === selectedCollection)?.name || 'Selected Collection'}
              </CardTitle>
              <CardDescription>
                Drag and drop to reorder. Toggle visibility to show/hide on homepage.
                <br />
                <span className="font-semibold text-purple-600">
                  {visibleCount} of {filteredCategories.length} categories visible on homepage
                  {visibleCount > categoryLimit && ` (only first ${categoryLimit} will be shown)`}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredCategories.map((category, index) => (
                  <div
                    key={category.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, category)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, category)}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      category.showOnHomepage 
                        ? 'bg-purple-50 border-purple-300' 
                        : 'bg-gray-50 border-gray-200'
                    } ${draggedItem?.id === category.id ? 'opacity-50' : ''} ${
                      category.showOnHomepage && index < categoryLimit ? 'ring-2 ring-green-400' : ''
                    }`}
                  >
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                    
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl">
                      {category.iconImage ? (
                        <img src={category.iconImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        category.emoji || '🎨'
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Position: {index + 1} | Products: {category._count?.products || 0}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <EmojiPicker
                        value={category.emoji || '🎨'}
                        onChange={(emoji) => handleUpdateEmoji(category.id, emoji)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${category.id}`} className="text-sm">
                        {category.showOnHomepage ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Eye className="h-4 w-4" /> Visible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <EyeOff className="h-4 w-4" /> Hidden
                          </span>
                        )}
                      </Label>
                      <Switch
                        id={`toggle-${category.id}`}
                        checked={category.showOnHomepage}
                        onCheckedChange={() => handleToggleHomepage(category.id, category.showOnHomepage)}
                      />
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No categories found for this collection
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
