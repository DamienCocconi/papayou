import { describe, expect, it } from 'vitest'
import { isTouchContextMenu } from './touchPress'

describe('menu contextuel venu du doigt', () => {
  it('reconnaît un contextmenu tactile ou au stylet par son type de pointeur', () => {
    expect(isTouchContextMenu('touch', 0)).toBe(true)
    expect(isTouchContextMenu('pen', 0)).toBe(true)
  })

  it('reconnaît un contextmenu sans type tant qu’un doigt est posé', () => {
    expect(isTouchContextMenu(undefined, 1)).toBe(true)
    expect(isTouchContextMenu('', 1)).toBe(true)
  })

  it('laisse passer le clic droit et la touche Menu quand aucun doigt n’est posé', () => {
    expect(isTouchContextMenu('mouse', 0)).toBe(false)
    expect(isTouchContextMenu(undefined, 0)).toBe(false)
    expect(isTouchContextMenu('', 0)).toBe(false)
  })
})
