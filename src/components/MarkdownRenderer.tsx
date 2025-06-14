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
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [htmlContent, setHtmlContent] = React.useState<string>('')

  React.useEffect(() => {
    const processMarkdown = async () => {
      try {
        const rawHtml = await marked(content)

        // Apply syntax highlighting to code blocks
        const highlightedHtml = rawHtml.replace(
          /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
          (match, lang, code) => {
            if (hljs.getLanguage(lang)) {
              try {
                const highlighted = hljs.highlight(code, { language: lang }).value
                return `<pre><code class="language-${lang} hljs">${highlighted}</code></pre>`
              } catch {
                // Fall back to auto-highlighting
                const autoHighlighted = hljs.highlightAuto(code).value
                return `<pre><code class="hljs">${autoHighlighted}</code></pre>`
              }
            }
            // Auto-highlight if language not recognized
            const autoHighlighted = hljs.highlightAuto(code).value
            return `<pre><code class="hljs">${autoHighlighted}</code></pre>`
          }
        )

        // Apply highlighting to inline code without language
        const finalHtml = highlightedHtml.replace(
          /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
          (match, code) => {
            const highlighted = hljs.highlightAuto(code).value
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
          ],
          ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
          // Force external links to open in new tab with security attributes
          FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
          FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
        })

        // Add target="_blank" and security attributes to links
        const safeHtml = cleanHtml.replace(
          /<a\s+href="([^"]*)"([^>]*)>/gi,
          '<a href="$1"$2 target="_blank" rel="noopener noreferrer">'
        )

        setHtmlContent(safeHtml)
      } catch (error) {
        console.error('Error processing markdown:', error)
        // Fallback to plain text
        setHtmlContent(DOMPurify.sanitize(content))
      }
    }

    processMarkdown()
  }, [content])

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
