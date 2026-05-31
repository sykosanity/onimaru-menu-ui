import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const luaPath = path.resolve(__dirname, '../../Onimaru.lua')
const outPath = path.resolve(__dirname, '../src/mockData.generated.ts')

const src = fs.readFileSync(luaPath, 'utf8')
const start = src.indexOf('function ONIMARU:BuildDefaultMenu()')
const end = src.indexOf('function ONIMARU:UpdateTabChecked', start)
const block = src.slice(start, end)

const SECTION_ORDER = [
  'Self',
  'Server',
  'Weapon',
  'Vehicle',
  'Emotes',
  'Teleports',
  'World Spawning',
  'Settings',
]

function stripOnSelect(text) {
  let depth = 0
  let i = text.indexOf('onSelect')
  if (i === -1) return text
  while (i !== -1) {
    const fnStart = text.indexOf('function', i)
    if (fnStart === -1) break
    let j = fnStart
    depth = 0
    let started = false
    for (; j < text.length; j++) {
      const c = text[j]
      if (c === '(') {
        depth++
        started = true
      } else if (c === ')') {
        depth--
      } else if (c === '}' && started && depth <= 0) {
        j++
        break
      }
    }
    // remove trailing comma
    let endIdx = j
    while (endIdx < text.length && /[\s,]/.test(text[endIdx])) endIdx++
    text = text.slice(0, i) + text.slice(endIdx)
    i = text.indexOf('onSelect')
  }
  return text
}

function parseValue(str, key) {
  const re = new RegExp(`${key}\\s*=\\s*"([^"]*)"`)
  const m = str.match(re)
  return m ? m[1] : undefined
}

function parseNumber(str, key) {
  const re = new RegExp(`${key}\\s*=\\s*([\\d.]+)`)
  const m = str.match(re)
  return m ? Number(m[1]) : undefined
}

function parseBool(str, key) {
  const re = new RegExp(`${key}\\s*=\\s*(true|false)`)
  const m = str.match(re)
  return m ? m[1] === 'true' : undefined
}

function parseTabEntry(raw) {
  const type = parseValue(raw, 'type')
  const label = parseValue(raw, 'label')
  if (!type || !label) return null

  const entry = { type, label }
  const desc = parseValue(raw, 'desc')
  if (desc) entry.desc = desc
  const checked = parseBool(raw, 'checked')
  if (checked !== undefined) entry.checked = checked
  const value = parseNumber(raw, 'value')
  if (value !== undefined) entry.value = value
  const min = parseNumber(raw, 'min')
  if (min !== undefined) entry.min = min
  const max = parseNumber(raw, 'max')
  if (max !== undefined) entry.max = max
  const step = parseNumber(raw, 'step')
  if (step !== undefined) entry.step = step

  if (type === 'scrollable' || type === 'scrollable-checkbox') {
    const valuesMatch = raw.match(/values\s*=\s*\{([^}]*)\}/)
    if (valuesMatch) {
      const vals = [...valuesMatch[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
      if (vals.length) entry.values = vals
    }
    const selected = parseNumber(raw, 'selected')
    if (selected !== undefined) entry.selected = selected
  }

  if (type === 'subMenu') {
    entry.categories = []
  }

  return entry
}

function splitTopLevelTables(inner) {
  const items = []
  let depth = 0
  let start = -1
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (c === '{') {
      if (depth === 0) start = i
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        items.push(inner.slice(start, i + 1))
        start = -1
      }
    }
  }
  return items
}

function parseCategories(blockText) {
  const catRe = /label\s*=\s*"([^"]+)"\s*,\s*tabs\s*=\s*\{/g
  const categories = []
  let m
  while ((m = catRe.exec(blockText)) !== null) {
    const label = m[1]
    const tabsStart = m.index + m[0].length
    let depth = 1
    let i = tabsStart
    for (; i < blockText.length && depth > 0; i++) {
      if (blockText[i] === '{') depth++
      else if (blockText[i] === '}') depth--
    }
    const tabsInner = blockText.slice(tabsStart, i - 1)
    const tabItems = splitTopLevelTables(tabsInner)
    const tabs = tabItems
      .map((t) => parseTabEntry(stripOnSelect(t)))
      .filter(Boolean)
    categories.push({ label, tabs })
  }
  return categories
}

function parseSections(blockText) {
  const sections = []
  for (const name of SECTION_ORDER) {
    const marker = `label = "${name}"`
    const idx = blockText.indexOf(marker)
    if (idx === -1) continue
    const slice = blockText.slice(idx)
    const catIdx = slice.indexOf('categories = {')
    if (catIdx === -1) continue
    let depth = 0
    let i = catIdx + 'categories = '.length
    for (; i < slice.length; i++) {
      if (slice[i] === '{') depth++
      else if (slice[i] === '}') {
        depth--
        if (depth === 0) {
          i++
          break
        }
      }
    }
    const catBlock = slice.slice(catIdx + 'categories = '.length, i)
    sections.push({ label: name, type: 'subMenu', categories: parseCategories(catBlock) })
  }
  return sections
}

const menu = parseSections(block)

let totalTabs = 0
for (const s of menu) {
  for (const c of s.categories || []) totalTabs += c.tabs?.length || 0
}

const ts = `// AUTO-GENERATED from Onimaru.lua BuildDefaultMenu — run: node scripts/extractMockMenu.mjs
import type { MenuEntry } from './types'

export const mockMenuSections: MenuEntry[] = ${JSON.stringify(menu, null, 2)} as MenuEntry[]

export const mockMenuMeta = {
  sections: ${menu.length},
  categories: ${menu.reduce((n, s) => n + (s.categories?.length || 0), 0)},
  tabs: ${totalTabs},
}
`

fs.writeFileSync(outPath, ts)
console.log(`Wrote ${outPath}`)
console.log(`Sections: ${menu.length}, tabs: ${totalTabs}`)
