import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { PROTOTYPES, prototypeCount, getCategoryById } from '../lib/prototypeCatalog.js'
import { STREAM_TOKENS } from '../lib/visualLanguage.js'

export function HomePage() {
  return (
    <div className='home-shell'>
      <div className='home-shell__background' />
      <header className='home-hero'>
        <span className='home-hero__eyebrow'>LifeBuild Labs</span>
        <h1>Prototype Playground</h1>
        <p>
          Shared routes for exploratory builds. Every prototype lives behind a stable URL so we can
          test, discuss, and iterate in public.
        </p>
        <div className='home-hero__stats'>
          <div>
            <strong>{prototypeCount}</strong>
            <span>active prototypes</span>
          </div>
          <div>
            <strong>Gold / Silver / Bronze</strong>
            <span>stream accents available</span>
          </div>
          <div>
            <strong>8 category colors</strong>
            <span>from visual language standard</span>
          </div>
        </div>
      </header>

      <main className='prototype-grid'>
        {PROTOTYPES.map((prototype, index) => {
          const category = getCategoryById(prototype.category)
          const stream = STREAM_TOKENS[prototype.stream]

          return (
            <article
              key={prototype.id}
              className='prototype-card'
              style={
                {
                  '--category-accent': category?.colorHex,
                  '--stream-accent': stream.colorHex,
                  animationDelay: `${index * 80}ms`,
                } as CSSProperties
              }
            >
              <div className='prototype-card__meta'>
                <span className='prototype-card__stream'>{stream.label}</span>
                <span className='prototype-card__status'>{prototype.status}</span>
              </div>
              <h2>{prototype.title}</h2>
              <p>{prototype.summary}</p>
              <div className='prototype-card__category'>{category?.name}</div>
              <Link to={prototype.route} className='prototype-card__cta'>
                Open prototype
              </Link>
            </article>
          )
        })}
      </main>
    </div>
  )
}
