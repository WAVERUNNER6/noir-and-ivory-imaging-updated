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

    console.log('🔵 Starting watermark for:', file_uri);

    // Get signed URL to fetch the image
    console.log('🔵 Getting signed URL...');
    const signedUrl = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 3600
    });

    // Fetch the image
    console.log('🔵 Fetching image...');
    const imageResponse = await fetch(signedUrl.signed_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Use the LLM with vision to apply watermark (fallback but simpler)
    console.log('🔵 Generating watermarked image...');
    const watermarked = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: 'Add a subtle diagonal watermark text "Noir & Ivory Imaging" in white with 30% opacity across the center of this image. Keep original quality.',
      file_urls: [file_uri]
    });

    // Fetch generated watermarked image
    const watermarkedResponse = await fetch(watermarked.url);
    if (!watermarkedResponse.ok) {
      throw new Error('Failed to fetch watermarked image');
    }
    const watermarkedBuffer = await watermarkedResponse.arrayBuffer();

    // Upload the watermarked result
    console.log('🔵 Uploading watermarked file...');
    const watermarkedFile = new File(
      [watermarkedBuffer],
      'watermarked.jpg',
      { type: 'image/jpeg' }
    );

    const uploadResponse = await base44.integrations.Core.UploadPrivateFile({
      file: watermarkedFile
    });
    const watermarked_uri = uploadResponse.file_uri;
    console.log('✅ Uploaded watermarked file:', watermarked_uri);

    return Response.json({
      original_uri: file_uri,
      watermarked_uri
    });
  } catch (error) {
    console.error('❌ Watermark error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});