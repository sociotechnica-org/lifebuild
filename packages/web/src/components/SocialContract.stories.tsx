import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SocialContract } from './SocialContract.js'

const meta: Meta<typeof SocialContract> = {
  title: 'Auth/SocialContract',
  component: SocialContract,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The Honest Alpha Social Contract displayed during signup. Users must agree to participate in the alpha program before creating an account.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className='max-w-md bg-white p-6 rounded-2xl border border-[#e8e4de]'>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper to handle state
const InteractiveSocialContract = ({ defaultAgreed = false }: { defaultAgreed?: boolean }) => {
  const [agreed, setAgreed] = useState(defaultAgreed)
  return <SocialContract agreed={agreed} onAgreeChange={setAgreed} />
}

export const Default: Story = {
  render: () => <InteractiveSocialContract />,
  parameters: {
    docs: {
      description: {
        story:
          'Default state with the agreement checkbox unchecked. Users must check the box to proceed with signup.',
      },
    },
  },
}

export const Agreed: Story = {
  render: () => <InteractiveSocialContract defaultAgreed={true} />,
  parameters: {
    docs: {
      description: {
        story:
          'State after the user has agreed to the social contract. The checkbox is checked and the form can be submitted.',
      },
    },
  },
}

export const InContext: Story = {
  render: () => (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-semibold text-[#2f2b27]'>Email address</label>
          <input
            type='email'
            className='mt-1 appearance-none block w-full px-3 py-2.5 border border-[#e8e4de] rounded-lg placeholder-[#8b8680] text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] text-sm'
            placeholder='user@example.com'
            value='alpha@tester.com'
            readOnly
          />
        </div>
        <div>
          <label className='block text-sm font-semibold text-[#2f2b27]'>Password</label>
          <input
            type='password'
            className='mt-1 appearance-none block w-full px-3 py-2.5 border border-[#e8e4de] rounded-lg placeholder-[#8b8680] text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] text-sm'
            placeholder='********'
            value='password123'
            readOnly
          />
        </div>
      </div>

      <InteractiveSocialContract />

      <button
        className='w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-[#faf9f7] bg-[#2f2b27] hover:bg-[#4a4540] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
        disabled
      >
        Create account
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows how the Social Contract appears within the context of the full signup form. The submit button is disabled until the user agrees.',
      },
    },
  },
}
