import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = 'tolelom/sion-api'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, 'contract')

const usage = `usage: node scripts/sync-contract.mjs [--from <sion-api/contract 경로> | --remote [ref]]
기본값은 형제 체크아웃 ../sion-api/contract, 없으면 GitHub main`

async function readLocal(source) {
  const entries = await readdir(source, { withFileTypes: true, recursive: true })
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => relative(source, join(e.parentPath, e.name)))
  return Promise.all(files.map(async (file) => [file, await readFile(join(source, file), 'utf8')]))
}

async function readRemote(ref) {
  const tree = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${ref}?recursive=1`)
  if (!tree.ok) throw new Error(`GitHub tree ${ref}: HTTP ${tree.status}`)
  const paths = (await tree.json()).tree
    .map((node) => node.path)
    .filter((path) => path.startsWith('contract/') && path.endsWith('.json'))
  return Promise.all(paths.map(async (path) => {
    const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${ref}/${path}`)
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
    return [relative('contract', path), await res.text()]
  }))
}

const args = process.argv.slice(2)
const sibling = resolve(root, '..', 'sion-api', 'contract')
let source
if (args[0] === '--from' && args[1]) {
  source = { label: resolve(args[1]), read: () => readLocal(resolve(args[1])) }
} else if (args[0] === '--remote') {
  const ref = args[1] ?? 'main'
  source = { label: `github.com/${REPO}@${ref}`, read: () => readRemote(ref) }
} else if (args.length === 0) {
  source = existsSync(sibling)
    ? { label: sibling, read: () => readLocal(sibling) }
    : { label: `github.com/${REPO}@main`, read: () => readRemote('main') }
} else {
  console.error(usage)
  process.exit(2)
}

const files = await source.read()
if (!files.some(([file]) => file === 'sion.schema.json')) {
  throw new Error(`${source.label} has no sion.schema.json`)
}
await rm(target, { recursive: true, force: true })
for (const [file, content] of files) {
  await mkdir(dirname(join(target, file)), { recursive: true })
  await writeFile(join(target, file), content)
}
console.log(`contract/ synced from ${source.label} (${files.length} files)`)
