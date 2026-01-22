#!/usr/bin/env node
/**
 * Context Library Frontmatter Linter
 *
 * Validates that markdown files in the context library have correctly
 * formatted YAML frontmatter matching their declared type.
 *
 * Usage:
 *   node scripts/lint-frontmatter.cjs [path]
 *
 * If no path provided, lints all .md files in the context library
 * (excluding templates, README, CONTRIBUTING, CONVENTIONS).
 *
 * No external dependencies required.
 */

const fs = require('fs');
const path = require('path');

// Valid values for ca-when
const VALID_CA_WHEN = ['past', 'present', 'planned', 'future'];

// Required fields by type
const REQUIRED_FIELDS = {
  feature: {
    root: ['title', 'type', 'ca-when', 'ca-where', 'ca-why', 'last-verified'],
    'ca-where': ['zone'],
    'ca-why': ['rationale'],
  },
  system: {
    root: ['title', 'type', 'ca-when', 'ca-where', 'ca-why', 'last-verified'],
    'ca-where': [],
    'ca-why': ['rationale'],
  },
  component: {
    root: ['title', 'type', 'ca-when', 'ca-where', 'last-verified'],
    'ca-where': ['zone', 'parent-feature'],
  },
  zone: {
    root: ['title', 'type', 'ca-when', 'ca-where', 'ca-why', 'last-verified'],
    'ca-where': [],
    'ca-why': ['rationale'],
  },
  strategy: {
    root: ['title', 'type', 'ca-when', 'ca-why', 'last-verified'],
    'ca-why': ['rationale'],
  },
  pressure: {
    root: ['title', 'type', 'ca-when', 'last-verified'],
  },
  signal: {
    root: ['title', 'type', 'ca-when', 'last-verified'],
  },
  learning: {
    root: ['title', 'type', 'ca-when', 'last-verified'],
  },
  vision: {
    root: ['title', 'type', 'ca-when', 'last-verified'],
  },
};

// Patterns for valid wikilinks
const WIKILINK_PATTERN = /^\[\[[\w-]+\]\]$/;
const WIKILINK_WITH_CONTEXT_PATTERN = /^\[\[[\w-]+\]\](\s*—\s*.+)?$/;

/**
 * Simple YAML frontmatter parser
 * Handles the subset of YAML used in context library frontmatter
 */
function parseYamlFrontmatter(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n');
  const stack = [{ obj: result, indent: -1 }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    // Calculate indent level
    const indent = line.search(/\S/);
    if (indent === -1) continue;

    // Pop stack to find parent at appropriate indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const trimmed = line.trim();
    const parent = stack[stack.length - 1].obj;

    // Array item: "- value"
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      // Find the array key from parent
      const parentKeys = Object.keys(parent);
      const lastKey = parentKeys[parentKeys.length - 1];
      if (lastKey && Array.isArray(parent[lastKey])) {
        parent[lastKey].push(parseValue(value));
      }
      continue;
    }

    // Key-value pair: "key: value"
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const rawValue = trimmed.slice(colonIndex + 1).trim();

    if (rawValue === '' || rawValue === '|' || rawValue === '>') {
      // Nested object or empty - look at next line to determine
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.trim().startsWith('- ')) {
        // It's an array
        parent[key] = [];
        stack.push({ obj: parent, indent, key });
      } else {
        // It's a nested object
        parent[key] = {};
        stack.push({ obj: parent[key], indent });
      }
    } else {
      parent[key] = parseValue(rawValue);
    }
  }

  return result;
}

/**
 * Parse a YAML value (handles strings, nulls, booleans)
 */
function parseValue(str) {
  if (str === 'null' || str === '~') return null;
  if (str === 'true') return true;
  if (str === 'false') return false;

  // Remove quotes if present
  if ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }

  return str;
}

