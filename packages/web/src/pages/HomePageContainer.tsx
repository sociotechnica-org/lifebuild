import { useQuery } from '@livestore/react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers$ } from '@work-squared/shared/queries'
import { HomePage } from './HomePage.js'
import { getInitials } from '../util/initials.js'
import { useAuth } from '../contexts/AuthContext.js'
import { isCurrentUserAdmin } from '../utils/adminCheck.jsx'
import type { Advisor } from '../components/advisors/AdvisorRail.js'
import type { ProjectCategory } from '../components/projects/ProjectCategorySquare.js'

// Static project categories with LifeSquared colors and letterpress symbols
const PROJECT_CATEGORIES: ProjectCategory[] = [
  {
    id: '1',
    name: 'Health',
    symbol: '✦', // Star/sparkle for vitality
    color: 'health',
    advisorInitials: 'AC',
    projects: [
      { id: 'p1', name: 'Morning routine' },
      { id: 'p2', name: 'Meal prep' },
    ],
  },
  {
    id: '2',
    name: 'Relationships',
    symbol: '♥', // Heart
    color: 'relationships',
    projects: [{ id: 'p3', name: 'Date night' }],
  },
  {
    id: '3',
    name: 'Finances',
    symbol: '◆', // Diamond for value
    color: 'finances',
    advisorInitials: 'MG',
    projects: [
      { id: 'p4', name: 'Budget review' },
      { id: 'p5', name: 'Investments' },
      { id: 'p6', name: 'Tax prep' },
    ],
  },
  {
    id: '4',
    name: 'Growth',
    symbol: '▲', // Upward triangle
    color: 'growth',
    projects: [],
  },
  {
    id: '5',
    name: 'Leisure',
    symbol: '◉', // Circle with dot
    color: 'leisure',
    advisorInitials: 'JW',
    projects: [
      { id: 'p7', name: 'Reading list' },
      { id: 'p8', name: 'Guitar practice' },
    ],
  },
  {
    id: '6',
    name: 'Spirituality',
    symbol: '✧', // Eight-pointed star
    color: 'spirituality',
    projects: [],
  },
  {
    id: '7',
    name: 'Home',
    symbol: '■', // Square for foundation
    color: 'home',
    projects: [{ id: 'p9', name: 'Garden' }],
  },
  {
    id: '8',
    name: 'Service',
    symbol: '✶', // Six-pointed star
    color: 'contribution',
    advisorInitials: 'SK',
    projects: [
      { id: 'p10', name: 'Volunteer' },
      { id: 'p11', name: 'Mentoring' },
    ],
  },
]

// Static advisors with contemplative colors (blue, teal, purple)
const STATIC_ADVISORS: Advisor[] = [
  { id: '1', name: 'Alex Chen', initials: 'AC', color: 'blue' },
  { id: '2', name: 'Maria Garcia', initials: 'MG', color: 'teal' },
  { id: '3', name: 'James Wilson', initials: 'JW', color: 'purple' },
  { id: '4', name: 'Sarah Kim', initials: 'SK', color: 'blue' },
]

/**
 * HomePageContainer - Container component for the new HomePage
 *
 * This container handles data fetching and business logic,
 * passing everything to the HomePage presenter component.
 */
export const HomePageContainer: React.FC = () => {
  const navigate = useNavigate()
  const users = useQuery(getUsers$) ?? []
  const legacyUser = users[0]
  const { user: authUser, isAuthenticated, logout } = useAuth()

  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Use auth user if available, otherwise fall back to legacy user system
  const currentUser = authUser || legacyUser

  // Helper to get display name
  const getDisplayName = () => {
    if (authUser) return authUser.email
    if (legacyUser) return legacyUser.name
    return 'User'
  }

  const getEmail = () => {
    if (authUser) return authUser.email
    return ''
  }

  const handleAdvisorClick = (advisorId: string) => {
    if (selectedAdvisorId === advisorId) {
      // Toggle off if clicking same advisor
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

  const handleCategoryClick = (category: ProjectCategory) => {
    console.log('Category clicked:', category)
    // TODO: Navigate to category view when implemented
  }

  const selectedAdvisor = STATIC_ADVISORS.find(a => a.id === selectedAdvisorId)

  return (
    <HomePage
      userInitials={getInitials(getDisplayName())}
      userName={getDisplayName()}
      userEmail={getEmail()}
      isAuthenticated={isAuthenticated}
      isAdmin={isCurrentUserAdmin(authUser)}
      onLogout={logout}
      advisors={STATIC_ADVISORS}
      selectedAdvisorId={selectedAdvisorId}
      onAdvisorClick={handleAdvisorClick}
      categories={PROJECT_CATEGORIES}
      onCategoryClick={handleCategoryClick}
      isChatOpen={isChatOpen}
      chatAdvisorName={selectedAdvisor?.name}
      onChatClose={handleChatClose}
    />
  )
}
