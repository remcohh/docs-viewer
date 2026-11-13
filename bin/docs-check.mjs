#!/usr/bin/env node
// docs-check: lists AI-generated docs whose sources changed since they were generated.
//
//   docs-check [docs-dir]        (default: ./docs)
//
// Exits 1 if any doc is stale, so CI can run it too. Run it from inside the project's git
// repository. Sources are resolved against the docs folder's parent (the project root).
//
// A generated doc carries a header (`%%` lines in .mmd, an HTML comment in .md) with
// `generated-at: <commit>` and `sources: <paths>`; the convention is described in
// skills/generated-docs/SKILL.md. Stale = `git diff <commit>` shows changes (committed or not)
// under any of the sources.
//
// Node built-ins only.
import { execFileSync } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

const docsRoot = resolve(process.argv[2] ?? 'docs')
const projectRoot = dirname(docsRoot)

const git = (...args) => execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' }).trim()

// The doc's leading comment block (`%%` lines in .mmd, the opening `<!-- -->` in .md), split
// into lines without comment markers; empty when the doc doesn't start with one.
function leadingComment(file, text) {
  if (file.endsWith('.mmd')) {
    const lines = text.split('\n')
    const end = lines.findIndex((l) => !l.trimStart().startsWith('%%'))
    return lines.slice(0, end === -1 ? lines.length : end).map((l) => l.replace(/^\s*%%\s?/, ''))
  }
  const match = text.match(/^\s*<!--([\s\S]*?)-->/)
  return match ? match[1].split('\n').map((l) => l.trim()) : []
}

// generated-at and sources from the header, or null when the doc isn't AI-generated.
function readHeader(file, text) {
  const lines = leadingComment(file, text)
  if (!lines.some((l) => l.startsWith('AI-GENERATED'))) return null
  const field = (key) => lines.find((l) => l.startsWith(`${key}:`))?.slice(key.length + 1).trim()
  return { commit: field('generated-at'), sources: field('sources')?.split(/\s+/).filter(Boolean) ?? [] }
}

let files
try {
  files = (await readdir(docsRoot, { recursive: true })).filter((f) => /\.(md|mmd)$/.test(f)).sort()
} catch {
  console.error(`docs-check: no docs folder at ${docsRoot}`)
  process.exit(2)
}

let stale = 0
for (const file of files) {
  const header = readHeader(file, await readFile(join(docsRoot, file), 'utf8'))
  if (!header) continue
  const doc = relative(projectRoot, join(docsRoot, file))

  if (!header.commit || header.sources.length === 0) {
    console.log(`✗ ${doc}: header needs both generated-at and sources`)
    stale++
    continue
  }
  let changed
  try {
    changed = git('diff', '--name-only', '--relative', header.commit, '--', ...header.sources)
  } catch {
    console.log(`✗ ${doc}: generated-at ${header.commit} is not a commit in this repo`)
    stale++
    continue
  }
  if (!changed) {
    console.log(`✓ ${doc}`)
    continue
  }
  stale++
  const commits = git('rev-list', '--count', `${header.commit}..HEAD`, '--', ...header.sources)
  console.log(`✗ ${doc}: ${commits} commit(s) since ${header.commit} touch its sources:`)
  for (const path of changed.split('\n')) console.log(`    ${path}`)
}

if (stale) {
  console.log(`\n${stale} stale doc(s). Regenerate them with the generated-docs skill.`)
  process.exit(1)
}
