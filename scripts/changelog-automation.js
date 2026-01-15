#!/usr/bin/env node

/**
 * Changelog Automation Script
 *
 * Extracts changelog entries from PR descriptions and computes version bumps.
 * Used by the update-changelog GitHub Action.
 *
 * Usage:
 *   node scripts/changelog-automation.js
 *
 * Environment variables:
 *   PR_BODY - The PR description body
 *   PR_NUMBER - The PR number
 *   PR_TITLE - The PR title
 *   PR_URL - The PR URL
 *   MERGED_AT - ISO timestamp when PR was merged
 *   CURRENT_VERSION - Current version from package.json
 *
 * Outputs (written to GITHUB_OUTPUT if available, otherwise stdout):
 *   skip - 'true' if no changelog processing needed
 *   no_changelog - 'true' if no changelog section found
 *   changelog_entry - JSON string of the changelog entry
 *   new_version - The new version after bump
 *   current_version - The current version
 *   has_user_facing_changes - 'true' if has user-facing changes
 */

import fs from 'fs'
import { fileURLToPath } from 'url'

/**
 * Extract the changelog section from a PR body
 * @param {string} prBody - The PR description body
 * @returns {string|null} - The changelog section content or null if not found
 */
export function extractChangelogSection(prBody) {
  if (!prBody) return null

  const match = prBody.match(/## Changelog[\s\S]*?(?=\n## |$)/i)
  if (!match) return null

  // Remove HTML comments (which may contain example entries from PR template)
  return match[0].replace(/<!--[\s\S]*?-->/g, '')
}

/**
 * Extract bullet point entries from a changelog section
 * @param {string} changelogSection - The changelog section content
 * @returns {string[]} - Array of changelog entry strings
 */
export function extractBulletPoints(changelogSection) {
  if (!changelogSection) return []

  const bulletPoints = changelogSection.match(/^- .+$/gm) || []

  return bulletPoints
    .map(point => point.replace(/^- /, '').trim())
    .filter(entry => entry.length > 0 && entry !== '-')
}

/**
 * Check if entries contain user-facing changes
 * @param {string[]} entries - Array of changelog entries
 * @returns {boolean} - True if has user-facing changes
 */
export function hasUserFacingChanges(entries) {
  if (!entries || entries.length === 0) return false

  return !entries.every(entry => entry.toLowerCase() === 'no user-facing changes')
}

/**
 * Bump the patch version, handling prerelease suffixes
 * @param {string} version - Current version string (e.g., "0.1.0" or "0.1.0-beta")
 * @returns {string} - New version with bumped patch number
 */
export function bumpPatchVersion(version) {
  const parts = version.split('.')
  if (parts.length < 3) {
    throw new Error(`Invalid version format: ${version}`)
  }

  // Extract numeric portion of patch version (before any - or +)
  const patchMatch = parts[2].match(/^(\d+)/)
  if (patchMatch) {
    const numericPatch = Number(patchMatch[1]) + 1
    parts[2] = String(numericPatch)
  } else {
    // Fallback: if no numeric patch found, default to 1
    parts[2] = '1'
  }

  // Only return major.minor.patch (drop any prerelease suffix parts that might have been split)
  return parts.slice(0, 3).join('.')
}

/**
 * Format a date as YYYY-MM-DD
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

/**
 * Process a PR and extract changelog information
 * @param {Object} options - Processing options
 * @param {string} options.prBody - PR description body
 * @param {number} options.prNumber - PR number
 * @param {string} options.prTitle - PR title
 * @param {string} options.prUrl - PR URL
 * @param {string} options.mergedAt - ISO timestamp when merged
 * @param {string} options.currentVersion - Current version from package.json
 * @returns {Object} - Result object with changelog data
 */
export function processChangelog({ prBody, prNumber, prTitle, prUrl, mergedAt, currentVersion }) {
  const changelogSection = extractChangelogSection(prBody)

  if (!changelogSection) {
    return {
      skip: true,
      noChangelog: true,
      changelogEntry: null,
      newVersion: currentVersion,
      currentVersion,
      hasUserFacingChanges: false,
    }
  }

  const entries = extractBulletPoints(changelogSection)

  if (entries.length === 0) {
    return {
      skip: true,
      noChangelog: true,
      changelogEntry: null,
      newVersion: currentVersion,
      currentVersion,
      hasUserFacingChanges: false,
    }
  }

  const userFacing = hasUserFacingChanges(entries)
  const newVersion = userFacing ? bumpPatchVersion(currentVersion) : currentVersion
  const formattedDate = formatDate(mergedAt)

  const changelogEntry = {
    version: newVersion,
    date: formattedDate,
    prNumber,
    prUrl,
    prTitle,
    entries: userFacing ? entries.filter(e => e.toLowerCase() !== 'no user-facing changes') : [],
    hasUserFacingChanges: userFacing,
  }

  return {
    skip: false,
    noChangelog: false,
    changelogEntry,
    newVersion,
    currentVersion,
    hasUserFacingChanges: userFacing,
  }
}

/**
 * Generate changelog file content (markdown with YAML frontmatter)
 * @param {Object} changelogEntry - The changelog entry object
 * @returns {string} - The file content
 */
export function generateChangelogFileContent(changelogEntry) {
  return `---
version: "${changelogEntry.version}"
date: "${changelogEntry.date}"
prNumber: ${changelogEntry.prNumber}
prUrl: "${changelogEntry.prUrl}"
---

# v${changelogEntry.version}

${changelogEntry.entries.map(entry => `- ${entry}`).join('\n')}

[View PR #${changelogEntry.prNumber}](${changelogEntry.prUrl})
`
}

/**
 * Generate the changelog filename
 * @param {Object} changelogEntry - The changelog entry object
 * @returns {string} - The filename
 */
export function generateChangelogFilename(changelogEntry) {
  return `${changelogEntry.date}-v${changelogEntry.version.replace(/\./g, '-')}.md`
}

/**
 * Write output for GitHub Actions
 * @param {string} name - Output name
 * @param {string} value - Output value
 */
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT

  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`)
  } else {
    console.log(`${name}=${value}`)
  }
}

// Main execution when run directly
const isMain = process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  const prBody = process.env.PR_BODY || ''
  const prNumber = parseInt(process.env.PR_NUMBER || '0', 10)
  const prTitle = process.env.PR_TITLE || ''
  const prUrl = process.env.PR_URL || ''
  const mergedAt = process.env.MERGED_AT || new Date().toISOString()
  const currentVersion = process.env.CURRENT_VERSION || '0.0.0'

  const result = processChangelog({
    prBody,
    prNumber,
    prTitle,
    prUrl,
    mergedAt,
    currentVersion,
  })

  setOutput('skip', result.skip.toString())
  setOutput('no_changelog', result.noChangelog.toString())
  setOutput('new_version', result.newVersion)
  setOutput('current_version', result.currentVersion)
  setOutput('has_user_facing_changes', result.hasUserFacingChanges.toString())

  if (result.changelogEntry) {
    setOutput('changelog_entry', JSON.stringify(result.changelogEntry))
  }

  // Log for debugging
  console.error('Changelog processing result:', JSON.stringify(result, null, 2))
}
