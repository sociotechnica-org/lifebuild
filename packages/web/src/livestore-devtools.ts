import {
  DEVTOOLS_QUERY_PARAM,
  DEVTOOLS_ROUTE_PARAM,
  getDevtoolsMountPath,
  isDevtoolsEnabled,
} from './utils/livestoreDevtools.js'

const renderMessage = (title: string, message: string) => {
  document.title = title
  const container = document.createElement('div')
  container.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, sans-serif'
  container.style.padding = '32px'
  container.style.maxWidth = '720px'
  container.style.margin = '0 auto'

  const heading = document.createElement('h1')
  heading.textContent = title
  heading.style.margin = '0 0 12px 0'

  const body = document.createElement('p')
  body.textContent = message
  body.style.margin = '0'

  container.append(heading, body)
  document.body.innerHTML = ''
  document.body.appendChild(container)
}

const params = new URLSearchParams(window.location.search)
const devtoolsEnabled = isDevtoolsEnabled(params.get(DEVTOOLS_QUERY_PARAM))

const ensureDevtoolsStyles = (url: string) => {
  if (!url || typeof document === 'undefined') return
  const existing = document.querySelector('link[data-livestore-devtools]')
  if (existing) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.dataset.livestoreDevtools = 'true'
  document.head?.appendChild(link)
}

if (!devtoolsEnabled) {
  renderMessage(
    'LiveStore Devtools Disabled',
    'Append ?livestoreDevtools=true to the URL to enable devtools.'
  )
} else {
  void (async () => {
    try {
      const initialRouteParam = params.get(DEVTOOLS_ROUTE_PARAM)
      const initialRoute = initialRouteParam?.startsWith('/')
        ? initialRouteParam
        : initialRouteParam
          ? `/${initialRouteParam}`
          : '/'

      const mountPath = getDevtoolsMountPath()
      const license =
        import.meta.env.VITE_LIVESTORE_DEVTOOLS_LICENSE ??
        import.meta.env.VITE_LSD_LICENSE ??
        undefined

      const [{ run }, { schema }, { default: sharedWorker }, { default: devtoolsStylesUrl }] =
        await Promise.all([
          import('@livestore/devtools-vite/dist/devtools-bundle/index.js'),
          import('@lifebuild/shared/schema'),
          import('@livestore/adapter-web/shared-worker?sharedworker'),
          import('@livestore/devtools-vite/dist/devtools-bundle/devtools-vite.css'),
        ])

      ensureDevtoolsStyles(devtoolsStylesUrl)

      run({
        schemas: [schema],
        sharedWorker,
        license,
        mountPath,
        __website: {
          initialRoute,
        },
      })
    } catch (error) {
      console.error('[LiveStore] Failed to load devtools:', error)
      renderMessage(
        'LiveStore Devtools Error',
        'Devtools failed to load. Check the console for details.'
      )
    }
  })()
}
