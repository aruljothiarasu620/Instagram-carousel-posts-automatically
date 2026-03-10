import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createMediaContainer, isVideoFile } from '@/lib/instagram';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mediaIds, instagramAccountId } = await request.json();

    // Fetch the Instagram account details
    const { data: account, error: accountError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('id', instagramAccountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) throw new Error('Instagram account not found');

    // Fetch the media uploads
    const { data: mediaList, error: mediaError } = await supabase
      .from('media_uploads')
      .select('*')
      .in('id', mediaIds)
      .eq('user_id', user.id);

    if (mediaError) throw mediaError;

    // Create Instagram containers for each media
    const containerIds = [];
    for (const media of mediaList) {
      const isVideo = isVideoFile(media.mime_type);
      const containerId = await createMediaContainer({
        igUserId: account.ig_user_id,
        accessToken: account.access_token,
        fileUrl: media.file_url,
        isVideo,
      });
      containerIds.push(containerId);
    }

    // Optionally, we could store these container IDs in a carousel post record
    // For now, return them
    return NextResponse.json({ containerIds });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
