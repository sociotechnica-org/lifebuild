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

const isLink = value => /^\[\[[^\]]+\]\]$/.test(value)

const formatLinkList = items => {
  const links = items.filter(Boolean)
  if (links.length === 0) return ''
  return `'${links.join(', ')}'`
}

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

const replaceFrontmatter = (text, newFrontmatter) =>
  text.replace(/^---\r?\n([\s\S]*?)\r?\n---/, `---\n${newFrontmatter}\n---`)

const files = TARGET_DIRS.flatMap(dir => walk(dir))

for (const file of files) {
  const contents = fs.readFileSync(file, 'utf8')
  const frontmatter = parseFrontmatter(contents)
  if (!frontmatter) continue

  const lines = frontmatter.split(/\r?\n/)
  const out = []
  let currentKey = null

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]
    const keyMatch = raw.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/)

    if (keyMatch) {
      currentKey = keyMatch[1]
      const rawValue = stripInlineComment(keyMatch[2] ?? '')
      const value = stripQuotes(rawValue.trim())

      if (LINK_LIST_FIELDS.has(currentKey)) {
        const listItems = []
        if (value && value !== '[]') {
          const items = value
            .split(',')
            .map(item => stripQuotes(item.trim()))
            .filter(Boolean)
          for (const item of items) {
            if (isLink(item)) listItems.push(item)
          }
        }

        let j = i + 1
        while (j < lines.length && lines[j].match(/^\s*-\s+/)) {
          const itemRaw = stripInlineComment(lines[j].replace(/^\s*-\s+/, ''))
          const item = stripQuotes(itemRaw.trim())
          if (isLink(item)) listItems.push(item)
          j += 1
        }

        const formatted = formatLinkList(listItems)
        out.push(`${currentKey}:${formatted ? ' ' + formatted : ''}`)
        i = j - 1
        continue
      }

      out.push(raw)
      continue
    }

    if (currentKey && LINK_LIST_FIELDS.has(currentKey) && raw.match(/^\s*-\s+/)) {
      continue
    }

    out.push(raw)
  }

  const nextFrontmatter = out.join('\n')
  if (nextFrontmatter !== frontmatter) {
    const nextContents = replaceFrontmatter(contents, nextFrontmatter)
    fs.writeFileSync(file, nextContents, 'utf8')
  }
}
