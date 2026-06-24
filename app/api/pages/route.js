import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (slug) {
      const page = await prisma.page.findUnique({
        where: { slug }
      });
      return NextResponse.json({
        success: true,
        data: page
      });
    }
    
    const allPages = await prisma.page.findMany();
    return NextResponse.json({
      success: true,
      data: allPages
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { slug, title, body: content } = body;
    
    if (!slug || !title) {
      return NextResponse.json(
        { success: false, error: 'Slug and title are required' },
        { status: 400 }
      );
    }
    
    const existing = await prisma.page.findUnique({
      where: { slug }
    });
    
    if (existing) {
      // Update
      await prisma.page.update({
        where: { slug },
        data: { title, body: content || '' }
      });
    } else {
      // Create
      await prisma.page.create({
        data: {
          slug,
          title,
          body: content || ''
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Page saved successfully'
    });
  } catch (error) {
    console.error('Error saving page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save page' },
      { status: 500 }
    );
  }
}
