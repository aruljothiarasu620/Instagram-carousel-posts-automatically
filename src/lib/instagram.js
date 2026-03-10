const INSTAGRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Step 1: Create a single media container (image or video) for a carousel item.
 */
export async function createMediaContainer({ igUserId, accessToken, fileUrl, isVideo }) {
  const url = `${INSTAGRAPH_API_BASE}/${igUserId}/media`;
  const body = {
    access_token: accessToken,
    is_carousel_item: true,
  };

  if (isVideo) {
    body.media_type = 'VIDEO';
    body.video_url = fileUrl;
  } else {
    body.image_url = fileUrl;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to create media container');
  return data.id; // container ID
}

/**
 * Step 2: Create the carousel container that groups the individual media containers.
 */
export async function createCarouselContainer({ igUserId, accessToken, childrenContainerIds, caption }) {
  const url = `${INSTAGRAPH_API_BASE}/${igUserId}/media`;
  const body = {
    access_token: accessToken,
    media_type: 'CAROUSEL',
    children: childrenContainerIds,
    caption: caption,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to create carousel container');
  return data.id; // carousel container ID
}

/**
 * Step 3: Publish the carousel container.
 */
export async function publishCarousel({ igUserId, accessToken, carouselContainerId }) {
  const url = `${INSTAGRAPH_API_BASE}/${igUserId}/media_publish`;
  const body = {
    access_token: accessToken,
    creation_id: carouselContainerId,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to publish carousel');
  return data.id; // published media ID
}

/**
 * Helper: determine if a file is video based on mime type.
 */
export function isVideoFile(mimeType) {
  return mimeType.startsWith('video/');
}
