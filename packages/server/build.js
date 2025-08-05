import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  plugins: [
    nodeExternalsPlugin({
      // Bundle workspace dependencies but not external ones
      allowList: ['@work-squared/shared']
    })
  ],
  loader: {
    '.ts': 'ts'
  },
  sourcemap: true,
  minify: false
})