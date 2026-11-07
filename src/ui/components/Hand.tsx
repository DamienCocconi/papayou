import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Card } from '../../engine'
import { GIFT_SIZE } from '../../engine'
import { fanCardSize, fanHeight, fanLayout, fanScale } from '../hand/fanLayout'
import type { HandLayout } from '../hand/layoutPreference'
import { useElementWidth } from '../hand/useElementWidth'
import { useViewportSize } from '../hand/useViewportSize'
import { CardView } from './CardView'

interface Props {
  cards: readonly Card[]
  /**
   * - play : un clic sélectionne une carte jouable, un second clic la joue ;
   * - give : sélection de GIFT_SIZE cartes, validée par un bouton ;
   * - view : affichage seul.
   */
  mode: 'play' | 'give' | 'view'
  /** Affichage : en arc (`fan`) ou en grille (`spread`). Changer d'affichage garde la sélection. */
  layout: HandLayout
  /**
   * Change quand la situation change (phase, manche, pli, taille de la main) : la sélection
   * est alors considérée comme vide.
   */
  resetKey: string
  /** Ids jouables (mode play). Les autres cartes sont grisées. */
  playableIds?: ReadonlySet<string>
  /** Ids mis en avant en mode view (par exemple les cartes déjà données). */
  markedIds?: ReadonlySet<string>
  onPlay?: (cardId: string) => void
  onGive?: (cardIds: string[]) => void
}

/**
 * La sélection est de l'état d'interface, pas de l'état de jeu : le moteur n'en sait rien.
 * Elle est stockée avec la `resetKey` pour laquelle elle est valable : si la clé a changé, elle
 * est vide, sans rendu intermédiaire périmé et sans remonter la main (les cartes gardent leur
 * élément du DOM, ce qui permet aux transitions de l'éventail de glisser).
 */
export function Hand({ cards, mode, layout, resetKey, playableIds, markedIds, onPlay, onGive }: Props) {
  const [stored, setStored] = useState<{ key: string; ids: string[] }>({ key: resetKey, ids: [] })
  const selected = stored.key === resetKey ? stored.ids : []
  const fan = layout === 'fan'
  const [fanRef, width] = useElementWidth<HTMLDivElement>(fan)
  const viewport = useViewportSize()
  const scale = fanScale(viewport.width, viewport.height)
  const cardSize = fanCardSize(scale)

  function click(card: Card) {
    if (mode === 'play') {
      if (playableIds?.has(card.id) !== true) return
      if (selected[0] === card.id) onPlay?.(card.id)
      else setStored({ key: resetKey, ids: [card.id] })
    } else if (mode === 'give') {
      setStored((cur) => {
        const ids = cur.key === resetKey ? cur.ids : []
        if (ids.includes(card.id)) return { key: resetKey, ids: ids.filter((id) => id !== card.id) }
        return ids.length >= GIFT_SIZE ? cur : { key: resetKey, ids: [...ids, card.id] }
      })
    }
  }

  function cardView(card: Card) {
    return (
      <CardView
        key={card.id}
        card={card}
        selected={selected.includes(card.id) || markedIds?.has(card.id) === true}
        disabled={mode === 'play' && playableIds?.has(card.id) !== true}
        onClick={mode === 'view' ? undefined : () => click(card)}
      />
    )
  }

  const slots = fan ? fanLayout(cards.length, width, scale) : []

  return (
    <div>
      {fan ? (
        <div
          ref={fanRef}
          className="hand fan"
          style={
            {
              height: fanHeight(scale),
              '--card-w': `${cardSize.width}px`,
              '--card-h': `${cardSize.height}px`,
              '--fan-k': scale,
            } as CSSProperties
          }
        >
          {width > 0 &&
            cards.map((card, i) => {
              const slot = slots[i]
              if (slot === undefined) return null
              const lifted = selected.includes(card.id)
              return (
                <div
                  key={card.id}
                  className="fan-slot"
                  style={{
                    transform: `translate(${slot.x}px, ${slot.y}px) rotate(${slot.rotation}deg)`,
                    zIndex: lifted ? 1000 : i + 1,
                  }}
                >
                  {cardView(card)}
                </div>
              )
            })}
        </div>
      ) : (
        <div className="hand">
          {cards.map(cardView)}
        </div>
      )}
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
