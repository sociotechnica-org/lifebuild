import { Link } from 'react-router-dom'
import { PROTOTYPES, prototypeCount } from '../lib/prototypeCatalog.js'

export function HomePage() {
  return (
    <div className='home-shell'>
      <div className='home-shell__background' />
      <header className='home-hero'>
        <span className='home-hero__eyebrow'>LifeBuild Labs</span>
        <h1>Prototype Playground</h1>
        <p>
          Shared routes for exploratory builds. For now this playground hosts the hex-grid prototype
          at a stable path for focused iteration.
        </p>
        <div className='home-hero__stats'>
          <div>
            <strong>{prototypeCount}</strong>
            <span>active prototype</span>
          </div>
        </div>
      </header>

      <main className='prototype-grid'>
        {PROTOTYPES.map(prototype => (
          <article key={prototype.id} className='prototype-card'>
            <div className='prototype-card__meta'>
              <span className='prototype-card__status'>{prototype.status}</span>
            </div>
            <h2>{prototype.title}</h2>
            <p>{prototype.summary}</p>
            <Link to={prototype.route} className='prototype-card__cta'>
              Open prototype
            </Link>
          </article>
        ))}
      </main>
    </div>
  )
}
