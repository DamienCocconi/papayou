import { useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import type { Card } from '../../engine'
import frameImage from '../assets/trumps/frame.webp'
import { useCardInspect } from '../cards/cardInspect'
import { contextMenuFromTouch } from '../cards/touchPress'
import { useLongPress } from '../cards/useLongPress'
import { numberInkShift } from '../cards/numberInk'
import { trumpArt, type TrumpArt } from '../cards/trumpArt'
import { cardName, rankLabel, SUIT_SYMBOL } from '../labels'

interface Props {
  /** Absente : dos de carte (main cachée). */
  card?: Card
  selected?: boolean
  disabled?: boolean
  small?: boolean
  onClick?: () => void
  /**
   * Agrandissement par appui long au doigt (atout illustré seulement). Désactivé dans l'éventail, où le
   * geste de la main décide lui-même (appui long sur la carte en emphase). Le clic droit reste actif.
   */
  longPress?: boolean
}

/** Teinte rouge pour cœur et carreau ; le symbole est toujours affiché en plus (lisible sans la couleur). */
function face(card: Card): { className: string; corner: string; symbol: string } {
  switch (card.kind) {
    case 'suit': {
      const red = card.suit === 'hearts' || card.suit === 'diamonds'
      return { className: red ? 'red' : '', corner: rankLabel(card.rank), symbol: SUIT_SYMBOL[card.suit] }
    }
    case 'trump':
      return { className: 'trump', corner: String(card.value), symbol: 'Atout' }
    case 'excuse':
      return { className: 'excuse', corner: '0', symbol: 'Excuse' }
  }
}

/** Calques d'un atout illustré : illustration, cadre commun, numéro, titre. Les images sont décoratives. */
function IllustratedFace({ art, number }: { art: TrumpArt; number: string }) {
  // Une illustration qui ne charge pas est masquée : cadre, numéro et titre restent lisibles.
  const [broken, setBroken] = useState(false)
  return (
    <>
      {!broken && <img className="art" src={art.image} alt="" draggable={false} onError={() => setBroken(true)} />}
      <img className="frame" src={frameImage} alt="" draggable={false} />
      <span className="art-number" style={{ '--number-shift': `${numberInkShift(number)}em` } as CSSProperties}>
        <span>{number}</span>
      </span>
      <span className="art-title" style={{ '--title-length': art.title.length } as CSSProperties}>
        <span>{art.title}</span>
      </span>
    </>
  )
}

export function CardView({ card, selected, disabled, small, onClick, longPress = true }: Props) {
  const art = card === undefined ? null : trumpArt(card)
  // Seul un atout illustré s'agrandit, et seulement là où l'écran le permet (contexte présent).
  const inspect = useCardInspect()
  const inspectCard = inspect !== null && art !== null && card !== undefined ? () => inspect(card) : null
  const press = useLongPress(longPress ? inspectCard : null)

  if (card === undefined) return <div className={`card back${small ? ' small' : ''}`} aria-label="Carte cachée" />
  const { className, corner, symbol } = face(card)
  // Clic droit (ou touche Menu) : agrandit la carte. Venu du doigt, c'est le menu qu'Android envoie de
  // lui-même vers 500 ms : on l'ignore, l'appui long garde son propre délai (et sa règle dans l'éventail).
  const inspectHandlers =
    inspectCard === null
      ? {}
      : {
          ...press.handlers,
          onContextMenu: (e: MouseEvent) => {
            e.preventDefault()
            if (!contextMenuFromTouch(e.nativeEvent)) inspectCard()
          },
        }
  const classes = ['card', className, art !== null ? 'illustrated' : '', small ? 'small' : '', selected ? 'selected' : '', disabled ? 'disabled' : '']
    .filter(Boolean)
    .join(' ')
  const content =
    art !== null ? (
      <IllustratedFace key={card.id} art={art} number={corner} />
    ) : (
      <>
        <span className="corner">
          <span className="rank">{corner}</span>
          {card.kind === 'suit' && <span className="corner-suit">{symbol}</span>}
        </span>
        <span className="symbol">{symbol}</span>
      </>
    )
  if (onClick === undefined) {
    return (
      <div className={classes} title={cardName(card)} {...inspectHandlers}>
        {content}
      </div>
    )
  }
  return (
    <button
      type="button"
      className={classes}
      title={cardName(card)}
      aria-pressed={selected}
      // Grisée par aria-disabled plutôt que disabled : un bouton désactivé ne reçoit pas de façon fiable
      // le clic droit ni l'appui long, qui doivent pouvoir agrandir un atout grisé. Le clic est ignoré ici.
      aria-disabled={disabled === true ? true : undefined}
      onClick={disabled === true ? undefined : onClick}
      {...inspectHandlers}
    >
      {content}
    </button>
  )
}
