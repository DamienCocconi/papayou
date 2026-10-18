import { useState } from 'react'
import type { Card } from '../../engine'
import { GIFT_SIZE } from '../../engine'
import { CardView } from './CardView'

interface Props {
  cards: readonly Card[]
  /**
   * - play : un clic sélectionne une carte jouable, un second clic la joue ;
   * - give : sélection de GIFT_SIZE cartes, validée par un bouton ;
   * - view : affichage seul.
   */
  mode: 'play' | 'give' | 'view'
  /** Ids jouables (mode play). Les autres cartes sont grisées. */
  playableIds?: ReadonlySet<string>
  /** Ids mis en avant en mode view (par exemple les cartes déjà données). */
  markedIds?: ReadonlySet<string>
  onPlay?: (cardId: string) => void
  onGive?: (cardIds: string[]) => void
}

/**
 * La sélection est de l'état d'interface, pas de l'état de jeu : le moteur n'en sait rien.
 * Le parent donne une `key` qui change quand la situation change : React recrée alors la main
 * et la sélection repart de zéro, sans rendu intermédiaire périmé.
 */
export function Hand({ cards, mode, playableIds, markedIds, onPlay, onGive }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  function click(card: Card) {
    if (mode === 'play') {
      if (playableIds?.has(card.id) !== true) return
      if (selected[0] === card.id) onPlay?.(card.id)
      else setSelected([card.id])
    } else if (mode === 'give') {
      setSelected((cur) => {
        if (cur.includes(card.id)) return cur.filter((id) => id !== card.id)
        return cur.length >= GIFT_SIZE ? cur : [...cur, card.id]
      })
    }
  }

  return (
    <div>
      <div className="hand">
        {cards.map((card) => (
          <CardView
            key={card.id}
            card={card}
            selected={selected.includes(card.id) || markedIds?.has(card.id) === true}
            disabled={mode === 'play' && playableIds?.has(card.id) !== true}
            onClick={mode === 'view' ? undefined : () => click(card)}
          />
        ))}
      </div>
      {mode === 'give' && (
        <div className="hand-actions">
          <button type="button" className="btn" disabled={selected.length !== GIFT_SIZE} onClick={() => onGive?.(selected)}>
            Donner ces {GIFT_SIZE} cartes ({selected.length}/{GIFT_SIZE})
          </button>
        </div>
      )}
    </div>
  )
}
