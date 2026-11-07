import { useCallback, useState } from 'react'
import type { Card } from '../../engine'
import { GIFT_SIZE } from '../../engine'
import type { HandLayout } from '../hand/layoutPreference'
import { CardView } from './CardView'
import { FanHand } from './FanHand'

interface Props {
  cards: readonly Card[]
  /**
   * - play : en étalé, un clic sélectionne une carte jouable et un second clic la joue ; en éventail,
   *   on tire la carte vers le haut ;
   * - give : sélection de GIFT_SIZE cartes, validée par un bouton (toujours en étalé) ;
   * - view : affichage seul.
   */
  mode: 'play' | 'give' | 'view'
  /** Affichage : en arc (`fan`) ou en grille (`spread`). Changer d'affichage garde la sélection. */
  layout: HandLayout
  /**
   * Change quand la situation change (phase, manche, pli, taille de la main) : en étalé, la sélection
   * est alors considérée comme vide.
   */
  resetKey: string
  /** Ids jouables (mode play). Les autres cartes sont grisées. */
  playableIds?: ReadonlySet<string>
  /** Ids mis en avant en mode view (par exemple les cartes déjà données). */
  markedIds?: ReadonlySet<string>
  /** Renvoie faux si le coup est refusé tout de suite. */
  onPlay?: (cardId: string) => boolean
  onGive?: (cardIds: string[]) => void
  /** Une carte a été tirée en éventail alors qu'elle ne peut pas être jouée. */
  onRefuse?: (cardId: string) => void
  /** Change à chaque refus de l'hôte reçu après l'envoi d'un coup (null : aucun). */
  playRefusal?: number | null
}

/**
 * La sélection est de l'état d'interface, pas de l'état de jeu : le moteur n'en sait rien.
 * Elle est stockée avec la `resetKey` pour laquelle elle est valable : si la clé a changé, elle
 * est vide, sans rendu intermédiaire périmé et sans remonter la main (les cartes gardent leur
 * élément du DOM, ce qui permet aux transitions de l'éventail de glisser).
 * En éventail, la même donnée est l'emphase conservée après le lever du doigt.
 */
export function Hand({ cards, mode, layout, resetKey, playableIds, markedIds, onPlay, onGive, onRefuse, playRefusal }: Props) {
  const [stored, setStored] = useState<{ key: string; ids: string[] }>({ key: resetKey, ids: [] })
  const fan = layout === 'fan'

  // Quand la situation change, on ajuste la sélection pendant le rendu (idiome React pour adapter un état
  // à une prop). En étalé, elle est perdue pour de bon : elle ne doit pas revenir en changeant d'affichage.
  // En éventail, l'emphase reste jusqu'à ce que le joueur touche ailleurs : un coup d'un autre joueur ne la
  // retire pas tant que la carte est en main, et passer en étalé la transmet comme sélection.
  // Une sélection de plusieurs cartes vient du don, et ne devient pas une emphase.
  if (stored.key !== resetKey) {
    const [id] = stored.ids
    const keep = fan && stored.ids.length === 1 && cards.some((card) => card.id === id)
    setStored({ key: resetKey, ids: keep ? stored.ids : [] })
  }
  const selected = stored.key === resetKey ? stored.ids : []

  const select = useCallback((cardId: string | null) => {
    setStored({ key: resetKey, ids: cardId === null ? [] : [cardId] })
  }, [resetKey])

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

  return (
    <div>
      {fan ? (
        <FanHand
          cards={cards}
          canPlay={(cardId) => mode === 'play' && playableIds?.has(cardId) === true}
          isDisabled={(cardId) => mode === 'play' && playableIds?.has(cardId) !== true}
          markedIds={markedIds}
          emphasizedId={selected.length === 1 ? (selected[0] ?? null) : null}
          onSelect={select}
          onPlay={(cardId) => onPlay?.(cardId) ?? false}
          onRefuse={(cardId) => onRefuse?.(cardId)}
          remoteRefusal={playRefusal ?? null}
        />
      ) : (
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
