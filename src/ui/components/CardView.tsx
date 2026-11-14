import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Card } from '../../engine'
import frameImage from '../assets/trumps/frame.webp'
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

export function CardView({ card, selected, disabled, small, onClick }: Props) {
  if (card === undefined) return <div className={`card back${small ? ' small' : ''}`} aria-label="Carte cachée" />
  const { className, corner, symbol } = face(card)
  const art = trumpArt(card)
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
      <div className={classes} title={cardName(card)}>
        {content}
      </div>
    )
  }
  return (
    <button type="button" className={classes} title={cardName(card)} aria-pressed={selected} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  )
}
