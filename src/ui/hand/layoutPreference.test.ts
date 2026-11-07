import { describe, expect, it } from 'vitest'
import { LAYOUT_KEY, readLayout, writeLayout } from './layoutPreference'
import type { StorageLike } from './layoutPreference'

function fakeStorage(initial: Record<string, string> = {}): StorageLike {
  const data = { ...initial }
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

const broken: StorageLike = {
  getItem: () => {
    throw new Error('indisponible')
  },
  setItem: () => {
    throw new Error('indisponible')
  },
}

describe('layoutPreference', () => {
  it('donne l’éventail quand rien n’est enregistré', () => {
    expect(readLayout(fakeStorage())).toBe('fan')
  })

  it('donne l’éventail pour une valeur inconnue', () => {
    expect(readLayout(fakeStorage({ [LAYOUT_KEY]: 'carrousel' }))).toBe('fan')
  })

  it('relit la valeur enregistrée', () => {
    const storage = fakeStorage()
    writeLayout(storage, 'spread')
    expect(readLayout(storage)).toBe('spread')
    writeLayout(storage, 'fan')
    expect(readLayout(storage)).toBe('fan')
  })

  it('ne propage pas les exceptions du stockage', () => {
    expect(readLayout(broken)).toBe('fan')
    expect(() => writeLayout(broken, 'spread')).not.toThrow()
  })

  it('accepte l’absence de stockage', () => {
    expect(readLayout(null)).toBe('fan')
    expect(() => writeLayout(null, 'spread')).not.toThrow()
  })
})
