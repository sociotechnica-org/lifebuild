# Backup, Export & Restore

## Overview

**Purpose**: Provide data safety and disaster recovery capabilities through automated backups and user-initiated export/import functionality.

**User Value**: Users can back up their workspace data and recover from data loss scenarios. Peace of mind for production use.

**Status**: Not Started ⭕

**Priority**: High - Data safety for production use

## Current State Analysis

### Completely Missing: 0% Implemented

**ADR-003 Proposed** (`docs/adrs/003-backup-storage-strategy.md`):

- Cloudflare R2 for backup storage (S3-compatible)
- Full SQLite database snapshots
- 6-hour automated backup frequency
- Retention policies (30 days hourly, 12 months daily)
- **Status**: Proposed but no implementation exists

**What Exists** (Foundation):

- ✅ R2 integration working for image uploads (`work-squared-images` bucket)
- ✅ LiveStore SQLite databases (ready to snapshot)
- ✅ Better-sqlite3 available for database operations
- ❌ No backup bucket configured
- ❌ No scheduled worker/cron
- ❌ No backup service implementation
- ❌ No export/import endpoints
- ❌ No UI for backup/restore

**File**: `packages/worker/wrangler.jsonc` (current R2 config)

```jsonc
{
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "work-squared-images",
      "preview_bucket_name": "work-squared-images-preview",
    },
    // ❌ Missing: backup bucket
  ],
}
```

## Detailed Implementation Tasks

### Task 5.1: Configure R2 Backup Bucket

**Objective**: Set up dedicated R2 bucket for workspace backups.

**Files to Modify**:

- `packages/worker/wrangler.jsonc`

**Implementation**:

```jsonc
// packages/worker/wrangler.jsonc

{
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "work-squared-images",
      "preview_bucket_name": "work-squared-images-preview",
    },
    {
      "binding": "BACKUPS", // NEW
      "bucket_name": "work-squared-backups",
      "preview_bucket_name": "work-squared-backups-preview",
    },
  ],
}
```

**Cloudflare Dashboard Setup**:

1. Create R2 bucket: `work-squared-backups`
2. Create preview bucket: `work-squared-backups-preview`
3. Configure lifecycle rules (optional):
   - Delete backups older than 30 days
   - Transition to Infrequent Access after 7 days

**Backup Structure** (ADR-003):

```
backups/
  full/
    {timestamp}/
      {instanceId}/
        livestore.db              # SQLite database
        metadata.json             # Backup metadata
```

**Metadata Format**:

```json
{
  "instanceId": "uuid",
  "userId": "uuid",
  "timestamp": "2025-01-15T10:30:00Z",
  "databaseSize": 1048576,
  "backupType": "full",
  "version": "1.0",
  "checksum": "sha256:abc123..."
}
```

**Testing**:

- [ ] Test R2 bucket created successfully
- [ ] Test bucket binding available in worker
- [ ] Test file upload to backup bucket
- [ ] Test file download from backup bucket

---

### Task 5.2: Implement Backup Service

**Objective**: Create service to snapshot SQLite databases and upload to R2.

**Files to Create**:

- `packages/server/src/services/backup-service.ts` (NEW)

**Implementation**:

