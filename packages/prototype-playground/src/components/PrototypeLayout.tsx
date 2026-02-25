import type { PropsWithChildren } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { PROTOTYPES } from '../lib/prototypeCatalog.js'

interface PrototypeLayoutProps {
  title: string
  summary: string
}

export function PrototypeLayout({
  title,
  summary,
  children,
}: PropsWithChildren<PrototypeLayoutProps>) {
  return (
    <div className='prototype-layout'>
      <header className='prototype-topbar'>
        <div className='prototype-topbar__title-group'>
          <Link to='/' className='prototype-topbar__back-link'>
            Back to Playground
          </Link>
          <h1>{title}</h1>
          <p>{summary}</p>
        </div>
        <nav className='prototype-topbar__nav' aria-label='Prototype navigation'>
          {PROTOTYPES.map(prototype => (
            <NavLink
              key={prototype.id}
              to={prototype.route}
              className={({ isActive }) =>
                isActive
                  ? 'prototype-topbar__chip prototype-topbar__chip--active'
                  : 'prototype-topbar__chip'
              }
            >
              {prototype.title}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className='prototype-content'>{children}</main>
    </div>
  )
}
