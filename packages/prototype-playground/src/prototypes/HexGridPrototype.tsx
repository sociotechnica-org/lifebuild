import { HexGridPrototypeApp } from '@lifebuild/hex-grid-prototype'
import { Link } from 'react-router-dom'

export function HexGridPrototype() {
  return (
    <div className='hex-grid-route'>
      <HexGridPrototypeApp />
      <div className='hex-grid-route__hud'>
        <Link to='/' className='hex-grid-route__hud-link'>
          Playground index
        </Link>
        <Link to='/state-signals' className='hex-grid-route__hud-link'>
          Next: State Signal Lab
        </Link>
      </div>
    </div>
  )
}