```typescript
// packages/server/src/services/backup-service.ts (NEW)

import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'
import Database from 'better-sqlite3'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { logger } from '../utils/logger'

interface BackupOptions {
  instanceId: string
  userId: string
  r2Endpoint: string
  r2AccessKeyId: string
  r2SecretAccessKey: string
  r2BucketName: string
}

export class BackupService {
  private s3Client: S3Client

  constructor(r2Config: { endpoint: string; accessKeyId: string; secretAccessKey: string; bucketName: string }) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    })
  }

  /**
   * Create full backup of workspace database
   */
  async createBackup(options: BackupOptions): Promise<void> {
    const { instanceId, userId } = options
    const timestamp = new Date().toISOString()

    logger.info({ instanceId, userId }, 'Starting backup')

    try {
      // 1. Create safe SQLite backup using backup API
      const backupPath = await this.createDatabaseSnapshot(instanceId)

      // 2. Calculate checksum
      const checksum = await this.calculateChecksum(backupPath)

      // 3. Get file stats
      const stats = await fs.stat(backupPath)

      // 4. Create metadata
      const metadata = {
        instanceId,
        userId,
        timestamp,
        databaseSize: stats.size,
        backupType: 'full',
        version: '1.0',
        checksum,
      }

      // 5. Upload database to R2
      const dbKey = `backups/full/${timestamp}/${instanceId}/livestore.db`
      await this.uploadToR2(dbKey, backupPath)

      // 6. Upload metadata to R2
      const metadataKey = `backups/full/${timestamp}/${instanceId}/metadata.json`
      await this.uploadMetadataToR2(metadataKey, metadata)

      // 7. Clean up local backup file
      await fs.unlink(backupPath)

      logger.info(
        {
          instanceId,
          userId,
          timestamp,
          size: stats.size,
        },
        'Backup completed successfully'
      )
    } catch (error) {
      logger.error({ error, instanceId, userId }, 'Backup failed')
      throw error
    }
  }

  /**
   * Create SQLite backup using backup API (safe during active use)
   */
  private async createDatabaseSnapshot(instanceId: string): Promise<string> {
    const sourcePath = path.join(process.cwd(), 'data', instanceId, 'livestore.db')
    const backupPath = path.join(process.cwd(), 'temp', `backup-${instanceId}-${Date.now()}.db`)

    // Ensure temp directory exists
    await fs.mkdir(path.join(process.cwd(), 'temp'), { recursive: true })

    // Open source database (read-only)
    const source = new Database(sourcePath, { readonly: true })

    try {
      // Create backup using SQLite backup API
      // This is safe even while database is in use
      await new Promise((resolve, reject) => {
        const backup = source.backup(backupPath)

        backup.step(-1) // Copy all pages

        if (backup.remaining === 0) {
          backup.close()
          resolve(undefined)
        } else {
          backup.close()
          reject(new Error('Backup incomplete'))
        }
      })

      return backupPath
    } finally {
      source.close()
    }
  }

  /**
   * Calculate SHA-256 checksum of file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath)
    const hash = crypto.createHash('sha256')
    hash.update(fileBuffer)
    return `sha256:${hash.digest('hex')}`
  }

  /**
   * Upload file to R2
   */
  private async uploadToR2(key: string, filePath: string): Promise<void> {
    const fileBuffer = await fs.readFile(filePath)

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: 'application/x-sqlite3',
      })
    )

    logger.info({ key }, 'Uploaded to R2')
  }

  /**
   * Upload metadata to R2
   */
  private async uploadMetadataToR2(key: string, metadata: any): Promise<void> {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2))

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: metadataBuffer,
        ContentType: 'application/json',
      })
    )

    logger.info({ key }, 'Uploaded metadata to R2')
  }

  /**
   * List available backups for instance
   */
  async listBackups(instanceId: string): Promise<any[]> {
    // Implementation: List objects with prefix `backups/full/*/instanceId/`
    // Parse timestamps, return sorted list
    // (Implementation details omitted for brevity)
    return []
  }

  /**
   * Restore backup from R2
   */
  async restoreBackup(options: { instanceId: string; timestamp: string }): Promise<void> {
    // Implementation: Download from R2, verify checksum, restore database
    // (Implementation details omitted for brevity)
  }
}
```

**Dependencies**:

```bash
pnpm --filter @work-squared/server add @aws-sdk/client-s3
```

**Environment**:

```bash
# packages/server/.env

R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=work-squared-backups
```

**Testing**:

- [ ] Test backup creates snapshot using SQLite backup API
- [ ] Test backup succeeds while database is active
- [ ] Test checksum calculation
- [ ] Test upload to R2
- [ ] Test metadata upload
- [ ] Test backup cleanup (temp files deleted)

---

### Task 5.3: Implement Scheduled Backups (Cron)

**Objective**: Run automated backups every 6 hours for all monitored workspaces.

**Files to Create**:

- `packages/server/src/services/backup-scheduler.ts` (NEW)

**Implementation**:

```typescript
// packages/server/src/services/backup-scheduler.ts (NEW)

import cron from 'node-cron'
import { BackupService } from './backup-service'
import { storeManager } from './store-manager'
import { logger } from '../utils/logger'
import * as Sentry from '@sentry/node'

export class BackupScheduler {
  private backupService: BackupService
  private cronJob: cron.ScheduledTask | null = null

