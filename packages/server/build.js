import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin'
import { readFileSync } from 'fs'

// Read package.json for release version
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Only upload source maps in production builds
const isProduction = process.env.NODE_ENV === 'production'

const plugins = [
  nodeExternalsPlugin({
    // Bundle workspace dependencies but not external ones
    allowList: ['@lifebuild/shared']
  })
]

// Add Sentry plugin for production builds if auth token is available
if (isProduction && process.env.SENTRY_AUTH_TOKEN) {
  // Sentry doesn't allow slashes in release names, so we convert @lifebuild/server to lifebuild-server
  const releaseName = `${packageJson.name.replace('@', '').replace('/', '-')}@${packageJson.version}`
  plugins.push(
    sentryEsbuildPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        name: releaseName,
      },
      // Automatically create and upload source maps
      sourcemaps: {
        assets: ['./dist/**'],
        ignore: ['node_modules'],
      },
    })
  )
  console.log(`📦 Building for production with Sentry source maps upload`)
  console.log(`   Release: ${releaseName}`)
} else if (isProduction) {
  console.warn('⚠️  Production build without Sentry source maps (SENTRY_AUTH_TOKEN not set)')
} else {
  console.log('🔨 Building for development (source maps not uploaded)')
}

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  plugins,
  loader: {
    '.ts': 'ts'
  },
  sourcemap: true,
  minify: false
})