import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LifeMap, CategoryId } from '../life-map/LifeMap.js'
import { StrategyStudio } from '../strategy-studio/StrategyStudio.js'
import { TopNavbar } from './TopNavbar.js'
import { LeftRail } from './LeftRail.js'
import { ChatWindow } from './ChatWindow.js'
import { ChatProvider, useChatContext } from './ChatContext.js'
import { CHAT_WINDOW_WIDTH, CHAT_WINDOW_SPACING } from './chatConstants.js'

type View = 'lifemap' | 'strategy'

/**
 * BackgroundLayer - Base background that fills the gap when content shifts
 * Stays fixed to fill area left by ContentArea shifting right
 */
const BackgroundLayer: React.FC = () => {
  return (
    <div
      className='absolute inset-0'
      style={{
        backgroundColor: '#f5f1e8', // Same beige as ProjectExpandedView background
        zIndex: 0,
      }}
    />
  )
}

/**
 * ContentArea - Wrapper that shifts content when chat is open
 */
const ContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isChatOpen } = useChatContext()
  // Chat window: left: 4rem (64px), width: CHAT_WINDOW_WIDTH, so margin = 4rem + CHAT_WINDOW_WIDTH + spacing
  const marginLeft = isChatOpen ? `calc(4rem + ${CHAT_WINDOW_WIDTH} + ${CHAT_WINDOW_SPACING})` : '0'

  return (
    <motion.div
      className='absolute inset-0'
      animate={{
        marginLeft: marginLeft,
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * AnimatedHomeView - Manages navigation between LifeMap and Strategy Studio
 * with smooth slide animations using Framer Motion
 */
export const AnimatedHomeView: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<View>('lifemap')
  const [expandedCategoryId, setExpandedCategoryId] = React.useState<CategoryId | null>(null)
  const [isChatOpen, setIsChatOpen] = React.useState(false)
  const closeLifeMapCategoryRef = React.useRef<(() => void) | null>(null)

  // Expose navigation functions globally for easy access
  // This allows clicking elements in LifeMap or StrategyStudio to trigger navigation
  React.useEffect(() => {
    // @ts-ignore - Adding to window for global access
    window.navigateToStrategyStudio = () => setCurrentView('strategy')
    // @ts-ignore
    window.navigateToLifeMap = () => setCurrentView('lifemap')

    return () => {
      // @ts-ignore
      delete window.navigateToStrategyStudio
      // @ts-ignore
      delete window.navigateToLifeMap
    }
  }, [])

  // Keyboard shortcut: Up arrow for Strategy Studio, Down arrow for LifeMap
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCurrentView('strategy')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCurrentView('lifemap')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ChatProvider isChatOpen={isChatOpen}>
      <div className='w-full h-screen overflow-hidden relative'>
        {/* Background layer - shifts with content when chat is open */}
        <BackgroundLayer />

        {/* Chat Window - Modal panel to the right of left rail */}
        <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

        {/* Animated content area - shifts right when chat is open */}
        <ContentArea>
          <AnimatePresence mode='sync' initial={false}>
            {currentView === 'strategy' ? (
              <motion.div
                key='strategy'
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <StrategyStudio hideNavbar />
              </motion.div>
            ) : (
              <motion.div
                key='lifemap'
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <LifeMap
                  hideNavbar
                  onCategoryChange={setExpandedCategoryId}
                  onRegisterCloseHandler={handler => {
                    closeLifeMapCategoryRef.current = handler
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </ContentArea>

        {/* Top navbar */}
        <TopNavbar
          currentView={currentView}
          expandedCategoryId={expandedCategoryId}
          onLogoClick={() => {
            // Always navigate to lifemap first
            setCurrentView('lifemap')
            // Then close category if one is expanded
            if (expandedCategoryId) {
              // Use setTimeout to ensure view change happens first
              setTimeout(() => {
                closeLifeMapCategoryRef.current?.()
              }, 0)
            }
          }}
        />

        {/* Left rail sidebar */}
        <LeftRail onChatToggle={() => setIsChatOpen(!isChatOpen)} />
      </div>
    </ChatProvider>
  )
}
