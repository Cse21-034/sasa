# Cloudinary Integration - Environment Variables Setup

This guide explains how to configure Cloudinary environment variables for the image upload system.

## Prerequisites

1. Create a free Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Go to your Cloud Dashboard to find your credentials

## Required Environment Variables

### Client-Side (.env or .env.local)

Located in the root directory, needed for unsigned uploads from the frontend:

```bash
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
```

**How to find/create these:**

1. **VITE_CLOUDINARY_CLOUD_NAME**:
   - Found in your Cloudinary Dashboard
   - Look for "Cloud Name" in the top left
   - Example: `dpxx9ux1k`

2. **VITE_CLOUDINARY_UPLOAD_PRESET**:
   - Settings → Upload (left sidebar) → Add Upload Preset
   - Create with Signing Mode: **Unsigned**
   - Save the preset name
   - Make sure "Save in folder" is empty or configured as desired
   - Example preset name: `my_unsigned_preset`

### Server-Side (.env)

Located in the root directory, needed for secure backend operations:

```bash
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to find these:**

1. **CLOUDINARY_NAME**: Same as `VITE_CLOUDINARY_CLOUD_NAME`

2. **CLOUDINARY_API_KEY** and **CLOUDINARY_API_SECRET**:
   - Settings → Account (left sidebar) → API Keys
   - Copy your API Key and API Secret
   - ⚠️ Keep API_SECRET private - never expose it in frontend code

## Example .env File

```bash
# Cloudinary Client Configuration
VITE_CLOUDINARY_CLOUD_NAME=my_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=my_unsigned_preset

# Cloudinary Server Configuration
CLOUDINARY_NAME=my_cloud_name
CLOUDINARY_API_KEY=123456789abcdef
CLOUDINARY_API_SECRET=xyz_secret_key_do_not_share
```

## Configuration Tips

### Upload Preset Settings

When creating your unsigned upload preset in Cloudinary:

1. **Signing Mode**: Select "Unsigned" (allows client-side uploads)
2. **Allowed file types**: Image, PDF (for documents)
3. **Transformations** (Optional):
   - Auto-format conversion (JPEG/WebP based on browser)
   - Auto quality optimization
   - Eager transformations for thumbnails

### Folder Organization

Images are automatically organized by upload context:

- **Profile photos**: `profile-photos/{userId}`
- **Job photos**: `job-photos/{jobId}`
- **Identity verification**: `identity-verification/{id|selfie}`
- **Category documents**: `category-verification/{userId}`
- **Verification documents**: `verification-documents/{userId}`
- **Supplier promotions**: `supplier-promotions/{supplierId}`

## Backend API Endpoints

### Delete Image
```
DELETE /api/cloudinary/delete
Body: { "publicId": "image_public_id" }
```

### Delete Multiple Images
```
DELETE /api/cloudinary/delete-multiple
Body: { "publicIds": ["id1", "id2", "id3"] }
```

### Get Image Metadata
```
GET /api/cloudinary/metadata/:publicId
```

### Tag Resources
```
POST /api/cloudinary/tag
Body: {
  "publicIds": ["id1", "id2"],
  "tags": ["tag1", "tag2"]
}
```

## Troubleshooting

### "Cloudinary API credentials not configured" warning

This appears if any environment variables are missing. Make sure all required variables are set in your `.env` file and the development server is restarted.

### "Invalid upload preset" error

- Verify the preset exists in your Cloudinary account
- Check the preset name is spelled correctly
- Ensure the preset is set to "Unsigned" mode
- Try creating a new preset if the error persists

### CORS errors

If you see CORS errors when uploading:

1. Go to Cloudinary Settings → Security (left sidebar)
2. In "Allowed JS domains", add your app's domain(s):
   - For development: `http://localhost:5173`, `http://localhost:5000`
   - For production: Your deployed domain

### Images not appearing

- Check that the Cloudinary URL is being stored correctly (starts with `https://res.cloudinary.com`)
- Verify the public ID wasn't accidentally modified
- Check browser console for any 404 errors from Cloudinary

## Image Delivery & Optimization

All Cloudinary URLs automatically support:

- **Responsive images**: `w_${width},h_${height},c_fill,q_auto,dpr_auto,f_auto`
- **Thumbnails**: Generated on-demand with size parameters
- **Format conversion**: JPEG/WebP based on browser capability
- **Compression**: Automatic quality optimization

Example generated URL:
```
https://res.cloudinary.com/{cloud_name}/image/upload/w_500,h_500,c_fill,g_face,q_auto,f_auto/folder/image_id.jpg
```

## Security Notes

1. ✅ Unsigned preset only allows uploads - cannot delete or modify
2. ✅ Server-side API key/secret only exposed on backend
3. ✅ Frontend never receives API secret
4. ✅ All delete operations require authentication
5. ✅ Public IDs validated before deletion requests

## Testing Upload Functionality

Once configured, test these endpoints:

```bash
# Test profile photo upload
curl -X POST http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profilePhotoUrl": "https://res.cloudinary.com/..."}'

# Test image deletion
curl -X DELETE http://localhost:5000/api/cloudinary/delete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"publicId": "profile-photos/user-123"}'
```

## Support Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)
- [Admin API Reference](https://cloudinary.com/documentation/admin_api)
- [Cloudinary Dashboard](https://cloudinary.com/console)
