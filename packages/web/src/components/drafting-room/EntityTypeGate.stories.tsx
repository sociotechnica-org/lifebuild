import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { EntityTypeGate } from './EntityTypeGate.js'

const meta: Meta<typeof EntityTypeGate> = {
  title: 'Pages/DraftingRoom/EntityTypeGate',
  component: EntityTypeGate,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The Entity Type Gate is the first screen in the Drafting Room creation flow. It presents a binary choice between creating a Project (bounded work with a finish line) or a System (infrastructure that runs indefinitely).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EntityTypeGate>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default view of the entity type gate.
 * Shows two large cards side by side: "Project" and "System".
 * Clicking "Project" navigates to the project Stage 1 form.
 * Clicking "System" navigates to the system Stage 1 form (placeholder).
 */
export const Default: Story = {
  decorators: [
    Story => (
      <div style={{ width: '900px', padding: '2rem', background: '#faf9f7' }}>
        <Story />
      </div>
    ),
  ],
}

/**
 * Narrow viewport showing the responsive stacked layout.
 * On small screens, the cards stack vertically.
 */
export const NarrowViewport: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'On narrow viewports, the two choice cards stack vertically for a mobile-friendly layout.',
      },
    },
  },
  decorators: [
    Story => (
      <div style={{ width: '360px', padding: '1rem', background: '#faf9f7' }}>
        <Story />
      </div>
    ),
  ],
}
