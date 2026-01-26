import { describe, it, expect } from 'vitest'
import {
  extractChangelogSection,
  extractBulletPoints,
  hasUserFacingChanges,
  bumpPatchVersion,
  formatDate,
  processChangelog,
  generateChangelogFileContent,
  generateChangelogFilename,
} from './changelog-automation.js'

describe('extractChangelogSection', () => {
  it('returns null for empty body', () => {
    expect(extractChangelogSection('')).toBeNull()
    expect(extractChangelogSection(null)).toBeNull()
    expect(extractChangelogSection(undefined)).toBeNull()
  })

  it('extracts simple changelog section', () => {
    const body = `## Summary
Some summary here

## Changelog
- Add feature X
- Fix bug Y

## Other Section
More content`

    const result = extractChangelogSection(body)
    expect(result).toContain('## Changelog')
    expect(result).toContain('- Add feature X')
    expect(result).toContain('- Fix bug Y')
    expect(result).not.toContain('## Other Section')
  })

  it('extracts changelog at end of body', () => {
    const body = `## Summary
Some summary

## Changelog
- Add feature`

    const result = extractChangelogSection(body)
    expect(result).toContain('- Add feature')
  })

  it('is case insensitive', () => {
    const body = `## CHANGELOG
- Add feature`

    const result = extractChangelogSection(body)
    expect(result).toContain('- Add feature')
  })

  it('removes HTML comments from changelog section', () => {
    const body = `## Changelog
<!-- Example entries:
- Add dark mode
- Fix login bug
-->
- Actual change here`

    const result = extractChangelogSection(body)
    expect(result).toContain('- Actual change here')
    expect(result).not.toContain('Add dark mode')
    expect(result).not.toContain('Fix login bug')
  })

  it('handles multiple HTML comments', () => {
    const body = `## Changelog
<!-- comment 1 -->
- Real entry
<!-- comment 2 -->`

    const result = extractChangelogSection(body)
    expect(result).toContain('- Real entry')
    expect(result).not.toContain('comment 1')
    expect(result).not.toContain('comment 2')
  })
})

describe('extractBulletPoints', () => {
  it('returns empty array for null/empty input', () => {
    expect(extractBulletPoints(null)).toEqual([])
    expect(extractBulletPoints('')).toEqual([])
    expect(extractBulletPoints(undefined)).toEqual([])
  })

  it('extracts simple bullet points', () => {
    const section = `## Changelog
- Add feature X
- Fix bug Y`

    const result = extractBulletPoints(section)
    expect(result).toEqual(['Add feature X', 'Fix bug Y'])
  })

  it('filters out empty entries', () => {
    const section = `## Changelog
-
-
- Actual entry
-    `

    const result = extractBulletPoints(section)
    expect(result).toEqual(['Actual entry'])
  })

  it('trims whitespace from entries', () => {
    const section = `- Entry with spaces
-   Leading spaces`

    const result = extractBulletPoints(section)
    expect(result).toEqual(['Entry with spaces', 'Leading spaces'])
  })

  it('handles entries with special characters', () => {
    const section = `- Fix user's profile bug
- Add "dark mode" feature
- Handle apostrophe's correctly`

    const result = extractBulletPoints(section)
    expect(result).toHaveLength(3)
    expect(result[0]).toBe("Fix user's profile bug")
    expect(result[1]).toBe('Add "dark mode" feature')
  })
})

describe('hasUserFacingChanges', () => {
  it('returns false for empty array', () => {
    expect(hasUserFacingChanges([])).toBe(false)
    expect(hasUserFacingChanges(null)).toBe(false)
    expect(hasUserFacingChanges(undefined)).toBe(false)
  })

  it('returns true for regular entries', () => {
    expect(hasUserFacingChanges(['Add feature'])).toBe(true)
    expect(hasUserFacingChanges(['Fix bug', 'Add feature'])).toBe(true)
  })

  it('returns false for "no user-facing changes" only', () => {
    expect(hasUserFacingChanges(['No user-facing changes'])).toBe(false)
    expect(hasUserFacingChanges(['no user-facing changes'])).toBe(false)
    expect(hasUserFacingChanges(['NO USER-FACING CHANGES'])).toBe(false)
  })

  it('returns true if mixed with real changes', () => {
    expect(hasUserFacingChanges(['No user-facing changes', 'Add feature'])).toBe(true)
  })
})

