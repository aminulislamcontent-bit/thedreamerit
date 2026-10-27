// GET /api/categories - list categories tree
// POST /api/categories - create category (admin)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { slugify } from '@/lib/format';

export const GET = apiHandler(async () => {
  const categories = await db.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: true } },
      attributes: { orderBy: { displayOrder: 'asc' } },
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  // Build tree
  const tree = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    productCount: c._count.products,
    attributes: c.attributes,
    children: [] as any[],
  }));

  const map = new Map(tree.map((c) => [c.id, c]));
  const roots: any[] = [];
  for (const c of tree) {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(c);
    } else {
      roots.push(c);
    }
  }

  return ok({ categories: tree, tree: roots });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'system.settings' as any)) return forbidden();

  const body = await req.json();
  const { name, slug, parentId, description, iconUrl } = body;

  if (!name) return badRequest('Name is required');

  const finalSlug = slug || slugify(name);
  const existing = await db.category.findUnique({ where: { slug: finalSlug } });
  if (existing) return badRequest('Slug already exists');

  const category = await db.category.create({
    data: {
      name,
      slug: finalSlug,
      parentId: parentId || null,
      description: description || null,
      iconUrl: iconUrl || null,
    },
  });

  return ok({ category });
});
