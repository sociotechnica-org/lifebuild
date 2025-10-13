import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { HomePage } from './HomePage.js'
import type { Advisor } from '../components/advisors/AdvisorRail.js'
import type { ProjectCategory } from '../components/projects/ProjectCategorySquare.js'

type HomePageProps = React.ComponentProps<typeof HomePage>

// Static advisors with contemplative colors
const ADVISORS: Advisor[] = [
  { id: '1', name: 'Alex Chen', initials: 'AC', color: 'blue' },
  { id: '2', name: 'Maria Garcia', initials: 'MG', color: 'teal' },
  { id: '3', name: 'James Wilson', initials: 'JW', color: 'purple' },
  { id: '4', name: 'Sarah Kim', initials: 'SK', color: 'blue' },
]

// Project categories - fully materialized by default with LifeSquared colors
const BASE_CATEGORIES: Omit<ProjectCategory, 'materialization' | 'isActive'>[] = [
  { id: '1', name: 'Health & Well-Being', letter: 'H', color: 'health', projectCount: 5 },
  { id: '2', name: 'Relationships', letter: 'R', color: 'relationships', projectCount: 3 },
  { id: '3', name: 'Finances', letter: 'F', color: 'finances', projectCount: 8 },
  { id: '4', name: 'Personal Growth & Learning', letter: 'G', color: 'growth', projectCount: 12 },
  { id: '5', name: 'Leisure & Lifestyle', letter: 'L', color: 'leisure', projectCount: 7 },
  { id: '6', name: 'Spirituality & Meaning', letter: 'S', color: 'spirituality', projectCount: 4 },
  { id: '7', name: 'Home & Environment', letter: 'E', color: 'home', projectCount: 6 },
  { id: '8', name: 'Contribution & Service', letter: 'C', color: 'contribution', projectCount: 9 },
]

// Interactive wrapper for stories
const HomePageStory = (props: Partial<HomePageProps>) => {
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleAdvisorClick = (advisorId: string) => {
    if (selectedAdvisorId === advisorId) {
      setSelectedAdvisorId(null)
      setIsChatOpen(false)
    } else {
      setSelectedAdvisorId(advisorId)
      setIsChatOpen(true)
    }
  }

  const handleChatClose = () => {
    setSelectedAdvisorId(null)
    setIsChatOpen(false)
  }

  const selectedAdvisor = ADVISORS.find(a => a.id === selectedAdvisorId)

  return (
    <HomePage
      userInitials='JM'
      userName='Jess Martin'
      userEmail='jess@example.com'
      isAuthenticated={true}
      isAdmin={false}
      onLogout={() => console.log('Logout clicked')}
      advisors={ADVISORS}
      selectedAdvisorId={selectedAdvisorId}
      onAdvisorClick={handleAdvisorClick}
      categories={BASE_CATEGORIES.map(c => ({ ...c, materialization: 4 }))}
      onCategoryClick={category => console.log('Category clicked:', category)}
      isChatOpen={isChatOpen}
      chatAdvisorName={selectedAdvisor?.name}
      onChatClose={handleChatClose}
      {...props}
    />
  )
}

const meta: Meta<typeof HomePageStory> = {
  title: 'Pages/HomePage',
  component: HomePageStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'High-level workspace with LifeSquared design system: warm neutrals, geometric advisor avatars, progressive materialization, and breathing animations.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HomePageStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default view with Sanctuary White background, W² logo, geometric advisors, and 8 fully materialized category squares in 4x2 grid.',
      },
    },
  },
}

export const WithActiveQuests: Story = {
  render: () => {
    const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)

    const handleAdvisorClick = (advisorId: string) => {
      if (selectedAdvisorId === advisorId) {
        setSelectedAdvisorId(null)
        setIsChatOpen(false)
      } else {
        setSelectedAdvisorId(advisorId)
        setIsChatOpen(true)
      }
    }

    const selectedAdvisor = ADVISORS.find(a => a.id === selectedAdvisorId)

    // Mark first 3 categories as active quests
    const categories = BASE_CATEGORIES.map((c, i) => ({
      ...c,
      materialization: 4 as const,
      isActive: i < 3,
    }))

    return (
      <HomePage
        userInitials='JM'
        userName='Jess Martin'
        userEmail='jess@example.com'
        isAuthenticated={true}
        isAdmin={false}
        onLogout={() => console.log('Logout')}
        advisors={ADVISORS}
        selectedAdvisorId={selectedAdvisorId}
        onAdvisorClick={handleAdvisorClick}
        categories={categories}
        onCategoryClick={c => console.log('Category:', c)}
        isChatOpen={isChatOpen}
        chatAdvisorName={selectedAdvisor?.name}
        onChatClose={() => {
          setSelectedAdvisorId(null)
          setIsChatOpen(false)
        }}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows three active quests with breathing animation, elevated shadows, and glowing aura. These are your current focus areas.',
      },
    },
  },
}

