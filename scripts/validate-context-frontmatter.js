#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('docs/context-library')
const TARGET_DIRS = ['product', 'context', 'templates', 'slugs'].map(dir =>
  path.join(ROOT, dir)
)
const EXCLUDE_DIRS = new Set(['.obsidian'])

const LINK_LIST_FIELDS = new Set([
  'ca-where-dependencies',
  'ca-where-dependents',
  'ca-where-components',
  'ca-why-strategy-links',
])

const LINK_FIELDS = new Set([
  'ca-where-zone',
  'ca-where-parent',
  'ca-why-pressure',
  'ca-why-signal',
])

const CA_WHEN_VALUES = new Set(['past', 'present', 'planned', 'future'])

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DATE_PLACEHOLDER = 'YYYY-MM-DD'

const errors = []

const isLink = value => /^\[\[[^\]]+\]\]$/.test(value)
const isLinkList = value =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .every(isLink)

const stripInlineComment = value => {
  if (!value) return ''
  let out = ''
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if (char === "'" && !inDouble) inSingle = !inSingle
    if (char === '"' && !inSingle) inDouble = !inDouble
    if (char === '#' && !inSingle && !inDouble) break
    out += char
  }
  return out.trimEnd()
}

const stripQuotes = value => {
  if (!value) return ''
  const trimmed = value.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

const isNullish = value => value === '' || value === 'null'

const walk = dir => {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue
      files.push(...walk(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(fullPath)
  }
  return files
}

const parseFrontmatter = text => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null
  return match[1]
}

for (const dir of TARGET_DIRS) {
  const files = walk(dir)
  for (const file of files) {
    const contents = fs.readFileSync(file, 'utf8')
    const frontmatter = parseFrontmatter(contents)
    if (!frontmatter) {
      errors.push({
        file,
        line: 1,
        message: 'Missing frontmatter block.',
      })
      continue
    }

    const lines = frontmatter.split(/\r?\n/)
    let currentKey = null

    const isTemplate = file.includes(`${path.sep}templates${path.sep}`)

    for (let i = 0; i < lines.length; i += 1) {
      const raw = lines[i]
      const lineNumber = i + 2 // account for opening --- on line 1
      if (!raw.trim()) continue

      const keyMatch = raw.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/)
      if (keyMatch) {
        currentKey = keyMatch[1]
        const rawValue = stripInlineComment(keyMatch[2] ?? '')
        const value = stripQuotes(rawValue.trim())

        if (LINK_LIST_FIELDS.has(currentKey)) {
          if (!isNullish(value) && !isLinkList(value)) {
            errors.push({
              file,
              line: lineNumber,
              message: `${currentKey} should be comma-separated wiki-links like [[a]], [[b]].`,
            })
          }
          continue
        }

        if (LINK_FIELDS.has(currentKey)) {
          if (!isNullish(value) && !isLink(value)) {
            errors.push({
              file,
              line: lineNumber,
              message: `${currentKey} should be a wiki-link like [[slug]] or blank/null.`,
            })
          }
          continue
        }

        if (currentKey === 'ca-when') {
          if (value && !CA_WHEN_VALUES.has(value)) {
            errors.push({
              file,
              line: lineNumber,
              message: 'ca-when must be one of past | present | planned | future.',
            })
          }
        }

        if (currentKey === 'last-verified') {
          const isValidDate = DATE_RE.test(value) || value === ''
          const isPlaceholder = value === DATE_PLACEHOLDER
          if (!isValidDate && !(isTemplate && isPlaceholder)) {
            errors.push({
              file,
              line: lineNumber,
              message: 'last-verified must be YYYY-MM-DD.',
            })
          }
        }

        continue
      }

      const listMatch = raw.match(/^\s*-\s*(.+)$/)
      if (listMatch) {
        const itemRaw = stripInlineComment(listMatch[1])
        const item = stripQuotes(itemRaw.trim())
        if (currentKey && LINK_LIST_FIELDS.has(currentKey)) {
          errors.push({
            file,
            line: lineNumber,
            message: `${currentKey} should be on one line with comma-separated links, not a list.`,
          })
        }
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    const relative = path.relative(process.cwd(), error.file)
    console.error(`${relative}:${error.line} ${error.message}`)
  }
  process.exit(1)
}

console.log('Context frontmatter OK.')
