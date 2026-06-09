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

    // Get signed URL for the original image
    let signedUrlResponse;
    try {
      signedUrlResponse = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri,
        expires_in: 3600
      });
      console.log('✅ Got signed URL');
    } catch (err) {
      console.error('❌ CreateFileSignedUrl failed:', err.message);
      throw new Error(`Failed to get signed URL: ${err.message}`);
    }

    const signed_url = signedUrlResponse.signed_url;
    if (!signed_url) {
      throw new Error('No signed_url in response');
    }

    console.log('🔵 Generating watermarked image...');
    // Use LLM to add watermark overlay
    const watermarked = await base44.integrations.Core.GenerateImage({
      prompt: `Take this image and add a subtle diagonal watermark text that says "Noir & Ivory Imaging" in white with 40% opacity across the center. Keep the original image quality and composition intact.`,
      existing_image_urls: [signed_url]
    });
    console.log('✅ Generated watermarked image:', watermarked.url);

    // Upload the watermarked result
    const watermarkedResponse = await fetch(watermarked.url);
    if (!watermarkedResponse.ok) {
      throw new Error(`Failed to fetch watermarked image: ${watermarkedResponse.statusText}`);
    }
    const watermarkedBuffer = await watermarkedResponse.arrayBuffer();

    const watermarkedFile = new File(
      [watermarkedBuffer],
      'watermarked.jpg',
      { type: 'image/jpeg' }
    );

    console.log('🔵 Uploading watermarked file...');
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