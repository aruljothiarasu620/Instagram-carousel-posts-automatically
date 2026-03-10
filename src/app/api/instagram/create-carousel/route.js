import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createCarouselContainer } from '@/lib/instagram';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { instagramAccountId, childrenContainerIds, caption, carouselPostId } = await request.json();

    // Fetch account
    const { data: account, error: accountError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('id', instagramAccountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) throw new Error('Instagram account not found');

    // Create carousel container
    const carouselContainerId = await createCarouselContainer({
      igUserId: account.ig_user_id,
      accessToken: account.access_token,
      childrenContainerIds,
      caption,
    });

    // Update the carousel post record
    const { error: updateError } = await supabase
      .from('carousel_posts')
      .update({
        carousel_container_id: carouselContainerId,
        status: 'containers_created',
        children_container_ids: childrenContainerIds,
      })
      .eq('id', carouselPostId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ carouselContainerId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
