import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitize the filename to prevent path traversal
  const sanitizedFilename = basename(file.name.replace(/\s+/g, '_'));

  // Create a unique filename
  const filename = `${Date.now()}_${sanitizedFilename}`;

  // Define the path to the public/uploads directory
  const uploadDir = join(process.cwd(), 'public', 'uploads');

  // Create the upload directory if it doesn't exist
  await mkdir(uploadDir, { recursive: true });

  // Define the full file path
  const path = join(uploadDir, filename);

  // Write the file to the public directory
  await writeFile(path, buffer);

  // Return the public URL of the file
  const imageUrl = `/uploads/${filename}`;

  return NextResponse.json({ success: true, imageUrl });
}
