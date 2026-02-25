import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import { PrototypeLayout } from './components/PrototypeLayout.js'
import { HomePage } from './pages/HomePage.js'
import { SignalGardenPrototype } from './prototypes/SignalGardenPrototype.js'
import { StateSignalLabPrototype } from './prototypes/StateSignalLabPrototype.js'
import { StreamArenaPrototype } from './prototypes/StreamArenaPrototype.js'

const HexGridPrototype = lazy(async () => ({
  default: (await import('./prototypes/HexGridPrototype.js')).HexGridPrototype,
}))

function NotFoundPage() {
  return (
    <div className='not-found'>
      <h1>Prototype not found</h1>
      <p>That route is not registered in the playground.</p>
      <Link to='/' className='not-found__link'>
        Go to index
      </Link>
    </div>
  )
}

function RouteLoadingFallback() {
  return (
    <div className='route-loading'>
      <p>Loading prototype...</p>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route
          path='/hex-grid'
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <HexGridPrototype />
            </Suspense>
          }
        />
        <Route
          path='/state-signals'
          element={
            <PrototypeLayout
              title='State Signal Lab'
              summary='Stress-test category colors, state saturation levels, stream accents, and project/system markers.'
            >
              <StateSignalLabPrototype />
            </PrototypeLayout>
          }
        />
        <Route
          path='/stream-arena'
          element={
            <PrototypeLayout
              title='Stream Arena'
              summary='Classify work into Gold, Silver, and Bronze lanes with slot constraints and tactical swaps.'
            >
              <StreamArenaPrototype />
            </PrototypeLayout>
          }
        />
        <Route
          path='/signal-garden'
          element={
            <PrototypeLayout
              title='Signal Garden'
              summary='Tap through a hex field and inspect state transitions through saturation and glow cues.'
            >
              <SignalGardenPrototype />
            </PrototypeLayout>
          }
        />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
