import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import { HomePage } from './pages/HomePage.js'

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
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
