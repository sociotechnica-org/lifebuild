import type { Meta, StoryObj } from '@storybook/react'
import { LiveStoreRepairPrompt } from './LiveStoreRepairPrompt.js'

const meta: Meta<typeof LiveStoreRepairPrompt> = {
  title: 'Components/LiveStoreRepairPrompt',
  component: LiveStoreRepairPrompt,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Prompt shown when LiveStore needs a manual repair or retry action.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LiveStoreRepairPrompt>

export default meta
type Story = StoryObj<typeof meta>

export const RepairRequired: Story = {
  args: {
    title: 'LiveStore needs repair',
    description:
      'Local data on this device is out of sync with the server. Repairing will clear local data and re-sync from the server.',
    details: 'Server data will not be affected.',
    showRepairAction: true,
    onConfirmRepair: () => {},
    onRetry: () => {},
    onReload: () => {},
  },
}

export const RetryOnly: Story = {
  args: {
    title: 'LiveStore failed to start',
    description: 'We could not start the local data store. Try again or reload the page.',
    showRepairAction: false,
    onRetry: () => {},
    onReload: () => {},
  },
}
