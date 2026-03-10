import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/instagram/callback`;
  const scope = 'instagram_basic,pages_show_list,pages_read_engagement';
  const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(oauthUrl);
}
