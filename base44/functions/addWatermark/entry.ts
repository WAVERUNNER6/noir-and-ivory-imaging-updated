import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { file_uri } = body;

    if (!file_uri) {
      return Response.json({ error: 'Missing file_uri' }, { status: 400 });
    }

    // Get signed URL for the original image
    const signedUrlResponse = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 3600
    });
    const signed_url = signedUrlResponse.signed_url;

    // Use LLM to add watermark overlay
    const watermarked = await base44.integrations.Core.GenerateImage({
      prompt: `Take this image and add a subtle diagonal watermark text that says "Noir & Ivory Imaging" in white with 40% opacity across the center. Keep the original image quality and composition intact.`,
      existing_image_urls: [signed_url]
    });

    // Upload the watermarked result
    const watermarkedResponse = await fetch(watermarked.url);
    const watermarkedBuffer = await watermarkedResponse.arrayBuffer();

    const watermarkedFile = new File(
      [watermarkedBuffer],
      'watermarked.jpg',
      { type: 'image/jpeg' }
    );

    const { file_uri: watermarked_uri } = await base44.integrations.Core.UploadPrivateFile({
      file: watermarkedFile
    });

    return Response.json({
      original_uri: file_uri,
      watermarked_uri
    });
  } catch (error) {
    console.error('Watermark error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});