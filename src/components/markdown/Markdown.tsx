import React from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ gfm: true, breaks: true })

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'blockquote',
]
const ALLOWED_ATTR = ['href']

interface MarkdownProps {
  content: string
}

export const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  const html = React.useMemo(() => {
    const raw = marked.parse(content) as string
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    })
  }, [content])

  return <div className='prose prose-sm max-w-none' dangerouslySetInnerHTML={{ __html: html }} />
}
