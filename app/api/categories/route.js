import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabase, admin } from '@/lib/supabaseClients';
import { requireAdmin } from '@/lib/adminAuth';
import { revalidateCategoryById, revalidateStructure } from '@/lib/revalidate';

export async function GET() {
  try {
    // Fetch all categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image, icon_image, emoji, parent_id, show_on_homepage, homepage_order, is_active, created_at, updated_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Build a map for parent lookup and children count
    const categoryMap = Object.fromEntries((categories || []).map(c => [c.id, c]));

    // Count products per category
    const { data: productCounts } = await supabase
      .from('products')
      .select('category_id')
      .eq('is_active', true);

    const countMap = {};
    (productCounts || []).forEach(p => {
      countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    });

    // Count children per category
    const childCountMap = {};
    (categories || []).forEach(c => {
      if (c.parent_id) {
        childCountMap[c.parent_id] = (childCountMap[c.parent_id] || 0) + 1;
      }
    });

    const mapped = (categories || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      iconImage: c.icon_image,
      emoji: c.emoji,
      parentId: c.parent_id,
      showOnHomepage: c.show_on_homepage,
      homepageOrder: c.homepage_order,
      isActive: c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      parent: c.parent_id ? (categoryMap[c.parent_id] ? {
        id: categoryMap[c.parent_id].id,
        name: categoryMap[c.parent_id].name,
        slug: categoryMap[c.parent_id].slug,
      } : null) : null,
      children: (categories || [])
        .filter(child => child.parent_id === c.id)
        .map(child => ({ id: child.id, name: child.name, slug: child.slug })),
      _count: {
        products: countMap[c.id] || 0,
        children: childCountMap[c.id] || 0,
      },
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { name, slug, description, image, iconImage, emoji, parentId, showOnHomepage, homepageOrder } = body;

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
      return NextResponse.json({ success: false, error: 'Category with this slug already exists' }, { status: 400 });
    }

    const { data: newCategory, error } = await admin
      .from('categories')
      .insert({
        id: randomUUID(),
        name,
        slug,
        description: description || '',
        image: image || null,
        icon_image: iconImage || null,
        emoji: emoji || '🎨',
        parent_id: parentId || null,
        show_on_homepage: showOnHomepage || false,
        homepage_order: homepageOrder || 0,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
    }

    await revalidateCategoryById(newCategory.id);
    await revalidateStructure();
    return NextResponse.json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { id, name, slug, description, image, iconImage, emoji, parentId, showOnHomepage, homepageOrder } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (iconImage !== undefined) updateData.icon_image = iconImage;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (parentId !== undefined) updateData.parent_id = parentId;
    if (showOnHomepage !== undefined) updateData.show_on_homepage = showOnHomepage;
    if (homepageOrder !== undefined) updateData.homepage_order = homepageOrder;

    const { data: updatedCategory, error } = await admin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
    }

    // Renames / moves change names and breadcrumbs on many pages; other edits (homepage toggle, image) only touch this category
    await revalidateCategoryById(updatedCategory.id);
    await revalidateStructure({ broad: name !== undefined || slug !== undefined || parentId !== undefined });
    return NextResponse.json({ success: true, message: 'Category updated successfully', data: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category has products
    const { count: productsCount } = await admin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_active', true);

    if (productsCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category with ${productsCount} products. Please move or delete the products first.` },
        { status: 400 }
      );
    }

    const { data: before } = await admin.from('categories').select('slug, parent:parent_id(slug)').eq('id', id).single();

    const { error } = await admin.from('categories').delete().eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
    }

    await revalidateStructure({ slug: before?.slug, parentSlug: before?.parent?.slug, broad: true });
    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
  }
}