export const ProgressiveMaterialization: Story = {
  render: () => {
    const categories: ProjectCategory[] = [
      { ...BASE_CATEGORIES[0]!, materialization: 0 }, // Ghost
      { ...BASE_CATEGORIES[1]!, materialization: 1 }, // Emerging
      { ...BASE_CATEGORIES[2]!, materialization: 2 }, // Forming
      { ...BASE_CATEGORIES[3]!, materialization: 3 }, // Crystallizing
      { ...BASE_CATEGORIES[4]!, materialization: 4 }, // Materialized
      { ...BASE_CATEGORIES[5]!, materialization: 4, isActive: true }, // Active
      { ...BASE_CATEGORIES[6]!, materialization: 4 },
      { ...BASE_CATEGORIES[7]!, materialization: 4 },
    ]

    return (
      <HomePage
        userInitials='JM'
        userName='Jess Martin'
        userEmail='jess@example.com'
        isAuthenticated={true}
        isAdmin={false}
        onLogout={() => console.log('Logout')}
        advisors={ADVISORS}
        selectedAdvisorId={null}
        onAdvisorClick={() => {}}
        categories={categories}
        onCategoryClick={c => console.log('Category:', c)}
        isChatOpen={false}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates all five materialization levels: Ghost (20%), Emerging (40%), Forming (60%), Crystallizing (80%), Materialized (100%), plus one Active quest.',
      },
    },
  },
}

export const WithChatOpen: Story = {
  render: () => {
    const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>('1')
    const [isChatOpen, setIsChatOpen] = useState(true)

    const handleAdvisorClick = (advisorId: string) => {
      if (selectedAdvisorId === advisorId) {
        setSelectedAdvisorId(null)
        setIsChatOpen(false)
      } else {
        setSelectedAdvisorId(advisorId)
        setIsChatOpen(true)
      }
    }

    const selectedAdvisor = ADVISORS.find(a => a.id === selectedAdvisorId)

    return (
      <HomePage
        userInitials='JM'
        userName='Jess Martin'
        userEmail='jess@example.com'
        isAuthenticated={true}
        isAdmin={false}
        onLogout={() => console.log('Logout')}
        advisors={ADVISORS}
        selectedAdvisorId={selectedAdvisorId}
        onAdvisorClick={handleAdvisorClick}
        categories={BASE_CATEGORIES.map(c => ({ ...c, materialization: 4 }))}
        onCategoryClick={c => console.log('Category:', c)}
        isChatOpen={isChatOpen}
        chatAdvisorName={selectedAdvisor?.name}
        onChatClose={() => {
          setSelectedAdvisorId(null)
          setIsChatOpen(false)
        }}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Chat window open with animated slide-in, grid compressed to 2 columns. Notice the geometric advisor avatar is selected and glowing.',
      },
    },
  },
}

export const EarlyStage: Story = {
  render: () => {
    // Most categories are still emerging
    const categories: ProjectCategory[] = BASE_CATEGORIES.map((c, i) => ({
      ...c,
      materialization: (i < 2 ? 0 : i < 5 ? 1 : i < 7 ? 2 : 4) as 0 | 1 | 2 | 3 | 4,
      projectCount: i < 5 ? 0 : c.projectCount,
    }))

    return (
      <HomePage
        userInitials='JM'
        userName='Jess Martin'
        userEmail='jess@example.com'
        isAuthenticated={true}
        isAdmin={false}
        onLogout={() => console.log('Logout')}
        advisors={ADVISORS}
        selectedAdvisorId={null}
        onAdvisorClick={() => {}}
        categories={categories}
        onCategoryClick={c => console.log('Category:', c)}
        isChatOpen={false}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Early stage workspace: most categories are still ghost or emerging, representing a user who is just beginning to organize their life.',
      },
    },
  },
}

export const NotAuthenticated: Story = {
  render: () => (
    <HomePage
      userInitials='U'
      isAuthenticated={false}
      advisors={ADVISORS}
      selectedAdvisorId={null}
      onAdvisorClick={() => {}}
      categories={BASE_CATEGORIES.map(c => ({ ...c, materialization: 4 }))}
      onCategoryClick={c => console.log('Category:', c)}
      isChatOpen={false}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Unauthenticated state showing Sign in button.',
      },
    },
  },
}
