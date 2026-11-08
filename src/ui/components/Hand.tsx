import { useCallback, useMemo, useState } from 'react'
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
   * - give : choix des cartes à donner, par clic en étalé, en les tirant vers les emplacements en éventail ;
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
  /**
   * Pendant l'échange seulement : cartes choisies pour le don, ou déjà données, dans l'ordre des
   * emplacements. Sélectionnées en étalé, retirées de l'éventail.
   */
  giftIds?: readonly string[] | undefined
  /** Clic sur une carte en étalé pendant le choix du don : la place ou la retire. */
  onToggleGift?: (cardId: string) => void
  onGive?: () => void
  /** Éventail : dit si une carte peut partir de la main (coup légal, ou place libre pendant l'échange). */
  canRelease?: (cardId: string) => boolean
  /**
   * Carte jouée (second clic en étalé) ou relâchée au-dessus de la ligne en éventail. Renvoie vrai si
   * elle attend une réponse (coup envoyé), faux si c'est réglé tout de suite (refus, carte placée).
   */
  onRelease?: (cardId: string) => boolean
  /** Une carte a été tirée en éventail alors qu'elle ne peut pas partir. */
  onRefuse?: (cardId: string) => void
  /** Change à chaque refus de l'hôte reçu après l'envoi d'un coup (null : aucun). */
  playRefusal?: number | null
}

/**
 * La sélection est de l'état d'interface, pas de l'état de jeu : le moteur n'en sait rien.
 * Elle est stockée avec la `resetKey` pour laquelle elle est valable : si la clé a changé, elle
 * est vide, sans rendu intermédiaire périmé et sans remonter la main (les cartes gardent leur
 * élément du DOM, ce qui permet aux transitions de l'éventail de glisser).
 * En éventail, la même donnée est l'emphase conservée après le lever du doigt. Pendant l'échange,
 * elle ne sert qu'à l'emphase : le choix du don arrive à part, par `giftIds`, et lire une carte ne
 * la choisit pas.
 */
export function Hand({
  cards,
  mode,
  layout,
  resetKey,
  playableIds,
  giftIds,
  onToggleGift,
  onGive,
  canRelease,
  onRelease,
  onRefuse,
  playRefusal,
}: Props) {
  const [stored, setStored] = useState<{ key: string; ids: string[] }>({ key: resetKey, ids: [] })
  const fan = layout === 'fan'

  // Quand la situation change, on ajuste la sélection pendant le rendu (idiome React pour adapter un état
  // à une prop). En étalé, elle est perdue pour de bon : elle ne doit pas revenir en changeant d'affichage.
  // En éventail, l'emphase reste jusqu'à ce que le joueur touche ailleurs : un coup d'un autre joueur ne la
  // retire pas tant que la carte est en main, et passer en étalé la transmet comme sélection.
  if (stored.key !== resetKey) {
    const [id] = stored.ids
    const keep = fan && stored.ids.length === 1 && cards.some((card) => card.id === id)
    setStored({ key: resetKey, ids: keep ? stored.ids : [] })
  }
  // Une carte choisie pour le don (en étalé par exemple) quitte l'éventail : elle perd son emphase, comme
  // une carte placée par le geste, et ne la retrouve pas en revenant dans la main.
  if (stored.ids.length === 1 && giftIds?.includes(stored.ids[0] ?? '') === true) {
    setStored({ key: resetKey, ids: [] })
  }
  const selected = stored.key === resetKey ? stored.ids : []

  const select = useCallback((cardId: string | null) => {
    setStored({ key: resetKey, ids: cardId === null ? [] : [cardId] })
  }, [resetKey])

  // En éventail, les cartes placées dans les emplacements (ou données) quittent la main affichée ; chacune
  // garde son identité, et reprend donc sa place dans l'ordre de la main quand elle revient.
  const fanCards = useMemo(
    () => (giftIds === undefined ? cards : cards.filter((card) => !giftIds.includes(card.id))),
    [cards, giftIds],
  )

  function isSelected(cardId: string): boolean {
    return giftIds === undefined ? selected.includes(cardId) : giftIds.includes(cardId)
  }

  function click(card: Card) {
    if (mode === 'play') {
      if (playableIds?.has(card.id) !== true) return
      if (selected[0] === card.id) onRelease?.(card.id)
      else setStored({ key: resetKey, ids: [card.id] })
    } else if (mode === 'give') {
      onToggleGift?.(card.id)
    }
  }

  const chosen = giftIds?.length ?? 0

  return (
    <div>
      {fan ? (
        <FanHand
          cards={fanCards}
          purpose={giftIds === undefined ? 'play' : 'gift'}
          canPlay={(cardId) => canRelease?.(cardId) ?? false}
          isDisabled={(cardId) => mode === 'play' && playableIds?.has(cardId) !== true}
          emphasizedId={selected.length === 1 ? (selected[0] ?? null) : null}
          onSelect={select}
          onRelease={(cardId) => onRelease?.(cardId) ?? false}
          onRefuse={(cardId) => onRefuse?.(cardId)}
          remoteRefusal={playRefusal ?? null}
        />
      ) : (
        <div className="hand">
          {cards.map((card) => (
            <CardView
              key={card.id}
              card={card}
              selected={isSelected(card.id)}
              disabled={mode === 'play' && playableIds?.has(card.id) !== true}
              onClick={mode === 'view' ? undefined : () => click(card)}
            />
          ))}
        </div>
      )}
      {mode === 'give' && !fan && (
        <div className="hand-actions">
          <button type="button" className="btn" disabled={chosen !== GIFT_SIZE} onClick={onGive}>
            Donner ces {GIFT_SIZE} cartes ({chosen}/{GIFT_SIZE})
          </button>
        </div>
      )}
    </div>
  )
}
