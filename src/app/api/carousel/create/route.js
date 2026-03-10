import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { instagramAccountId, caption, mediaIds } = await request.json();

    const { data, error } = await supabase
      .from('carousel_posts')
      .insert({
        user_id: user.id,
        instagram_account_id: instagramAccountId,
        caption,
        media_ids: mediaIds,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ carouselPostId: data.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
