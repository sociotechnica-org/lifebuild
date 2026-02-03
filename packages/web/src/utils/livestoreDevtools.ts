export const DEVTOOLS_QUERY_PARAM = 'livestoreDevtools'
export const DEVTOOLS_ROUTE_PARAM = 'devtoolsRoute'
const DEVTOOLS_PATH = '/_livestore'

export const isDevtoolsEnabled = (value: string | null) => value === '1' || value === 'true'

export const getDevtoolsMountPath = () => {
  const base = import.meta.env.BASE_URL ?? '/'
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base
  return `${trimmedBase}${DEVTOOLS_PATH}`
}
