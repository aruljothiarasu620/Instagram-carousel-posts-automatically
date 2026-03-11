import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { publishCarousel } from '@/lib/instagram';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { instagramAccountId, carouselContainerId, carouselPostId } = await request.json();

    // Fetch account
    const { data: account, error: accountError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('id', instagramAccountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) throw new Error('Instagram account not found');

    // Publish
    const publishedMediaId = await publishCarousel({
      igUserId: account.ig_user_id,
      accessToken: account.access_token,
      carouselContainerId,
    });

    // Update carousel post
    const { error: updateError } = await supabase
      .from('carousel_posts')
      .update({
        published_media_id: publishedMediaId,
        status: 'published',
        published_at: new Date(),
      })
      .eq('id', carouselPostId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ publishedMediaId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
