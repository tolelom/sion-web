import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'json-schema-to-typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = join(root, 'contract', 'sion.schema.json')
const outputPath = join(root, 'src', 'types', 'contract.gen.ts')

const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
const generated = await compile(schema, 'SionContract', {
  bannerComment: '/* Generated from contract/sion.schema.json by `npm run contract:types`. Do not edit. */',
  additionalProperties: false,
  ignoreMinAndMaxItems: true,
  style: { semi: false, singleQuote: true, printWidth: 120 },
})

if (process.argv.includes('--check')) {
  const committed = await readFile(outputPath, 'utf8').catch(() => '')
  if (committed !== generated) {
    console.error('src/types/contract.gen.ts is out of date with contract/sion.schema.json. Run `npm run contract:types`.')
    process.exit(1)
  }
} else {
  await writeFile(outputPath, generated)
}
