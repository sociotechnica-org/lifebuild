# Use Cloudflare R2 for Backup Storage

## Status

Proposed

## Last Updated

2025-06-18

## Context

Work Squared needs a reliable backup strategy for:

- SQLite database snapshots (complete system state)
- Document exports (markdown files)
- Worker configurations and conversation history
- User data for compliance and recovery

Requirements:

- Automated backups every 6 hours minimum
- Point-in-time recovery capability
- Cost-effective storage for growing data
- Simple restore process
- Geographic redundancy

Options evaluated:

1. **Local disk backups**: Simple but no redundancy
2. **Cloudflare R2**: S3-compatible object storage
3. **AWS S3**: Industry standard but another vendor
4. **Database replication**: Complex for SQLite

## Decision

We will use Cloudflare R2 for backup storage with automated snapshots every 6 hours.

Backup strategy:

- **Full backups**: Complete SQLite database snapshots
- **Incremental exports**: JSON exports of recent changes
- **Retention policy**: 30 days of hourly, 12 months of daily backups
- **Storage location**: Cloudflare R2 with lifecycle policies

## Consequences

### Positive

- **S3-compatible**: Use standard S3 SDKs and tools
- **Cost-effective**: No egress fees, competitive storage pricing
- **Same vendor**: Integrates with existing Cloudflare account
- **Global replication**: Automatic geographic redundancy
- **Simple restore**: Download and replace SQLite file
- **Lifecycle policies**: Automatic cleanup of old backups

### Negative

- **Not real-time**: Maximum 6 hours of data loss in worst case
- **Manual restore**: No automated failover (acceptable for MVP)
- **Storage costs**: Will grow over time (but predictable)

### Neutral

- R2 is relatively new but has proven reliable
- Can implement more sophisticated backup strategies later
- Compatible with standard backup tools

## Implementation Notes

```typescript
// Backup service implementation (uploads via worker endpoint → R2)
import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'

class BackupService {
  constructor(
    private readonly workerUploadUrl: string,
    private readonly serverToken: string
  ) {}

  async createBackup() {
    const timestamp = new Date().toISOString()

    // 1. Create SQLite snapshot
    const dbPath = '/data/livestore.db'
    const backupKey = `backups/full/${timestamp}/livestore.db`

    // Copy database using SQLite backup API (safe for active DB)
    await this.backupDatabase(dbPath, backupKey)

    // 2. Export metadata
    const metadata = {
      timestamp,
      version: APP_VERSION,
      stats: await this.getSystemStats(),
    }

    const formData = new FormData()
    formData.append(
      'file',
      new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' }),
      `backups/full/${timestamp}/metadata.json`
    )

    const response = await fetch(`${this.workerUploadUrl}/api/upload-backup`, {
      method: 'POST',
      headers: {
        'X-Server-Token': this.serverToken,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Backup upload failed: ${response.status} ${errorText}`)
    }

    // 3. Cleanup old backups based on retention policy
    await this.cleanupOldBackups()
  }

  async restoreBackup(timestamp: string) {
    // Download from R2 via worker endpoint
    const backupKey = `backups/full/${timestamp}/livestore.db`
    const response = await fetch(`${this.workerUploadUrl}/api/backups/${backupKey}`, {
      headers: {
        'X-Server-Token': this.serverToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Backup download failed: ${response.status}`)
    }

    const restored = await response.arrayBuffer()

    // Verify integrity
    const isValid = await this.verifyDatabase(restored)
    if (!isValid) throw new Error('Backup integrity check failed')

    // Replace current database
    await this.replaceDatabase(restored)
  }
}

// Render.com cron job configuration
// cron: 0 */6 * * * (every 6 hours)
async function runBackup() {
  const backup = new BackupService(process.env.R2_WORKER_URL!, process.env.SERVER_BYPASS_TOKEN!)
  await backup.createBackup()
  console.log('Backup completed successfully')
}
```

## Retention Policy

```javascript
// R2 Lifecycle rules (configured in Cloudflare dashboard)
{
  rules: [
    {
      id: 'cleanup-hourly',
      status: 'Enabled',
      filter: { prefix: 'backups/full/' },
      expiration: { days: 30 },
    },
    {
      id: 'archive-daily',
      status: 'Enabled',
      filter: { prefix: 'backups/daily/' },
      transitions: [{ days: 90, storageClass: 'GLACIER' }],
      expiration: { days: 365 },
    },
  ]
}
```

## Monitoring

- CloudWatch alarms for backup failures
- Periodic restore tests (monthly)
- Storage usage dashboards
- Backup completion notifications
