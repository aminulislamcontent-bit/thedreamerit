// POST /api/ai-wizard/upload-photo - Upload product photo
// Input: multipart/form-data with image file(s)
// Output: { photoUrls: string[] }
import { NextRequest } from 'next/server';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'content.create' as any)) return forbidden();

  const formData = await req.formData();
  const files = formData.getAll('photos') as File[];

  if (!files || files.length === 0) {
    return badRequest('কোনো ছবি পাওয়া যায়নি');
  }

  // Validate files
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
  const photoUrls: string[] = [];

  const uploadDir = path.join(process.cwd(), 'uploads', 'products');
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  for (const file of files) {
    if (!validTypes.includes(file.type)) {
      continue; // Skip invalid files
    }
    if (file.size > 5 * 1024 * 1024) {
      continue; // Skip files > 5MB
    }

    const fileId = randomUUID();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `product-${fileId}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    photoUrls.push(`/uploads/products/${fileName}`);
  }

  if (photoUrls.length === 0) {
    return badRequest('কোনো গ্রহণযোগ্য ছবি নেই। JPG, PNG, WebP ফরম্যাট সাপোর্টেড (ম্যাক্স ৫MB প্রতি ছবি)');
  }

  await logAudit({
    userId: user.id,
    action: 'ai_wizard.photos_uploaded',
    entityType: 'User',
    entityId: user.id,
    metadata: { count: photoUrls.length, urls: photoUrls },
    ipAddress: getClientIp(req),
  });

  return ok({ photoUrls });
});
