import React from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import { useFileNavigation } from '../../hooks/useFileNavigation.js'

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
  onFileNavigate,
}) => {
  const [htmlContent, setHtmlContent] = React.useState<string>('')
  const { navigateToFile, getFilePathDisplay } = useFileNavigation()
  const [chorusElements, setChorusElements] = React.useState<Map<string, string>>(new Map())

  React.useEffect(() => {
    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text: string) => {
      const textarea = document.createElement('textarea')
      textarea.innerHTML = text
      return textarea.value
    }

    // Process CHORUS_TAG elements and replace with placeholders
    const processChorusTags = (text: string) => {
      const chorusTagRegex = /<CHORUS_TAG>(.*?)<\/CHORUS_TAG>/g
      const newChorusElements = new Map<string, string>()
      let match
      let processedText = text

      while ((match = chorusTagRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const filePath = match[1]

        // Skip if no file path found
        if (!filePath) continue

        const uniqueId = `chorus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Store the mapping
        newChorusElements.set(uniqueId, filePath)

        // Replace with placeholder that will survive markdown processing
        const placeholder = `__CHORUS_PLACEHOLDER_${uniqueId}__`
        processedText = processedText.replace(fullMatch, placeholder)
      }

      setChorusElements(newChorusElements)
      return processedText
    }

    const processMarkdown = () => {
      try {
        // First, process CHORUS_TAG elements and replace with placeholders
        const processedContent = processChorusTags(content)
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
          ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-chorus-id', 'data-file-path'],
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

        // Replace CHORUS placeholders with clickable spans
        const finalHtmlWithChorus = safeHtml.replace(
          /__CHORUS_PLACEHOLDER_([^_]+)__/g,
          (match, uniqueId) => {
            const filePath = chorusElements.get(uniqueId)
            if (!filePath) return match

            const display = getFilePathDisplay(filePath)
            return `<span class="chorus-file-link ${display.className}" data-chorus-id="${uniqueId}" data-file-path="${filePath}" title="${display.tooltip}">${display.icon} ${filePath}</span>`
          }
        )

        setHtmlContent(finalHtmlWithChorus)
      } catch (error) {
        console.error('Error processing markdown:', error)
        // Fallback to plain text
        setHtmlContent(DOMPurify.sanitize(content))
      }
    }

    processMarkdown()
  }, [content, chorusElements, getFilePathDisplay])

  // Handle clicks on CHORUS file links
  const handleChorusClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement
      if (target.classList.contains('chorus-file-link') || target.closest('.chorus-file-link')) {
        const linkElement = target.classList.contains('chorus-file-link')
          ? target
          : target.closest('.chorus-file-link')
        if (linkElement) {
          const filePath = linkElement.getAttribute('data-file-path')
          if (filePath) {
            if (onFileNavigate) {
              onFileNavigate(filePath)
            } else {
              navigateToFile(filePath)
            }
          }
        }
      }
    },
    [onFileNavigate, navigateToFile]
  )

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      onClick={handleChorusClick}
    />
  )
}
