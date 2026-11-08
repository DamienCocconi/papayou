import { useRef } from 'react'
import type { Card } from '../../engine'
import { GIFT_SIZE } from '../../engine'
import { cardName } from '../labels'
import { CardView } from './CardView'

interface Props {
  /** Contenu des places, dans l'ordre : une carte, ou `null` pour une place vide. */
  slots: readonly (Card | null)[]
  /** Don envoyé ou en cours d'envoi, ou partie en pause : ni retrait ni don. */
  locked: boolean
  onRemove: (cardId: string) => void
  onGive: () => void
  /** Change à chaque carte refusée parce que les places sont pleines : les emplacements réagissent. */
  fullBump: number | null
}

/**
 * Emplacements du don en éventail. Aucune logique de choix ici : le contenu et les actions viennent
 * de l'écran, qui tient le choix partagé avec la main.
 */
export function GiftSlots({ slots, locked, onRemove, onGive, fullBump }: Props) {
  const complete = slots.every((card) => card !== null)
  // Seul un refus survenu pendant que les emplacements sont affichés les fait réagir : à l'apparition
  // (manche suivante, retour en éventail), un refus plus ancien ne doit pas relancer la secousse.
  const shownBump = useRef(fullBump)
  const bump = fullBump !== null && fullBump !== shownBump.current
  return (
    <div className="gift-slots" aria-label="Cartes à donner" role="group">
      {/* La clé relance l'animation à chaque refus, même répété. */}
      <div key={bump ? fullBump : 'none'} className={`gift-row${bump ? ' bump' : ''}`}>
        {slots.map((card, i) => (
          <div key={card?.id ?? `empty-${i}`} className="gift-slot">
            {card === null ? (
              <div className="gift-place empty" role="img" aria-label={`Emplacement ${i + 1} vide`} />
            ) : (
              <div className="gift-place">
                <CardView card={card} />
              </div>
            )}
            {!locked && card !== null && (
              <button
                type="button"
                className="gift-remove"
                aria-label={`Remettre ${cardName(card)} dans la main`}
                title="Remettre dans la main"
                onClick={() => onRemove(card.id)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v13M6 12l6 6 6-6" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      {!locked && complete && (
        <button type="button" className="btn gift-give" onClick={onGive}>
          Donner ces {GIFT_SIZE} cartes
        </button>
      )}
    </div>
  )
}
