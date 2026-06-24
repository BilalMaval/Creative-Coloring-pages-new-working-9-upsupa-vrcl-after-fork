// Server-side utility functions

// Generate slug from string
export function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Paginate results
export function paginate(items, page = 1, limit = 12) {
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);
  const totalPages = Math.ceil(items.length / limit);
  
  return {
    items: paginatedItems,
    currentPage: page,
    totalPages,
    totalItems: items.length,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

// Format date
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}