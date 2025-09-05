import type { Meta, StoryObj } from '@storybook/react'
import { MarkdownRenderer } from './MarkdownRenderer.js'

const meta: Meta<typeof MarkdownRenderer> = {
  title: 'Components/MarkdownRenderer',
  component: MarkdownRenderer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Markdown renderer with support for CHORUS_TAG file navigation',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Markdown content to render',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    onFileNavigate: {
      action: 'fileNavigate',
      description: 'Callback for file navigation',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: `# Sample Markdown

This is a **bold** text and this is *italic* text.

## Code Block

\`\`\`typescript
function hello() {
  return "Hello, World!"
}
\`\`\`

## List
- Item 1
- Item 2
- Item 3
`,
  },
}

export const WithChorusTags: Story = {
  args: {
    content: `# Tool Output with CHORUS Tags

I've analyzed the codebase and found the following files:

## Project Files
- The main component is in <CHORUS_TAG>packages/web/src/components/chat/ChatInterface/ChatInterface.tsx</CHORUS_TAG>
- Database schema is defined in <CHORUS_TAG>packages/shared/src/schema.ts</CHORUS_TAG>
- Event definitions are in <CHORUS_TAG>packages/shared/src/events.ts</CHORUS_TAG>

## Documentation
- See the project README: <CHORUS_TAG>README.md</CHORUS_TAG>
- Architecture docs: <CHORUS_TAG>docs/architecture.md</CHORUS_TAG>

## External Links
- Visit the repository: <CHORUS_TAG>https://github.com/example/repo</CHORUS_TAG>

## Unknown Files
- Some config file: <CHORUS_TAG>config/unknown.yaml</CHORUS_TAG>

Click on any of the file paths above to navigate to them!`,
    className: 'max-w-2xl',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates CHORUS_TAG functionality with different file types. Click on the file paths to test navigation.',
      },
    },
  },
}

export const MixedContent: Story = {
  args: {
    content: `# Analysis Complete

I've completed the analysis of your project structure.

## Key Findings

1. **Main Entry Point**: <CHORUS_TAG>packages/web/src/main.tsx</CHORUS_TAG>
2. **API Routes**: <CHORUS_TAG>packages/server/src/routes/api.ts</CHORUS_TAG>
3. **Configuration**: 
   - Environment: <CHORUS_TAG>.env.example</CHORUS_TAG>
   - TypeScript: <CHORUS_TAG>tsconfig.json</CHORUS_TAG>

## Next Steps

\`\`\`bash
# Install dependencies
npm install

# Start development server  
npm run dev
\`\`\`

The main logic is implemented in <CHORUS_TAG>src/utils/processor.ts</CHORUS_TAG> and you can find the tests in <CHORUS_TAG>src/utils/processor.test.ts</CHORUS_TAG>.

For more information, check the docs at <CHORUS_TAG>https://docs.example.com</CHORUS_TAG>.`,
    className: 'max-w-3xl',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows CHORUS_TAG integration within mixed markdown content including code blocks and lists.',
      },
    },
  },
}

export const CustomNavigation: Story = {
  args: {
    content: `# Custom Navigation Handler

This story demonstrates custom navigation handling.

Files to explore:
- <CHORUS_TAG>src/components/Button.tsx</CHORUS_TAG>
- <CHORUS_TAG>src/hooks/useData.ts</CHORUS_TAG>
- <CHORUS_TAG>docs/getting-started.md</CHORUS_TAG>`,
    onFileNavigate: (filePath: string, options?: { documentId?: string; projectId?: string }) => {
      console.log('Custom navigation triggered:', { filePath, options })
      alert(`Custom navigation: ${filePath}`)
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Uses a custom navigation handler that shows alerts instead of navigating. Check the Actions panel for logged events.',
      },
    },
  },
}

export const ErrorHandling: Story = {
  args: {
    content: `# Error Handling

This tests edge cases and error handling:

## Empty Tags
<CHORUS_TAG></CHORUS_TAG>

## Nested Content
<CHORUS_TAG>nested/path/with<CHORUS_TAG>inner</CHORUS_TAG>content</CHORUS_TAG>

## Special Characters
<CHORUS_TAG>path/with spaces/file.txt</CHORUS_TAG>
<CHORUS_TAG>path/with-dashes/file_underscore.js</CHORUS_TAG>
<CHORUS_TAG>path/with@special#characters$.ts</CHORUS_TAG>

## Valid Files
<CHORUS_TAG>packages/web/src/App.tsx</CHORUS_TAG>`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests edge cases and error handling for CHORUS_TAG parsing.',
      },
    },
  },
}
