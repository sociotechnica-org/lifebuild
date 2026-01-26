import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MarkdownRenderer } from './MarkdownRenderer.js'

describe('MarkdownRenderer', () => {
  describe('CHORUS_TAG processing', () => {
    it('should render CHORUS_TAG with path attribute as clickable span', () => {
      const content = 'Click here: <CHORUS_TAG path="project:abc123">View project</CHORUS_TAG>'

      render(<MarkdownRenderer content={content} />)

      const link = screen.getByText('View project')
      expect(link).toBeInTheDocument()
      expect(link).toHaveClass('chorus-file-link')
      expect(link).toHaveAttribute('data-chorus', 'true')
      expect(link).toHaveAttribute('data-file-path', 'project:abc123')
    })

    it('should render CHORUS_TAG with drafting-stage1 path', () => {
      const content =
        'Start planning: <CHORUS_TAG path="drafting-stage1:uuid-123">Start planning →</CHORUS_TAG>'

      render(<MarkdownRenderer content={content} />)

      const link = screen.getByText('Start planning →')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('data-file-path', 'drafting-stage1:uuid-123')
      expect(link).toHaveAttribute('data-chorus', 'true')
    })

    it('should render CHORUS_TAG with drafting-stage2 path', () => {
      const content =
        '<CHORUS_TAG path="drafting-stage2:my-project-id">Continue to Stage 2 →</CHORUS_TAG>'

      render(<MarkdownRenderer content={content} />)

      const link = screen.getByText('Continue to Stage 2 →')
      expect(link).toHaveAttribute('data-file-path', 'drafting-stage2:my-project-id')
    })

    it('should render CHORUS_TAG with drafting-stage3 path', () => {
      const content = '<CHORUS_TAG path="drafting-stage3:xyz">Detail project</CHORUS_TAG>'

      render(<MarkdownRenderer content={content} />)

      const link = screen.getByText('Detail project')
      expect(link).toHaveAttribute('data-file-path', 'drafting-stage3:xyz')
    })

    it('should handle CHORUS_TAG with single quotes in path attribute', () => {
      const content = "<CHORUS_TAG path='project:single-quote-id'>Link</CHORUS_TAG>"

      render(<MarkdownRenderer content={content} />)

      const link = screen.getByText('Link')
      expect(link).toHaveAttribute('data-file-path', 'project:single-quote-id')
    })

    it('should handle CHORUS_TAG without path attribute (uses inner content as path)', () => {
      const content = '<CHORUS_TAG>some/file/path.ts</CHORUS_TAG>'

      render(<MarkdownRenderer content={content} />)

      const link = screen.getByText('some/file/path.ts')
      expect(link).toHaveAttribute('data-file-path', 'some/file/path.ts')
    })

    it('should handle multiple CHORUS_TAGs in the same content', () => {
      const content =
        'First: <CHORUS_TAG path="project:proj1">Project 1</CHORUS_TAG> Second: <CHORUS_TAG path="drafting-stage1:proj2">Start Project 2</CHORUS_TAG>'

      render(<MarkdownRenderer content={content} />)

      const link1 = screen.getByText('Project 1')
      const link2 = screen.getByText('Start Project 2')

      expect(link1).toHaveAttribute('data-file-path', 'project:proj1')
      expect(link2).toHaveAttribute('data-file-path', 'drafting-stage1:proj2')
    })

    it('should handle UUID-style project IDs', () => {
      const uuid = 'c18b2ef4-c77e-4862-8245-baca1537c81a'
      const content = `<CHORUS_TAG path="drafting-stage1:${uuid}">Start planning →</CHORUS_TAG>`

      render(<MarkdownRenderer content={content} />)

      const link = screen.getByText('Start planning →')
      expect(link).toHaveAttribute('data-file-path', `drafting-stage1:${uuid}`)
    })
  })
})
