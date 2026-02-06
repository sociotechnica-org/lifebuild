import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(packageRoot, '..', '..')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lifebuild-mcp-'))

const transport = new StdioClientTransport({
  command: pnpmCommand,
  args: ['--filter', '@lifebuild/mcp-server', 'start'],
  cwd: repoRoot,
  env: {
    ...process.env,
    LIFEBUILD_STORE_ID: 'integration-test',
    LIFEBUILD_SYNC_URL: '',
    LIFEBUILD_STORE_DATA_PATH: tempDir,
  },
  stderr: 'pipe',
})

const client = new Client({
  name: 'lifebuild-mcp-test',
  version: '0.1.0',
})

try {
  await client.connect(transport)

  const tools = await client.listTools()
  if (!tools.tools.some(tool => tool.name === 'list_projects')) {
    throw new Error('Expected list_projects tool to be registered')
  }

  const result = await client.callTool({
    name: 'list_projects',
    arguments: {},
  })

  if (result.isError) {
    throw new Error('Expected list_projects tool to succeed')
  }

  const structured = result.structuredContent as { success?: boolean } | undefined
  if (!structured?.success) {
    throw new Error('Expected list_projects structuredContent.success to be true')
  }

  console.log('Integration test succeeded.')
  await client.close()
  process.exit(0)
} catch (error) {
  await client.close()
  throw error
}
