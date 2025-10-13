import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ProjectCategorySquare, type ProjectCategory } from './ProjectCategorySquare.js'

const meta: Meta<typeof ProjectCategorySquare> = {
  title: 'Components/ProjectCategorySquare',
  component: ProjectCategorySquare,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Project category square with letterpress aesthetic - shows category name, center symbol, mini projects, and optional advisor avatar.',
      },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(210, 180, 140, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(232, 220, 200, 0.4) 0%, transparent 50%),
            linear-gradient(135deg,
              #FAF8F3 0%,
              #F5F0E8 30%,
              #EFE8DC 70%,
              #E8E0D0 100%
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 100px,
              rgba(200, 180, 150, 0.08) 100px,
              rgba(200, 180, 150, 0.08) 102px
            )
          `,
          padding: '40px',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '280px', aspectRatio: '1 / 1' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectCategorySquare>

export default meta
type Story = StoryObj<typeof meta>

// Health category with advisor and 2 projects
export const Health: Story = {
  args: {
    category: {
      id: '1',
      name: 'Health',
      symbol: '✦',
      color: 'health',
      advisorInitials: 'AC',
      projects: [
        { id: 'p1', name: 'Morning routine' },
        { id: 'p2', name: 'Meal prep' },
      ],
      materialization: 4,
    },
    onClick: category => console.log('Clicked:', category),
  },
}

// Relationships with heart symbol and 1 project
export const Relationships: Story = {
  args: {
    category: {
      id: '2',
      name: 'Relationships',
      symbol: '♥',
      color: 'relationships',
      projects: [{ id: 'p3', name: 'Date night' }],
      materialization: 4,
    },
    onClick: category => console.log('Clicked:', category),
  },
}

// Finances fully loaded with advisor and 3 projects
export const Finances: Story = {
  args: {
    category: {
      id: '3',
      name: 'Finances',
      symbol: '◆',
      color: 'finances',
      advisorInitials: 'MG',
      projects: [
        { id: 'p4', name: 'Budget review' },
        { id: 'p5', name: 'Investments' },
        { id: 'p6', name: 'Tax prep' },
      ],
      materialization: 4,
    },
    onClick: category => console.log('Clicked:', category),
  },
}

// Growth - empty, no projects
export const Growth: Story = {
  args: {
    category: {
      id: '4',
      name: 'Growth',
      symbol: '▲',
      color: 'growth',
      projects: [],
      materialization: 4,
    },
    onClick: category => console.log('Clicked:', category),
  },
}

// Leisure with advisor and 2 projects
export const Leisure: Story = {
  args: {
    category: {
      id: '5',
      name: 'Leisure',
      symbol: '◉',
      color: 'leisure',
      advisorInitials: 'JW',
      projects: [
        { id: 'p7', name: 'Reading list' },
        { id: 'p8', name: 'Guitar practice' },
      ],
      materialization: 4,
    },
    onClick: category => console.log('Clicked:', category),
  },
}

// Spirituality - empty
export const Spirituality: Story = {
  args: {
    category: {
      id: '6',
      name: 'Spirituality',
      symbol: '✧',
      color: 'spirituality',
      projects: [],
      materialization: 4,
    },
    onClick: category => console.log('Clicked:', category),
  },
}

// Home with 1 project
export const Home: Story = {
  args: {
    category: {
      id: '7',
      name: 'Home',
      symbol: '■',
      color: 'home',
      projects: [{ id: 'p9', name: 'Garden' }],
      materialization: 4,
    },
    onClick: category => console.log('Clicked:', category),
  },
}

// Service with advisor and 2 projects
export const Service: Story = {
  args: {
    category: {
      id: '8',
      name: 'Service',
      symbol: '✶',
      color: 'contribution',
      advisorInitials: 'SK',
      projects: [
        { id: 'p10', name: 'Volunteer' },
        { id: 'p11', name: 'Mentoring' },
      ],
      materialization: 4,
    },
    onClick: category => console.log('Clicked:', category),
  },
}

// Active state - breathing animation with glow
export const ActiveCategory: Story = {
  args: {
    category: {
      id: '1',
      name: 'Health',
      symbol: '✦',
      color: 'health',
      advisorInitials: 'AC',
      projects: [
        { id: 'p1', name: 'Morning routine' },
        { id: 'p2', name: 'Meal prep' },
      ],
      materialization: 4,
      isActive: true,
    },
    onClick: category => console.log('Clicked:', category),
  },
  parameters: {
    docs: {
      description: {
        story: 'Active quest state with breathing animation and glowing aura.',
      },
    },
  },
}

// Progressive Materialization - Level 0 (Ghost)
export const Ghost: Story = {
  args: {
    category: {
      id: '1',
      name: 'Health',
      symbol: '✦',
      color: 'health',
      materialization: 0,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 0: Ghost state (20% opacity, dashed border, barely visible)',
      },
    },
  },
}

// Progressive Materialization - Level 1 (Emerging)
export const Emerging: Story = {
  args: {
    category: {
      id: '2',
      name: 'Relationships',
      symbol: '♥',
      color: 'relationships',
      materialization: 1,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 1: Emerging (40% opacity, name appears, color tint begins)',
      },
    },
  },
}

// Progressive Materialization - Level 2 (Forming)
export const Forming: Story = {
  args: {
    category: {
      id: '3',
      name: 'Finances',
      symbol: '◆',
      color: 'finances',
      advisorInitials: 'MG',
      projects: [{ id: 'p4', name: 'Budget review' }],
      materialization: 2,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Level 2: Forming (60% opacity, advisor appears, stronger color, mini projects visible)',
      },
    },
  },
}

// Progressive Materialization - Level 3 (Crystallizing)
export const Crystallizing: Story = {
  args: {
    category: {
      id: '4',
      name: 'Growth',
      symbol: '▲',
      color: 'growth',
      projects: [
        { id: 'p7', name: 'Course' },
        { id: 'p8', name: 'Practice' },
      ],
      materialization: 3,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 3: Crystallizing (80% opacity, nearly full presence, rich color)',
      },
    },
  },
}

// All 8 categories side by side
export const AllCategories: Story = {
  render: () => (
    <div
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(210, 180, 140, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(232, 220, 200, 0.4) 0%, transparent 50%),
          linear-gradient(135deg,
            #FAF8F3 0%,
            #F5F0E8 30%,
            #EFE8DC 70%,
            #E8E0D0 100%
          ),
          repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 100px,
            rgba(200, 180, 150, 0.08) 100px,
            rgba(200, 180, 150, 0.08) 102px
          )
        `,
        padding: '40px',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '32px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {[
          { name: 'Health', symbol: '✦', color: 'health' as const, advisor: 'AC', projects: 2 },
          { name: 'Relationships', symbol: '♥', color: 'relationships' as const, projects: 1 },
          { name: 'Finances', symbol: '◆', color: 'finances' as const, advisor: 'MG', projects: 3 },
          { name: 'Growth', symbol: '▲', color: 'growth' as const, projects: 0 },
          { name: 'Leisure', symbol: '◉', color: 'leisure' as const, advisor: 'JW', projects: 2 },
          { name: 'Spirituality', symbol: '✧', color: 'spirituality' as const, projects: 0 },
          { name: 'Home', symbol: '■', color: 'home' as const, projects: 1 },
          {
            name: 'Service',
            symbol: '✶',
            color: 'contribution' as const,
            advisor: 'SK',
            projects: 2,
          },
        ].map((cat, i) => (
          <div key={i} style={{ aspectRatio: '1 / 1' }}>
            <ProjectCategorySquare
              category={{
                id: `${i}`,
                name: cat.name,
                symbol: cat.symbol,
                color: cat.color,
                advisorInitials: cat.advisor,
                projects: Array.from({ length: cat.projects }, (_, j) => ({
                  id: `p${j}`,
                  name: `Project ${j + 1}`,
                })),
                materialization: 4,
              }}
              onClick={category => console.log('Clicked:', category)}
            />
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All 8 life categories displayed in a 4x2 grid on the warm home page background.',
      },
    },
  },
}
