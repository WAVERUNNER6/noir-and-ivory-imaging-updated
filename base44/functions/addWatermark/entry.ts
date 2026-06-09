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

    // Ensure proper format
    console.log('🔵 Creating signed URL...');
    const fileUri = !file_uri.includes('private://') ? `private://${file_uri}` : file_uri;
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 3600
    });
    console.log('✅ Got signed URL');

    // Generate watermarked image using LLM with vision
    console.log('🔵 Applying watermark...');
    const watermarked = await base44.integrations.Core.GenerateImage({
      prompt: 'Add a subtle diagonal watermark text "Noir & Ivory Imaging" in white with 30% opacity across the center of this image. Keep original quality and format.',
      file_urls: [signed_url]
    });
    console.log('✅ Watermark generated:', watermarked.url);

    // Download watermarked image and upload to private storage
    console.log('🔵 Downloading watermarked image...');
    const watermarkedResponse = await fetch(watermarked.url);
    if (!watermarkedResponse.ok) {
      throw new Error(`Failed to download watermarked image: ${watermarkedResponse.statusText}`);
    }
    const watermarkedBuffer = await watermarkedResponse.arrayBuffer();

    console.log('🔵 Uploading watermarked file to storage...');
    const watermarkedFile = new File(
      [watermarkedBuffer],
      'watermarked.jpg',
      { type: 'image/jpeg' }
    );
    const { file_uri: watermarked_uri } = await base44.integrations.Core.UploadPrivateFile({
      file: watermarkedFile
    });
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