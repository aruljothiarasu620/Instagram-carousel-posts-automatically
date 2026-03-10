import { put } from '@vercel/blob';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const files = formData.getAll('files'); // array of File objects

    const uploadedMedia = [];

    for (const file of files) {
      // Upload to Vercel Blob
      const blob = await put(file.name, file, { access: 'public' });

      // Determine file type (simple)
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';

      // Save to media_uploads table
      const { data, error } = await supabase
        .from('media_uploads')
        .insert({
          user_id: user.id,
          file_url: blob.url,
          file_type: fileType,
          mime_type: file.type,
          size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      uploadedMedia.push(data);
    }

    return NextResponse.json({ media: uploadedMedia });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
