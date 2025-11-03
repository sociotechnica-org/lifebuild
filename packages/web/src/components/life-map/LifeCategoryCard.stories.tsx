import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LifeCategoryCard } from './LifeCategoryCard.js'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@work-squared/shared'

type LifeCategoryCardProps = React.ComponentProps<typeof LifeCategoryCard>

const meta: Meta<typeof LifeCategoryCard> = {
  title: 'Components/LifeCategoryCard',
  component: LifeCategoryCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Animated category card for the new LifeMap UI with pulsing glow effect.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    category: {
      control: 'select',
      options: PROJECT_CATEGORIES.map(c => c.value),
      description: 'The category to display',
    },
    onClick: { action: 'clicked' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    category: 'health' as ProjectCategory,
    expandedCategoryId: null,
    morphingCategoryId: null,
    onClick: () => {},
  },
}

export const AllCategories: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4 justify-center p-8 bg-[#f5f1e8]'>
      {PROJECT_CATEGORIES.map(category => (
        <LifeCategoryCard
          key={category.value}
          category={category.value}
          expandedCategoryId={null}
          morphingCategoryId={null}
          onClick={() => {}}
        />
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}

export const Expanding: Story = {
  args: {
    category: 'health' as ProjectCategory,
    expandedCategoryId: 'health' as ProjectCategory,
    morphingCategoryId: null,
    onClick: () => {},
  },
}

export const Morphing: Story = {
  args: {
    category: 'health' as ProjectCategory,
    expandedCategoryId: 'health' as ProjectCategory,
    morphingCategoryId: 'health' as ProjectCategory,
    onClick: () => {},
  },
}

export const OtherCategoriesHidden: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4 justify-center p-8 bg-[#f5f1e8]'>
      {PROJECT_CATEGORIES.map(category => (
        <LifeCategoryCard
          key={category.value}
          category={category.value}
          expandedCategoryId={'health' as ProjectCategory}
          morphingCategoryId={null}
          onClick={() => {}}
        />
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'When a category is expanded, other categories fade out.',
      },
    },
  },
}
