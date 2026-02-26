import { Link } from 'react-router-dom'
import { PROTOTYPES } from '../lib/prototypeCatalog.js'

export function HomePage() {
  return (
    <main className='playground-index'>
      <h1>LifeBuild Prototype Playground</h1>
      <ul className='playground-index__list'>
        {PROTOTYPES.map(prototype => (
          <li key={prototype.id} className='playground-index__item'>
            <Link to={prototype.route}>{prototype.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
