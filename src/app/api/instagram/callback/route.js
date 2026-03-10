import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=no_code`);
  }

  // Exchange code for access token
  const clientId = process.env.INSTAGRAM_APP_ID;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/instagram/callback`;

  const tokenRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=token_exchange_failed`);
  }

  // Get long-lived token
  const longLivedRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`);
  const longLivedData = await longLivedRes.json();

  // Get Instagram Business Account ID
  const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedData.access_token}`);
  const accountsData = await accountsRes.json();
  
  if (!accountsData.data || accountsData.data.length === 0) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=no_pages_found`);
  }

  const page = accountsData.data[0]; // assuming first page
  const instaRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${longLivedData.access_token}`);
  const instaData = await instaRes.json();
  
  if (!instaData.instagram_business_account) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=no_ig_account_found`);
  }
  
  const igUserId = instaData.instagram_business_account.id;

  // Get IG username
  const igUserRes = await fetch(`https://graph.facebook.com/v18.0/${igUserId}?fields=username&access_token=${longLivedData.access_token}`);
  const igUserData = await igUserRes.json();

  // Store in database (user must be logged in)
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login`);

  await supabase.from('instagram_accounts').insert({
    user_id: user.id,
    ig_user_id: igUserId,
    ig_username: igUserData.username,
    access_token: longLivedData.access_token,
    token_expires_at: new Date(Date.now() + longLivedData.expires_in * 1000),
  });

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`);
}
