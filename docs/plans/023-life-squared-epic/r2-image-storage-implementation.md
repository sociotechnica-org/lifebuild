# R2 Image Storage Implementation Plan

## Overview

Implementation plan for Project cover image uploads using Cloudflare R2 object storage. R2 integrates seamlessly with existing Cloudflare Workers infrastructure and provides cost-effective, scalable image storage with free egress.

## Architecture

### Production

- Images uploaded via Worker endpoint → stored in R2 bucket → URLs returned to client
- R2 bucket: `work-squared-images` (public read, authenticated write)
- CDN: Cloudflare automatically caches R2 responses

### Local Development

- Wrangler R2 simulator (runs locally, ephemeral storage)
- Images don't persist between dev sessions (acceptable for development)
- Works automatically with `wrangler dev`

## Implementation Tasks

### 1. R2 Bucket Setup

**Production:**

```bash
# Create R2 bucket (one-time setup)
wrangler r2 bucket create work-squared-images

# Configure CORS for browser uploads
wrangler r2 bucket cors put work-squared-images --config cors.json
```

**cors.json:**

```json
[
  {
    "AllowedOrigins": ["https://worksquared.com", "https://*.worksquared.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

**Local Development:**

```bash
# Wrangler automatically provides R2 simulation in dev mode
# No separate setup needed - ephemeral storage during wrangler dev
```

### 2. Wrangler Configuration

Update `packages/worker/wrangler.jsonc`:

```jsonc
{
  // ... existing config
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "work-squared-images",
      "preview_bucket_name": "work-squared-images-preview",
    },
  ],
}
```

### 3. TypeScript Bindings

Add to worker environment interface:

```typescript
export interface Env {
  DB: D1Database
  WEBSOCKET_SERVER: DurableObjectNamespace
  IMAGES: R2Bucket // Add R2 binding
  JWT_SECRET?: string
  REQUIRE_AUTH?: string
  ENVIRONMENT?: string
}
```

### 4. Image Upload Endpoint

Create upload handler with validation:

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function handleImageUpload(request: Request, env: Env): Promise<Response> {
  // 1. Verify authentication (use existing JWT logic)
  // 2. Parse multipart form data
  // 3. Validate file type and size
  // 4. Generate unique filename: covers/${uuid}.${ext}
  // 5. Upload to R2 with metadata
  // 6. Return public URL
}
```

Add route in `packages/worker/functions/_worker.ts`:

- POST `/api/upload-image` → handleImageUpload

### 5. Image Serving Strategy

**Option A: Direct R2 Public URL** (recommended)

- Configure R2 bucket with public read access
- Use R2's built-in public URL or custom domain
- Simplest, leverages Cloudflare CDN automatically

**Option B: Serve via Worker** (more control)

- GET `/api/images/:key` endpoint
- Allows image transformations, additional security
- More complex, add later if needed

### 6. Frontend Upload Component

Create `packages/web/src/components/ImageUpload.tsx`:

**Features:**

- File input with preview
- Upload progress state
- Remove/replace image
- Error handling
- Integration with existing auth

**Props:**

```typescript
interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImageUrl?: string
}
```

### 7. LiveStore Integration

**Event (already defined in phase-2 plan):**

```typescript
export const projectCoverImageSet = Events.synced({
  name: 'v1.ProjectCoverImageSet',
  schema: Schema.Struct({
    projectId: Schema.String,
    coverImageUrl: Schema.String,
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})
```

**Materializer:**

```typescript
'v1.ProjectCoverImageSet': ({ projectId, coverImageUrl, updatedAt }) => [
  projects.update({
    attributes: sql`
      json_set(
        COALESCE(attributes, '{}'),
        '$.coverImage',
        ${coverImageUrl}
      )
    `,
    updatedAt,
  }).where({ id: projectId }),
]
```

**Schema update:**

```typescript
// projects.attributes JSON field
{
  coverImage?: string // R2 URL or key
  // ... other attributes
}
```

### 8. Local Development

**Wrangler R2 Simulator (Recommended)**

Works automatically with `pnpm dev`:

- R2 bindings available in dev mode
- Data is ephemeral (cleared on restart)
- No extra configuration needed

**Pros:**

- Zero setup
- Works exactly like production
- Automatic with wrangler dev

**Cons:**

- Data cleared on restart (acceptable for dev)
- Can't easily inspect stored files

## Testing Strategy

### Unit Tests

- Image upload validation (size, type)
- Key generation uniqueness
- Error handling (invalid files, too large, etc.)

### Integration Tests

- Upload flow: file → R2 → URL returned
- Event commit after upload
- Image retrieval from R2

### E2E Tests

- Create project → upload cover → see image on card
- Edit cover image → see updated image
- Remove cover image

## Security Considerations

1. **Authentication**: All uploads require valid JWT
2. **File Validation**:
   - Check MIME type
   - Verify file size (5MB max)
   - Consider magic bytes validation
3. **Rate Limiting**: Consider rate limits on upload endpoint
4. **Content Moderation**: Future enhancement
5. **CORS**: Restrict origins to application domains only

## Cost Estimate (Cloudflare R2)

- **Storage**: $0.015/GB/month
- **Operations**: Free (1M reads, 1M writes/month)
- **Egress**: **FREE** (major benefit vs S3)

**Example for 10K users with 5 images each @ 500KB avg:**

- Storage: 25GB × $0.015 = **$0.38/month**
- Operations: Well within free tier
- Total: **~$0.38/month**

## Migration Path

1. Deploy R2 bucket and Worker endpoint (no breaking changes)
2. Update frontend to use new upload component
3. Existing projects without covers work fine (null check)
4. Add covers to new projects going forward
5. Optional: Backfill existing projects with default/AI-generated covers

## Future Enhancements

### Image Optimization

Use Cloudflare Image Resizing:

```typescript
const imageUrl = `/cdn-cgi/image/width=400,format=auto/${key}`
```

### Cloudflare Images Product

- Direct upload to Cloudflare Images (paid service)
- Automatic resizing/optimization
- Multiple variants support
- Better DX, higher cost

### Content Moderation

- Integrate image moderation API
- Block inappropriate uploads
- Review flagged content

## Implementation Order

1. ✅ Write implementation plan
2. Update wrangler.jsonc with R2 binding
3. Add R2 types to worker environment
4. Implement upload endpoint in worker
5. Add event and materializer to shared package
6. Create ImageUpload component
7. Integrate component into project creation form
8. Write unit tests
9. Test locally with wrangler dev
10. Create R2 bucket in production
11. Deploy and test end-to-end

## Summary

**What you get:**

- Scalable, cost-effective image storage (~$0.38/month for 10K users)
- Simple local development (ephemeral R2 via Wrangler)
- Production-ready CDN delivery
- Type-safe integration with LiveStore
- Secure, authenticated uploads

**Key benefits:**

- Free egress (vs AWS S3)
- Integrated with existing Cloudflare infrastructure
- Simple local development story
- Minimal code changes required
