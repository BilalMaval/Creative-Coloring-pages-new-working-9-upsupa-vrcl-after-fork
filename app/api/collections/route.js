import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabase, admin } from '@/lib/supabaseClients';
import { requireAdmin } from '@/lib/adminAuth';

// GET all collections (top-level categories where parent_id is null)
export async function GET() {
  try {
    const { data: collections, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image, is_active, created_at, updated_at, order')
      .is('parent_id', null)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch collections' }, { status: 500 });
    }

    // Count children per collection
    const { data: allChildren } = await supabase
      .from('categories')
      .select('parent_id')
      .not('parent_id', 'is', null);

    const childCountMap = {};
    (allChildren || []).forEach(c => {
      if (c.parent_id) {
        childCountMap[c.parent_id] = (childCountMap[c.parent_id] || 0) + 1;
      }
    });

    const mapped = (collections || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      isActive: c.is_active,
      order: c.order,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      _count: {
        children: childCountMap[c.id] || 0,
      },
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch collections' }, { status: 500 });
  }
}

// POST create new collection
export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { name, slug, description, image, order } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug exists
    const { data: existing } = await admin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Collection with this slug already exists' }, { status: 400 });
    }

    const { data: newCollection, error } = await admin
      .from('categories')
      .insert({
        id: randomUUID(),
        name,
        slug,
        description: description || '',
        image: image || null,
        parent_id: null,
        order: order || 0,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      return NextResponse.json({ success: false, error: 'Failed to create collection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newCollection });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ success: false, error: 'Failed to create collection' }, { status: 500 });
  }
}

// PUT update collection
export async function PUT(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { id, name, slug, description, image, order } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Collection ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (order !== undefined) updateData.order = order;

    const { data: updatedCollection, error } = await admin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection:', error);
      return NextResponse.json({ success: false, error: 'Failed to update collection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Collection updated successfully', data: updatedCollection });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ success: false, error: 'Failed to update collection' }, { status: 500 });
  }
}

// DELETE collection (and optionally its children)
export async function DELETE(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Collection ID is required' }, { status: 400 });
    }

    // Get all child category IDs
    const { data: childCategories } = await admin
      .from('categories')
      .select('id')
      .eq('parent_id', id);

    const childIds = (childCategories || []).map(c => c.id);

    // Count total products in child categories
    let totalProducts = 0;
    if (childIds.length > 0) {
      const { count } = await admin
        .from('products')
        .select('id', { count: 'exact', head: true })
        .in('category_id', childIds)
        .eq('is_active', true);
      totalProducts = count || 0;
    }

    if (totalProducts > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete collection with ${totalProducts} products. Please move or delete the products first.` },
        { status: 400 }
      );
    }

    // Delete all child categories first
    if (childIds.length > 0) {
      await admin.from('categories').delete().in('id', childIds);
    }

    // Delete the collection itself
    const { error } = await admin.from('categories').delete().eq('id', id);

    if (error) {
      console.error('Error deleting collection:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete collection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete collection' }, { status: 500 });
  }
}
