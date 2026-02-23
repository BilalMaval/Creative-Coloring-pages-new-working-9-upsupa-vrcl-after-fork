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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Edit, Trash2, Loader2, Package, Star, X, Image as ImageIcon } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState({ image: false, pdf: false, gallery: false });
  
  // Filter states
  const [filterCollection, setFilterCollection] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Form states - Single collection, multiple categories
  const [selectedCollection, setSelectedCollection] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    tags: '',
    image: '',
    pdfPath: '',
    categoryId: '',
    price: '0',
    pricingType: 'free', // 'free' or 'paid'
    gallery: [],
    printLength: '',
    language: '',
    dimensions: '',
    downloads: '0',
    views: '0'
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update available categories when selected collection changes
    if (selectedCollection) {
      const cats = allCategories.filter(cat => 
        cat.parentId && cat.parentId === selectedCollection
      );
      setAvailableCategories(cats);
    } else {
      setAvailableCategories([]);
    }
  }, [selectedCollection, allCategories]);

  // Check if Bookshop or Printables is selected
  const isBookshopSelected = () => {
    const col = collections.find(c => c.id === selectedCollection);
    return col?.slug === 'bookshop';
  };
  
  const isPrintablesOrBookshopSelected = () => {
    const col = collections.find(c => c.id === selectedCollection);
    return col?.slug === 'bookshop' || col?.slug === 'printables';
  };

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, collectionsRes] = await Promise.all([
        fetch('/api/printables?limit=1000'),
        fetch('/api/categories'),
        fetch('/api/collections')
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      const collectionsData = await collectionsRes.json();

      if (productsData.success) setProducts(productsData.data);
      if (categoriesData.success) setAllCategories(categoriesData.data);
      if (collectionsData.success) setCollections(collectionsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (title) => {
    setFormData({
      ...formData,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    });
  };

  const handleCollectionChange = (collectionId) => {
    setSelectedCollection(collectionId);
    setSelectedCategories([]); // Reset categories when collection changes
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ ...uploading, [type]: true });
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          [type === 'image' ? 'image' : 'pdfPath']: data.url
        }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading({ ...uploading, gallery: true });
    
    const uploadedUrls = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('type', 'image');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });

        const data = await res.json();
        if (data.success) {
          uploadedUrls.push(data.url);
        } else {
          console.error(`Failed to upload ${file.name}:`, data.error);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          gallery: [...prev.gallery, ...uploadedUrls]
        }));
      }
      
      if (uploadedUrls.length < files.length) {
        alert(`Uploaded ${uploadedUrls.length} of ${files.length} images`);
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading({ ...uploading, gallery: false });
      e.target.value = '';
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset validation errors
    const errors = {};
    
    // Validate required fields
    if (!selectedCollection) {
      errors.collection = 'Please select a collection';
    }
    
    if (selectedCategories.length === 0) {
      errors.categories = 'Please select at least one category';
    }
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required';
    }
    
    if (!formData.image) {
      errors.image = 'Preview image is required';
    }
    
    if (!formData.pdfPath) {
      errors.pdf = 'Downloadable file (PDF) is required';
    }
    
    if (formData.pricingType === 'paid' && (!formData.price || parseFloat(formData.price) <= 0)) {
      errors.price = 'Please enter a valid price greater than $0';
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Show alert with all errors
      const errorMessages = Object.values(errors).join('\\n');
      alert('Please fix the following errors:\\n\\n' + errorMessages);
      return;
    }
    
    setValidationErrors({});
    
    try {
      const url = '/api/printables';
      const method = editingProduct ? 'PUT' : 'POST';
      const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      
      const mainCategoryId = selectedCategories[0];
      const isFree = formData.pricingType === 'free';
      const price = isFree ? 0 : parseFloat(formData.price) || 0;
      
      const body = {
        ...formData,
        tags,
        categoryId: mainCategoryId,
        price,
        isFree,
        gallery: formData.gallery,
        downloads: parseInt(formData.downloads) || 0,
        views: parseInt(formData.views) || 0,
        printLength: formData.printLength || null,
        language: formData.language || null,
        dimensions: formData.dimensions || null,
        customFields: {
          additionalCategories: selectedCategories.slice(1),
          collection: selectedCollection
        }
      };
      
      if (editingProduct) {
        body.id = editingProduct.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setEditingProduct(null);
        resetForm();
        fetchData();
        alert('Product saved successfully!');
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (error) {
      alert('Failed to save product');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      tags: '',
      image: '',
      pdfPath: '',
      categoryId: '',
      price: '0',
      pricingType: 'free',
      gallery: [],
      printLength: '',
      language: '',
      dimensions: '',
      downloads: '0',
      views: '0'
    });
    setSelectedCollection('');
    setSelectedCategories([]);
    setValidationErrors({});
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    
    const category = allCategories.find(c => c.id === product.categoryId);
    const collectionId = product.customFields?.collection || category?.parentId || '';
    
    const additionalCategories = product.customFields?.additionalCategories || [];
    
    setSelectedCollection(collectionId);
    setSelectedCategories([product.categoryId, ...additionalCategories]);
    
    const isFree = product.isFree !== false;
    
    setFormData({
      title: product.title,
      slug: product.slug,
      description: product.description || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      image: product.webpPath || '',
      pdfPath: product.pdfPath || '',
      categoryId: product.categoryId,
      price: String(product.price || 0),
      pricingType: isFree ? 'free' : 'paid',
      gallery: product.gallery || [],
      printLength: product.printLength || '',
      language: product.language || '',
      dimensions: product.dimensions || '',
      downloads: String(product.downloads || 0),
      views: String(product.views || 0)
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/printables?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const openNewDialog = () => {
    setEditingProduct(null);
    resetForm();
    setDialogOpen(true);
  };

  // Filter products
  const childCategories = allCategories.filter(cat => cat.parentId !== null);
  const filterCategories = filterCollection === 'all' 
    ? childCategories 
    : childCategories.filter(cat => cat.parentId === filterCollection);
  
  const filteredProducts = products.filter(product => {
    if (filterCollection !== 'all') {
      const category = allCategories.find(c => c.id === product.categoryId);
      if (!category || category.parentId !== filterCollection) return false;
    }
    if (filterCategory !== 'all' && product.categoryId !== filterCategory) return false;
    return true;
  });

  const getCategoryName = (categoryId) => {
    const category = allCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCollectionName = (categoryId) => {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return 'Unknown';
    const collection = collections.find(c => c.id === category.parentId);
    return collection?.name || 'Unknown';
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} disabled={collections.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Create a new product'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Single Collection Selection */}
              <div>
                <Label>Select Collection *</Label>
                <Select value={selectedCollection} onValueChange={handleCollectionChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a collection" />
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

              {/* Multiple Categories Selection */}
              {selectedCollection && (
                <div>
                  <Label>Select Categories * (can select multiple)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md bg-muted/50 max-h-48 overflow-y-auto">
                    {availableCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {availableCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">No categories in selected collection</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="e.g. Beautiful Butterfly Mandala"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this product"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="mandala, butterfly, nature"
                />
              </div>

              {/* Pricing - Radio buttons for Free or Paid */}
              <div className="border rounded-lg p-4">
                <Label className="mb-3 block">Pricing *</Label>
                <RadioGroup
                  value={formData.pricingType}
                  onValueChange={(value) => setFormData({ ...formData, pricingType: value, price: value === 'free' ? '0' : formData.price })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="pricing-free" />
                    <Label htmlFor="pricing-free" className="cursor-pointer font-normal">Free Download</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="pricing-paid" />
                    <Label htmlFor="pricing-paid" className="cursor-pointer font-normal">Paid</Label>
                  </div>
                </RadioGroup>
                
                {formData.pricingType === 'paid' && (
                  <div className="mt-3">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="9.99"
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              {/* Book Parameters - Only for Bookshop */}
              {isBookshopSelected() && (
                <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <Label className="text-purple-800 font-bold mb-3 block">📚 Book Parameters</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="printLength">Print Length</Label>
                      <Input
                        id="printLength"
                        value={formData.printLength}
                        onChange={(e) => setFormData({ ...formData, printLength: e.target.value })}
                        placeholder="e.g. 150 pages"
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Input
                        id="language"
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        placeholder="e.g. English"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                        placeholder="e.g. 8.5 x 11 in"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="image" className="flex items-center gap-2">
                  Preview Image *
                  {validationErrors.image && <span className="text-red-500 text-xs">({validationErrors.image})</span>}
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  disabled={uploading.image}
                  className={validationErrors.image ? 'border-red-500' : ''}
                />
                {validationErrors.image && (
                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>📐 Recommended Dimensions:</strong> 600 x 800 pixels (3:4 aspect ratio)<br/>
                    <strong>Accepted formats:</strong> JPG, PNG, WebP • <strong>Max size:</strong> 5MB
                  </div>
                )}
                {formData.image && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={formData.image} alt="Preview" className="h-32 w-auto rounded border" />
                    <span className="text-green-600 text-sm font-medium">✓ Image uploaded</span>
                  </div>
                )}
                {uploading.image && <p className="text-sm text-muted-foreground mt-2">Uploading image...</p>}
              </div>

              {/* Photo Gallery - For Printables and Bookshop */}
              {isPrintablesOrBookshopSelected() && (
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <Label className="text-blue-800 font-bold mb-3 block">📷 Photo Gallery (Multiple Images)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    disabled={uploading.gallery}
                  />
                  {uploading.gallery && <p className="text-sm text-muted-foreground mt-2">Uploading images...</p>}
                  
                  {formData.gallery.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.gallery.map((img, index) => (
                        <div key={index} className="relative">
                          <img src={img} alt={`Gallery ${index + 1}`} className="h-16 w-16 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Select multiple images at once (hold Ctrl/Cmd to select multiple files)
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="pdf" className="flex items-center gap-2">
                  Downloadable File (PDF/EPUB/ZIP) *
                  {validationErrors.pdf && <span className="text-red-500 text-xs">({validationErrors.pdf})</span>}
                </Label>
                <Input
                  id="pdf"
                  type="file"
                  accept=".pdf,.epub,.zip"
                  onChange={(e) => handleFileUpload(e, 'pdf')}
                  disabled={uploading.pdf}
                  className={validationErrors.pdf ? 'border-red-500' : ''}
                />
                {validationErrors.pdf && (
                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>⚠️ Required:</strong> This is the file customers will download<br/>
                    <strong>Accepted formats:</strong> PDF, EPUB, ZIP • <strong>Max size:</strong> 50MB
                  </div>
                )}
                {formData.pdfPath && (
                  <p className="text-sm text-green-600 mt-2 font-medium">✓ File uploaded and ready for download</p>
                )}
                {uploading.pdf && <p className="text-sm text-blue-600 mt-2">📤 Uploading file...</p>}
              </div>

              {/* Submit Button */}
              <div className="border-t pt-4 mt-4">
                {Object.keys(validationErrors).length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">⚠️ Please fill all required fields marked with *</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading.image || uploading.pdf || uploading.gallery}>
                    {uploading.image || uploading.pdf || uploading.gallery ? 'Uploading...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 && (
        <Card className="mb-4">
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center">
              Please create at least one collection and category before adding products.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {collections.length > 0 && (
        <div className="flex gap-4 mb-6">
          <div>
            <Label>Filter by Collection</Label>
            <Select value={filterCollection} onValueChange={(val) => { setFilterCollection(val); setFilterCategory('all'); }}>
              <SelectTrigger className="w-48">
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
          <div>
            <Label>Filter by Category</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                {product.webpPath && (
                  <div className="mb-2 aspect-[3/4] relative rounded overflow-hidden bg-muted">
                    <img src={product.webpPath} alt={product.title} className="object-cover w-full h-full" />
                  </div>
                )}
                <CardTitle className="line-clamp-1 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {product.title}
                </CardTitle>
                <div className="text-xs space-y-1">
                  <p className="text-blue-600">Collection: {getCollectionName(product.categoryId)}</p>
                  <p className="text-green-600">Category: {getCategoryName(product.categoryId)}</p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  {product.isFree ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">FREE</span>
                  ) : (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">${product.price}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{product.downloads || 0} downloads</span>
                  {product.gallery?.length > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> {product.gallery.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
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
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No products yet</p>
            {collections.length > 0 && childCategories.length > 0 && (
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Product
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
