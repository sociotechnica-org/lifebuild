import React from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

// Configure marked for better rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

interface MarkdownRendererProps {
  content: string
  className?: string
  onFileNavigate?: (filePath: string, options?: { documentId?: string; projectId?: string }) => void
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  onFileNavigate, // eslint-disable-line @typescript-eslint/no-unused-vars -- kept for future implementation
}) => {
  const [htmlContent, setHtmlContent] = React.useState<string>('')

  React.useEffect(() => {
    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text: string) => {
      const textarea = document.createElement('textarea')
      textarea.innerHTML = text
      return textarea.value
    }

    const processMarkdown = () => {
      try {
        // Process CHORUS_TAG elements with proper data attributes for click handling
        const processedContent = content.replace(
          /<CHORUS_TAG>(.*?)<\/CHORUS_TAG>/g,
          (match, filePath) => {
            if (!filePath) return match
            // Add data attributes for safe event delegation
            const escapedPath = filePath.replace(/"/g, '&quot;')
            return `<span class="chorus-file-link" data-file-path="${escapedPath}" data-chorus="true">${filePath}</span>`
          }
        )

        const rawHtml = marked(processedContent) as string

        // Apply syntax highlighting to code blocks
        const highlightedHtml = rawHtml.replace(
          /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
          (_match: string, lang: string, code: string) => {
            // Decode HTML entities before highlighting
            const decodedCode = decodeHtmlEntities(code)

            if (hljs.getLanguage(lang)) {
              try {
                const highlighted = hljs.highlight(decodedCode, { language: lang }).value
                return `<pre><code class="language-${lang} hljs">${highlighted}</code></pre>`
              } catch {
                // Fall back to auto-highlighting
                const autoHighlighted = hljs.highlightAuto(decodedCode).value
                return `<pre><code class="hljs">${autoHighlighted}</code></pre>`
              }
            }
            // Auto-highlight if language not recognized
            const autoHighlighted = hljs.highlightAuto(decodedCode).value
            return `<pre><code class="hljs">${autoHighlighted}</code></pre>`
          }
        )

        // Apply highlighting to inline code without language
        const finalHtml = highlightedHtml.replace(
          /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
          (_match: string, code: string) => {
            // Decode HTML entities before highlighting
            const decodedCode = decodeHtmlEntities(code)
            const highlighted = hljs.highlightAuto(decodedCode).value
            return `<pre><code class="hljs">${highlighted}</code></pre>`
          }
        )

        // Sanitize HTML to prevent XSS attacks
        const cleanHtml = DOMPurify.sanitize(finalHtml, {
          // Allow common markdown elements but be restrictive
          ALLOWED_TAGS: [
            'p',
            'br',
            'strong',
            'b',
            'em',
            'i',
            'u',
            'code',
            'pre',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'ul',
            'ol',
            'li',
            'blockquote',
            'a',
            'span',
            'div',
            'table',
            'thead',
            'tbody',
            'tr',
            'th',
            'td',
            'hr',
          ],
          ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-file-path', 'data-chorus'],
          // Force external links to open in new tab with security attributes
          FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
          FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
        })

        // Add target="_blank" and security attributes to links
        const safeHtml = cleanHtml.replace(/<a([^>]*)>/gi, (match, attributes) => {
          // Check if target or rel attributes already exist
          const hasTarget = /\btarget\s*=/i.test(attributes)
          const hasRel = /\brel\s*=/i.test(attributes)

          let newAttributes = attributes

          // Add target="_blank" if not present
          if (!hasTarget) {
            newAttributes += ' target="_blank"'
          }

          // Add or update rel attribute
          if (!hasRel) {
            newAttributes += ' rel="noopener noreferrer"'
          } else {
            // If rel exists, ensure it includes noopener noreferrer
            newAttributes = newAttributes.replace(
              /\brel\s*=\s*"([^"]*)"/i,
              (_relMatch: string, relValue: string) => {
                const relParts = relValue.split(/\s+/).filter(Boolean)
                if (!relParts.includes('noopener')) relParts.push('noopener')
                if (!relParts.includes('noreferrer')) relParts.push('noreferrer')
                return `rel="${relParts.join(' ')}"`
              }
            )
          }

          return `<a${newAttributes}>`
        })

        setHtmlContent(safeHtml)
      } catch (error) {
        console.error('Error processing markdown:', error)
        // Fallback to plain text
        setHtmlContent(DOMPurify.sanitize(content))
      }
    }

    processMarkdown()
  }, [content])

  // TODO: Add click handling for CHORUS elements in a future iteration
  // For now, CHORUS elements are styled as clickable but don't have functionality
  // This prevents any interference with existing navigation

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
