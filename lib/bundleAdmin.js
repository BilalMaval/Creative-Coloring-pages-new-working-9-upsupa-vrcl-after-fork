// Admin-side bundle logic (server-only): input validation + serialising bundles with their computed totals.
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { bundleTotals, slugify } from '@/lib/bundlePricing';

export const MIN_BUNDLE_PRODUCTS = 2;
export const MAX_BUNDLE_PRODUCTS = 50;
const RESERVED_SLUGS = ['new', 'admin', 'api'];

const str = (v, max) => (v == null ? '' : String(v)).trim().slice(0, max);

// Validates the admin form. Throws Error(message) on bad input. Also checks that every product exists.
export async function parseBundleInput(b) {
  const title = str(b.title, 120);
  if (!title) throw new Error('Title is required');

  let slug = slugify(b.slug || title);
  if (!slug) throw new Error('Slug could not be created from the title');
  if (RESERVED_SLUGS.includes(slug)) slug = `${slug}-bundle`;

  const price = Number(b.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error('Bundle price must be greater than 0');
  if (price > 9999) throw new Error('Bundle price is too high');

  const image = str(b.image, 500);
  if (image && !/^https?:\/\//i.test(image)) throw new Error('Cover image must be an image URL');

  const rawTags = Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',');
  const tags = [...new Set(rawTags.map((t) => str(t, 30).toLowerCase()).filter(Boolean))].slice(0, 15);

  const productIds = [...new Set((Array.isArray(b.productIds) ? b.productIds : []).map((i) => String(i)))];
  if (productIds.length < MIN_BUNDLE_PRODUCTS) throw new Error(`Choose at least ${MIN_BUNDLE_PRODUCTS} products for a bundle`);
  if (productIds.length > MAX_BUNDLE_PRODUCTS) throw new Error(`A bundle can have at most ${MAX_BUNDLE_PRODUCTS} products`);
  const found = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
  if (found.length !== productIds.length) throw new Error('One or more selected products no longer exist');

  return {
    title,
    slug,
    description: str(b.description, 4000) || null,
    price,
    image: image || null,
    tags,
    isActive: b.isActive !== false,
    isFeatured: b.isFeatured === true,
    productIds,
  };
}

export const BUNDLE_INCLUDE = {
  items: {
    orderBy: { order: 'asc' },
    include: {
      product: { select: { id: true, title: true, slug: true, webpPath: true, price: true, isFree: true, customFields: true, isActive: true } },
    },
  },
};

// Plain JSON for the admin UI, with computed regular total / savings
export function serializeBundle(b, sold = 0) {
  const items = b.items.map((i) => ({
    id: i.product.id,
    title: i.product.title,
    slug: i.product.slug,
    webpPath: i.product.webpPath,
    price: Number(i.product.price) || 0,
    salePrice: i.product.customFields?.salePrice ? Number(i.product.customFields.salePrice) : null,
    isFree: i.product.isFree,
    isActive: i.product.isActive,
  }));
  const totals = bundleTotals(items.filter((i) => i.isActive), Number(b.price));
  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    description: b.description,
    price: Number(b.price),
    image: b.image,
    tags: b.tags,
    isActive: b.isActive,
    isFeatured: b.isFeatured,
    createdAt: b.createdAt,
    items,
    sold,
    ...totals,
  };
}

// Make the public bundle pages, bundle list and home page pick up admin changes right away
export function refreshBundlePages() {
  try {
    revalidatePath('/[brand]/bundles', 'page');
    revalidatePath('/[brand]/bundle/[slug]', 'page');
    revalidatePath('/[brand]', 'page');
  } catch {}
}
