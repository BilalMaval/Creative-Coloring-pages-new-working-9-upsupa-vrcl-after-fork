import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const allCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: allCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, slug, description, image, iconImage, emoji, parentId, showOnHomepage, homepageOrder } = body;
    
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }
    
    // Check if slug exists
    const existing = await prisma.category.findUnique({
      where: { slug }
    });
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }
    
    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || '',
        image: image || null,
        iconImage: iconImage || null,
        emoji: emoji || '🎨',
        parentId: parentId || null,
        showOnHomepage: showOnHomepage || false,
        homepageOrder: homepageOrder || 0,
        isActive: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, slug, description, image, iconImage, emoji, parentId, showOnHomepage, homepageOrder } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (iconImage !== undefined) updateData.iconImage = iconImage;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (showOnHomepage !== undefined) updateData.showOnHomepage = showOnHomepage;
    if (homepageOrder !== undefined) updateData.homepageOrder = homepageOrder;
    
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });
    
    if (productsCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category with ${productsCount} products. Please move or delete the products first.` },
        { status: 400 }
      );
    }
    
    await prisma.category.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