  constructor(backupService: BackupService) {
    this.backupService = backupService
  }

  start() {
    // Run every 6 hours: 0 */6 * * * (at :00 of every 6th hour)
    this.cronJob = cron.schedule('0 */6 * * *', async () => {
      logger.info('Starting scheduled backup run')
      await this.runBackups()
    })

    logger.info('Backup scheduler started (every 6 hours)')
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob = null
      logger.info('Backup scheduler stopped')
    }
  }

  /**
   * Backup all monitored workspaces
   */
  private async runBackups() {
    const stores = Array.from(storeManager.getAllStores().keys())

    logger.info({ storeCount: stores.length }, 'Running backups for all stores')

    const results = await Promise.allSettled(stores.map(instanceId => this.backupWorkspace(instanceId)))

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    logger.info(
      {
        total: stores.length,
        successful,
        failed,
      },
      'Backup run completed'
    )

    // Alert if failure rate > 1%
    if (failed > 0 && failed / stores.length > 0.01) {
      Sentry.captureMessage('High backup failure rate', {
        level: 'error',
        tags: { backup_run: 'scheduled' },
        extra: { total: stores.length, successful, failed },
      })
    }
  }

  /**
   * Backup single workspace
   */
  private async backupWorkspace(instanceId: string): Promise<void> {
    try {
      // TODO: Fetch userId from instance metadata
      const userId = 'unknown' // Placeholder

      await this.backupService.createBackup({
        instanceId,
        userId,
        r2Endpoint: process.env.R2_ENDPOINT!,
        r2AccessKeyId: process.env.R2_ACCESS_KEY_ID!,
        r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        r2BucketName: process.env.R2_BUCKET_NAME!,
      })

      logger.info({ instanceId }, 'Workspace backup succeeded')
    } catch (error) {
      logger.error({ error, instanceId }, 'Workspace backup failed')

      Sentry.captureException(error, {
        tags: { instanceId, operation: 'backup' },
      })

      throw error
    }
  }

  /**
   * Trigger manual backup run (for testing/admin use)
   */
  async triggerManualBackup(): Promise<void> {
    logger.info('Manual backup triggered')
    await this.runBackups()
  }
}
```

**Dependencies**:

```bash
pnpm --filter @work-squared/server add node-cron @types/node-cron
```

**Server Integration** (`packages/server/src/index.ts`):

```typescript
import { BackupService } from './services/backup-service'
import { BackupScheduler } from './services/backup-scheduler'

async function main() {
  // ... existing initialization ...

  // Initialize backup service
  const backupService = new BackupService({
    endpoint: process.env.R2_ENDPOINT!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME!,
  })

  // Start backup scheduler
  const backupScheduler = new BackupScheduler(backupService)
  backupScheduler.start()

  logger.info('Backup scheduler started')

  // ... existing code ...
}

const shutdown = async () => {
  // ... existing shutdown ...
  backupScheduler.stop() // NEW
  // ...
}
```

**Testing**:

- [ ] Test cron schedule parses correctly
- [ ] Test backup runs for all stores
- [ ] Test failure tracking and alerting
- [ ] Test manual trigger
- [ ] Integration test: Schedule → backups created

---

### Task 5.4: Build On-Demand Export Endpoint

**Objective**: Allow users to download their workspace data on demand.

**Files to Create**:

- `packages/worker/functions/api/export.ts` (NEW)

**Files to Modify**:

- `packages/worker/functions/_worker.ts` (add export route)

**Implementation**:

```typescript
// packages/worker/functions/api/export.ts (NEW)

import { BackupService } from '@work-squared/server/src/services/backup-service'

