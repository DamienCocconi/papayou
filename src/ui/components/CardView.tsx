import type { Card } from '../../engine'
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

export function CardView({ card, selected, disabled, small, onClick }: Props) {
  if (card === undefined) return <div className={`card back${small ? ' small' : ''}`} aria-label="Carte cachée" />
  const { className, corner, symbol } = face(card)
  const classes = ['card', className, small ? 'small' : '', selected ? 'selected' : '', disabled ? 'disabled' : '']
    .filter(Boolean)
    .join(' ')
  const content = (
    <>
      <span className="corner">{corner}</span>
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
