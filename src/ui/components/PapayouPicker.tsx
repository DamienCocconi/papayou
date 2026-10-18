import { SUITS } from '../../engine'
import type { Suit } from '../../engine'
import { SUIT_NAME, SUIT_SYMBOL } from '../labels'

export function PapayouPicker({ onPick }: { onPick: (suit: Suit) => void }) {
  return (
    <div className="picker">
      {SUITS.map((suit) => (
        <button
          key={suit}
          type="button"
          className={`btn${suit === 'hearts' || suit === 'diamonds' ? ' red' : ''}`}
          title={SUIT_NAME[suit]}
          aria-label={SUIT_NAME[suit]}
          onClick={() => onPick(suit)}
        >
          {SUIT_SYMBOL[suit]}
        </button>
      ))}
    </div>
  )
}