export async function handleExportWorkspace(
  request: Request,
  env: any,
  userId: string,
  instanceId: string
): Promise<Response> {
  try {
    // Create backup service
    const backupService = new BackupService({
      endpoint: env.R2_ENDPOINT,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
    })

    // Create backup
    await backupService.createBackup({
      instanceId,
      userId,
      r2Endpoint: env.R2_ENDPOINT,
      r2AccessKeyId: env.R2_ACCESS_KEY_ID,
      r2SecretAccessKey: env.R2_SECRET_ACCESS_KEY,
      r2BucketName: env.R2_BUCKET_NAME,
    })

    // Generate signed URL (expires in 1 hour)
    const downloadUrl = await generateSignedUrl(env, instanceId)

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl,
        expiresIn: 3600, // 1 hour
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Export failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Export failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

async function generateSignedUrl(env: any, instanceId: string): Promise<string> {
  // Generate pre-signed R2 URL (1 hour expiry)
  // Implementation using @aws-sdk/s3-request-presigner
  // (Details omitted for brevity)
  return `https://backup-url.example.com/download/${instanceId}`
}
```

**Router** (`packages/worker/functions/_worker.ts`):

```typescript
import { handleExportWorkspace } from './api/export'

// POST /workspaces/:instanceId/export
if (url.pathname.match(/^\/workspaces\/[^/]+\/export$/) && request.method === 'POST') {
  const userId = await getUserIdFromRequest(request, env)
  if (!userId) return createErrorResponse('Unauthorized', 401)

  const instanceId = url.pathname.split('/')[2]

  // Verify user owns this workspace
  const hasAccess = await userCanAccessInstance(userId, instanceId, env)
  if (!hasAccess) {
    return createErrorResponse('Forbidden', 403)
  }

  return await handleExportWorkspace(request, env, userId, instanceId)
}
```

**Testing**:

- [ ] Test export creates backup
- [ ] Test export returns download URL
- [ ] Test unauthorized users rejected
- [ ] Test download URL works
- [ ] Test download URL expires after 1 hour

---

### Task 5.5: Build Import/Restore Endpoint

**Objective**: Allow users to restore workspace from backup file.

**Files to Create**:

- `packages/worker/functions/api/import.ts` (NEW)

**Implementation**:

```typescript
// packages/worker/functions/api/import.ts (NEW)

export async function handleImportWorkspace(
  request: Request,
  env: any,
  userId: string,
  instanceId: string
): Promise<Response> {
  try {
    // Parse multipart/form-data upload
    const formData = await request.formData()
    const file = formData.get('backup') as File

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: 'No backup file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate file is SQLite database
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Check SQLite magic number
    const sqliteMagic = 'SQLite format 3\0'
    const header = String.fromCharCode(...buffer.slice(0, 16))

    if (!header.startsWith(sqliteMagic)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid backup file (not SQLite)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // TODO: Implement restore logic
    // 1. Pause event processing for this instance
    // 2. Validate database integrity
    // 3. Replace current database with backup
    // 4. Resume event processing
    // 5. Verify sync connectivity

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Workspace restored successfully',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Import failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Import failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
```

**Testing**:

- [ ] Test import validates SQLite format
- [ ] Test import rejects invalid files
- [ ] Test import replaces database
- [ ] Test event processing paused during restore
- [ ] Test sync connectivity after restore

---

### Task 5.6: Build Backup/Restore UI

**Objective**: Add backup/restore section to Settings page.

**Files to Create**:

- `packages/web/src/components/settings/BackupRestoreSection.tsx` (NEW)

**Files to Modify**:

- `packages/web/src/pages/SettingsPage.tsx`

**Implementation**:

```typescript
// packages/web/src/components/settings/BackupRestoreSection.tsx (NEW)

import React, { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'

export const BackupRestoreSection: React.FC = () => {
  const { currentWorkspaceId } = useWorkspace()
  const { getCurrentToken } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)

    try {
      const token = await getCurrentToken()
      const response = await fetch(
        `${authServiceUrl}/workspaces/${currentWorkspaceId}/export`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (data.downloadUrl) {
        // Trigger download
        window.open(data.downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (file: File) => {
    setImporting(true)

    try {
      const token = await getCurrentToken()
      const formData = new FormData()
      formData.append('backup', file)

      const response = await fetch(
        `${authServiceUrl}/workspaces/${currentWorkspaceId}/import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (data.success) {
        alert('Workspace restored successfully. Reloading...')
        window.location.reload()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Backup & Restore</h3>
        <p className="mt-1 text-sm text-gray-500">
          Download a backup of your workspace or restore from a previous backup.
        </p>
      </div>

      {/* Export */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Download Backup</h4>
            <p className="mt-1 text-sm text-gray-500">
              Export your workspace data as a downloadable file.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Download Backup'}
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="border-t border-gray-200 pt-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Restore from Backup</h4>
          <p className="mt-1 text-sm text-gray-500">
            Replace your current workspace data with a previous backup.
          </p>
          <p className="mt-1 text-sm text-red-600">
            Warning: This will replace all current data.
          </p>

          <label className="mt-4 inline-block">
            <input
              type="file"
              accept=".db"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  const confirmed = confirm(
                    'Are you sure you want to restore from this backup? This will replace all current data.'
                  )
                  if (confirmed) {
                    handleImport(file)
                  }
                }
              }}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
```

**Testing**:

- [ ] Test export button triggers download
- [ ] Test import file upload works
- [ ] Test confirmation dialog on import
- [ ] Test restore triggers reload
- [ ] E2E test: Export → Import → Data restored

---

## Success Metrics

### Quantitative

- [ ] Backup jobs succeed ≥99% of the time
- [ ] Restore drills complete in <15 minutes
- [ ] 0 corrupt snapshot incidents
- [ ] Backup completion time <5 minutes per workspace

### Qualitative

- [ ] Users trust the backup system
- [ ] Export/import flow is intuitive
- [ ] Clear feedback during backup/restore operations

### Monitoring

- [ ] Sentry tracks backup success/failure rates
- [ ] Dashboard shows backup metrics per workspace
- [ ] Alerts fire when backup failure rate exceeds threshold
- [ ] Backup size tracking over time

---

## Testing Requirements

### Unit Tests

- [ ] Test SQLite backup API creates valid snapshot
- [ ] Test checksum calculation
- [ ] Test R2 upload/download
- [ ] Test backup metadata generation
- [ ] Test cron schedule parsing

### Integration Tests

- [ ] Test end-to-end backup creation
- [ ] Test scheduled backup runs
- [ ] Test export creates download URL
- [ ] Test import validates and restores database
- [ ] Test backup during active database use

### Disaster Recovery Tests

- [ ] Test restore from 1-day-old backup
- [ ] Test restore from 1-week-old backup
- [ ] Test restore from corrupted backup (should fail gracefully)
- [ ] Test backup of large workspace (>1GB)

---

## Dependencies

**Prerequisite**: None - Can start with manual workspace list from [027-workspace-management](../027-workspace-management/)

**Soft Dependency**: [028-dynamic-store-orchestration](../028-dynamic-store-orchestration/) - Automated workspace discovery makes backups more comprehensive, but can start with static `STORE_IDS` list

**Blocks**: None

**Can Parallelize**: R2 setup, backup service implementation, and UI work can all proceed independently. Can deploy manual export before automated backups.

**External Dependencies**:

- Cloudflare R2 backup bucket
- AWS SDK S3 client

---

## Deployment Checklist

### Pre-Deployment

- [ ] R2 backup bucket created
- [ ] R2 credentials configured
- [ ] Backup service tested in staging
- [ ] Cron schedule validated
- [ ] All tests passing

### Deployment

- [ ] Deploy server with backup service and scheduler
- [ ] Deploy worker with export/import endpoints
- [ ] Deploy web app with backup UI
- [ ] Test manual export end-to-end
- [ ] Verify scheduled backups run

### Post-Deployment

- [ ] Monitor backup success rate (should be ≥99%)
- [ ] Verify backups appear in R2 bucket
- [ ] Test restore from backup
- [ ] Monitor backup storage costs

---

## Rollback Plan

If backups cause issues:

1. **Immediate**: Disable scheduled backups (stop cron)
2. **Short-term**: Keep manual export available
3. **Investigation**: Review logs and identify failure patterns
4. **Fix**: Address issues and re-enable scheduled backups
5. **Monitor**: Gradually increase backup frequency

---

## Related Plans

**Depends On**: None (can start immediately)

**Soft Dependency**: [028-dynamic-store-orchestration](../028-dynamic-store-orchestration/) - Makes automated backups more comprehensive

**Blocks**: None

**Can Work In Parallel With**: All other plans - backup infrastructure is independent

## Incremental Deployment Strategy

This plan can be shipped in phases:

1. **Export-only** (fastest to ship) - Manual export/download for alpha users
2. **R2 + Manual trigger** - Add R2 storage and manual backup API
3. **Automated backups** - Add cron scheduler for regular backups
4. **Restore** - Add import/restore capability last