describe('bumpPatchVersion', () => {
  it('bumps simple patch version', () => {
    expect(bumpPatchVersion('0.1.0')).toBe('0.1.1')
    expect(bumpPatchVersion('1.2.3')).toBe('1.2.4')
    expect(bumpPatchVersion('0.0.0')).toBe('0.0.1')
  })

  it('handles prerelease versions', () => {
    expect(bumpPatchVersion('0.1.0-beta')).toBe('0.1.1')
    expect(bumpPatchVersion('1.2.3-alpha.1')).toBe('1.2.4')
    expect(bumpPatchVersion('0.1.0-rc.1+build.123')).toBe('0.1.1')
  })

  it('handles large patch numbers', () => {
    expect(bumpPatchVersion('0.1.99')).toBe('0.1.100')
    expect(bumpPatchVersion('0.1.999')).toBe('0.1.1000')
  })

  it('throws for invalid version format', () => {
    expect(() => bumpPatchVersion('0.1')).toThrow('Invalid version format')
    expect(() => bumpPatchVersion('invalid')).toThrow('Invalid version format')
  })

  it('defaults to 1 if no numeric patch found', () => {
    expect(bumpPatchVersion('0.1.beta')).toBe('0.1.1')
  })
})

describe('formatDate', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(formatDate('2024-01-15T12:00:00Z')).toBe('2024-01-15')
    expect(formatDate(new Date('2024-06-30'))).toBe('2024-06-30')
  })
})

describe('processChangelog', () => {
  const baseOptions = {
    prNumber: 123,
    prTitle: 'Test PR',
    prUrl: 'https://github.com/org/repo/pull/123',
    mergedAt: '2024-01-15T12:00:00Z',
    currentVersion: '0.1.0',
  }

  it('returns skip=true when no changelog section', () => {
    const result = processChangelog({
      ...baseOptions,
      prBody: '## Summary\nJust a summary',
    })

    expect(result.skip).toBe(true)
    expect(result.noChangelog).toBe(true)
    expect(result.emptyChangelog).toBe(false)
    expect(result.changelogEntry).toBeNull()
  })

  it('returns skip=true when changelog section is empty', () => {
    const result = processChangelog({
      ...baseOptions,
      prBody: '## Changelog\n\n## Other',
    })

    expect(result.skip).toBe(true)
    expect(result.noChangelog).toBe(false)
    expect(result.emptyChangelog).toBe(true)
  })

  it('processes user-facing changes correctly', () => {
    const result = processChangelog({
      ...baseOptions,
      prBody: `## Changelog
- Add new feature
- Fix important bug`,
    })

    expect(result.skip).toBe(false)
    expect(result.noChangelog).toBe(false)
    expect(result.emptyChangelog).toBe(false)
    expect(result.hasUserFacingChanges).toBe(true)
    expect(result.newVersion).toBe('0.1.1')
    expect(result.changelogEntry.entries).toEqual(['Add new feature', 'Fix important bug'])
  })

  it('does not bump version for non-user-facing changes', () => {
    const result = processChangelog({
      ...baseOptions,
      prBody: `## Changelog
- No user-facing changes`,
    })

    expect(result.skip).toBe(false)
    expect(result.hasUserFacingChanges).toBe(false)
    expect(result.newVersion).toBe('0.1.0')
    expect(result.changelogEntry.entries).toEqual([])
  })

  it('filters out "no user-facing changes" from entries', () => {
    const result = processChangelog({
      ...baseOptions,
      prBody: `## Changelog
- No user-facing changes
- Add actual feature`,
    })

    expect(result.hasUserFacingChanges).toBe(true)
    expect(result.changelogEntry.entries).toEqual(['Add actual feature'])
  })

  it('handles HTML comments in PR body', () => {
    const result = processChangelog({
      ...baseOptions,
      prBody: `## Changelog
<!-- Example: - Add dark mode -->
- Real change here`,
    })

    expect(result.changelogEntry.entries).toEqual(['Real change here'])
  })

  it('handles apostrophes and quotes in entries', () => {
    const result = processChangelog({
      ...baseOptions,
      prBody: `## Changelog
- Fix user's profile page
- Add "quick add" feature`,
    })

    expect(result.changelogEntry.entries).toHaveLength(2)
    expect(result.changelogEntry.entries[0]).toBe("Fix user's profile page")
  })
})

describe('generateChangelogFileContent', () => {
  it('generates correct markdown with frontmatter', () => {
    const entry = {
      version: '0.1.1',
      date: '2024-01-15',
      prNumber: 123,
      prUrl: 'https://github.com/org/repo/pull/123',
      entries: ['Add feature', 'Fix bug'],
    }

    const content = generateChangelogFileContent(entry)

    expect(content).toContain('version: "0.1.1"')
    expect(content).toContain('date: "2024-01-15"')
    expect(content).toContain('prNumber: 123')
    expect(content).toContain('# v0.1.1')
    expect(content).toContain('- Add feature')
    expect(content).toContain('- Fix bug')
    expect(content).toContain('[View PR #123]')
  })
})

describe('generateChangelogFilename', () => {
  it('generates correct filename', () => {
    const entry = { date: '2024-01-15', version: '0.1.1' }
    expect(generateChangelogFilename(entry)).toBe('2024-01-15-v0-1-1.md')
  })

  it('handles versions with many parts', () => {
    const entry = { date: '2024-01-15', version: '1.2.3' }
    expect(generateChangelogFilename(entry)).toBe('2024-01-15-v1-2-3.md')
  })
})
