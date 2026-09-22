import type { ConfigOption, YachtConfiguration } from '../types/sharedTypes'
import { DEFAULT_CONFIGURATION } from './defaults'
import {
  ACCENT_STRIPES,
  DECKS,
  DETAILS,
  HULL_COLORS,
  SUNPADS,
  UPHOLSTERIES,
} from './options'
import { formatPrice, getTotalPrice } from './price'

type SharePayload = {
  m: string
  h: string
  a: string
  s: string
  d: string
  u: string
  t: string[]
}

function findLabel(options: readonly ConfigOption[], id: string) {
  return options.find((option) => option.id === id)?.label ?? id
}

export function encodeConfig(config: YachtConfiguration): string {
  const payload: SharePayload = {
    m: config.model,
    h: config.hullColor,
    a: config.accentStripe,
    s: config.sunpad,
    d: config.deck,
    u: config.upholstery,
    t: config.details,
  }

  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeConfig(raw: string): YachtConfiguration | null {
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const binary = atob(padded + pad)
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as SharePayload

    return {
      model: payload.m || DEFAULT_CONFIGURATION.model,
      hullColor: payload.h || DEFAULT_CONFIGURATION.hullColor,
      accentStripe: payload.a || DEFAULT_CONFIGURATION.accentStripe,
      sunpad: payload.s || DEFAULT_CONFIGURATION.sunpad,
      deck: payload.d || DEFAULT_CONFIGURATION.deck,
      upholstery: payload.u || DEFAULT_CONFIGURATION.upholstery,
      details: Array.isArray(payload.t)
        ? payload.t
        : [...DEFAULT_CONFIGURATION.details],
    }
  } catch {
    return null
  }
}

export function buildShareUrl(config: YachtConfiguration, base = window.location.href) {
  const url = new URL(base)
  url.searchParams.set('cfg', encodeConfig(config))
  return url.toString()
}

export function readConfigFromUrl(search = window.location.search) {
  const cfg = new URLSearchParams(search).get('cfg')
  if (!cfg) return null
  return decodeConfig(cfg)
}

export function buildQuoteText(config: YachtConfiguration): string {
  const lines = [
    'OceanCraft — Configuration Quote',
    `Model: ${config.model}`,
    '',
    `Hull: ${findLabel(HULL_COLORS, config.hullColor)}`,
    `Accent stripe: ${findLabel(ACCENT_STRIPES, config.accentStripe)}`,
    `Sunpad: ${findLabel(SUNPADS, config.sunpad)}`,
    `Deck: ${findLabel(DECKS, config.deck)}`,
    `Upholstery: ${findLabel(UPHOLSTERIES, config.upholstery)}`,
    `Details: ${
      config.details.length
        ? config.details.map((id) => findLabel(DETAILS, id)).join(', ')
        : 'None'
    }`,
    '',
    `Total: ${formatPrice(getTotalPrice(config))}`,
    `Generated: ${new Date().toLocaleString()}`,
  ]

  return lines.join('\n')
}

export function downloadQuote(config: YachtConfiguration) {
  const text = buildQuoteText(config)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${config.model}-quote.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}