class FrontmatterLinter {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.filesChecked = 0;
  }

  /**
   * Extract frontmatter from markdown content
   */
  extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    try {
      return parseYamlFrontmatter(match[1]);
    } catch (e) {
      return { _parseError: e.message };
    }
  }

  /**
   * Validate a single file
   */
  lintFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    const frontmatter = this.extractFrontmatter(content);

    if (!frontmatter) {
      this.errors.push({ file: relativePath, message: 'No frontmatter found' });
      return;
    }

    if (frontmatter._parseError) {
      this.errors.push({ file: relativePath, message: `YAML parse error: ${frontmatter._parseError}` });
      return;
    }

    this.filesChecked++;

    // Check type exists
    if (!frontmatter.type) {
      this.errors.push({ file: relativePath, message: 'Missing required field: type' });
      return;
    }

    const type = frontmatter.type;
    const requirements = REQUIRED_FIELDS[type];

    if (!requirements) {
      this.warnings.push({ file: relativePath, message: `Unknown type: ${type}` });
      return;
    }

    // Check root-level required fields
    for (const field of requirements.root) {
      if (frontmatter[field] === undefined) {
        this.errors.push({ file: relativePath, message: `Missing required field: ${field}` });
      }
    }

    // Check ca-when value
    if (frontmatter['ca-when'] && !VALID_CA_WHEN.includes(frontmatter['ca-when'])) {
      this.errors.push({
        file: relativePath,
        message: `Invalid ca-when value: "${frontmatter['ca-when']}" (must be one of: ${VALID_CA_WHEN.join(', ')})`
      });
    }

    // Check nested required fields
    if (requirements['ca-where'] && frontmatter['ca-where']) {
      for (const field of requirements['ca-where']) {
        if (frontmatter['ca-where'][field] === undefined) {
          this.errors.push({ file: relativePath, message: `Missing required field: ca-where.${field}` });
        }
      }
    }

    if (requirements['ca-why'] && frontmatter['ca-why']) {
      for (const field of requirements['ca-why']) {
        if (frontmatter['ca-why'][field] === undefined) {
          this.errors.push({ file: relativePath, message: `Missing required field: ca-why.${field}` });
        }
      }
    }

    // Check last-verified is a valid date format
    if (frontmatter['last-verified']) {
      const dateStr = String(frontmatter['last-verified']);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        this.errors.push({
          file: relativePath,
          message: `Invalid last-verified format: "${dateStr}" (must be YYYY-MM-DD)`
        });
      }
    }

    // Validate wikilink format in arrays
    this.validateWikilinks(frontmatter, relativePath);
  }

  /**
   * Recursively check that wikilink-like values are properly formatted
   */
  validateWikilinks(obj, filePath, keyPath = '') {
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        if (typeof item === 'string' && item.includes('[[')) {
          // Should be a valid wikilink
          if (!WIKILINK_PATTERN.test(item) && !WIKILINK_WITH_CONTEXT_PATTERN.test(item)) {
            this.warnings.push({
              file: filePath,
              message: `Malformed wikilink at ${keyPath}[${i}]: "${item}"`
            });
          }
        } else if (typeof item === 'object' && item !== null) {
          this.validateWikilinks(item, filePath, `${keyPath}[${i}]`);
        }
      });
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = keyPath ? `${keyPath}.${key}` : key;
        if (typeof value === 'string' && value.includes('[[')) {
          if (!WIKILINK_PATTERN.test(value) && !WIKILINK_WITH_CONTEXT_PATTERN.test(value)) {
            this.warnings.push({
              file: filePath,
              message: `Malformed wikilink at ${newPath}: "${value}"`
            });
          }
        } else if (typeof value === 'object' && value !== null) {
          this.validateWikilinks(value, filePath, newPath);
        }
      }
    }
  }

  /**
   * Find all markdown files to lint
   */
  findMarkdownFiles(dir) {
    const files = [];
    const skipDirs = ['templates', 'scripts', '.obsidian'];
    const skipFiles = ['README.md', 'CONTRIBUTING.md', 'CONVENTIONS.md'];

    const walk = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!skipDirs.includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          if (!skipFiles.includes(entry.name)) {
            files.push(fullPath);
          }
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * Run the linter
   */
  run(targetPath) {
    let files;

    if (targetPath) {
      const resolved = path.resolve(targetPath);
      const stats = fs.statSync(resolved);
      if (stats.isDirectory()) {
        files = this.findMarkdownFiles(resolved);
      } else {
        files = [resolved];
      }
    } else {
      // Default to context-library directory
      const contextLibrary = path.join(__dirname, '..');
      files = this.findMarkdownFiles(contextLibrary);
    }

    if (files.length === 0) {
      console.log('No markdown files found to lint.');
      return 0;
    }

    for (const file of files) {
      this.lintFile(file);
    }

    // Report results
    console.log(`\n📋 Context Library Frontmatter Lint\n`);
    console.log(`Files checked: ${this.filesChecked}`);

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All files passed validation!\n');
      return 0;
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):\n`);
      for (const err of this.errors) {
        console.log(`  ${err.file}`);
        console.log(`    → ${err.message}\n`);
      }
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):\n`);
      for (const warn of this.warnings) {
        console.log(`  ${warn.file}`);
        console.log(`    → ${warn.message}\n`);
      }
    }

    return this.errors.length > 0 ? 1 : 0;
  }
}

const linter = new FrontmatterLinter();
const exitCode = linter.run(process.argv[2]);
process.exit(exitCode);
