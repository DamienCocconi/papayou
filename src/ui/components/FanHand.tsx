import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Card } from '../../engine'
import { emphasisLayout, heldLayout, playLineY } from '../hand/emphasis'
import type { CardBox, DisplayedSlot, ScreenBounds } from '../hand/emphasis'
import { FAN_LIFT, fanCardSize, fanHeight, fanLayout, fanScale } from '../hand/fanLayout'
import { gestureCardId } from '../hand/handGesture'
import { useElementWidth } from '../hand/useElementWidth'
import { useHandGesture } from '../hand/useHandGesture'
import { useViewportSize } from '../hand/useViewportSize'
import { cardName } from '../labels'
import { CardView } from './CardView'

interface Props {
  cards: readonly Card[]
  /** Dit si une carte peut être jouée : lu au moment de la prise, puis du relâchement. */
  canPlay: (cardId: string) => boolean
  /** Une carte grisée reste lisible, mais se distingue des autres. */
  isDisabled: (cardId: string) => boolean
  markedIds?: ReadonlySet<string> | undefined
  /** Carte en emphase conservée d'un geste à l'autre : c'est la sélection de `Hand`. */
  emphasizedId: string | null
  onSelect: (cardId: string | null) => void
  /** Renvoie faux si le coup est refusé tout de suite. */
  onPlay: (cardId: string) => boolean
  onRefuse: (cardId: string) => void
  /** Change à chaque refus de l'hôte, même s'il répète le précédent (null : aucun). */
  remoteRefusal: number | null
}

function transformOf(slot: DisplayedSlot): string {
  return `translate(${slot.x}px, ${slot.y}px) rotate(${slot.rotation}deg) scale(${slot.scale})`
}

/** Main en éventail, pilotée par le geste : le conteneur reçoit le pointeur, pas chaque carte. */
export function FanHand({ cards, canPlay, isDisabled, markedIds, emphasizedId, onSelect, onPlay, onRefuse, remoteRefusal }: Props) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>(true)
  const viewport = useViewportSize()
  const scale = fanScale(viewport.width, viewport.height)
  const size = fanCardSize(scale)
  const box: CardBox = { width: size.width, height: size.height, lift: FAN_LIFT * scale }

  // Position du conteneur dans l'écran : les bornes de l'emphase et la ligne de jeu en dépendent.
  // Mesurée à chaque rendu, et quand l'écran de jeu change de taille : à la rotation du téléphone, la
  // mise en page finale peut arriver après l'événement `resize`, et la position retenue serait périmée.
  const [origin, setOrigin] = useState({ left: 0, top: 0 })
  const measureOrigin = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect === undefined) return
    setOrigin((cur) => (cur.left === rect.left && cur.top === rect.top ? cur : { left: rect.left, top: rect.top }))
  }, [containerRef])
  useLayoutEffect(measureOrigin)
  useLayoutEffect(() => {
    const game = containerRef.current?.closest('.game')
    if (game == null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measureOrigin)
    observer.observe(game)
    return () => observer.disconnect()
  }, [containerRef, measureOrigin])
  const bounds: ScreenBounds = {
    left: -origin.left,
    right: viewport.width - origin.left,
    top: -origin.top,
    bottom: viewport.height - origin.top,
  }
  const slots = fanLayout(cards.length, width, scale)

  const heldRef = useRef<HTMLDivElement>(null)
  const { state, handlers } = useHandGesture({
    containerRef,
    context: {
      cardIds: cards.map((card) => card.id),
      slots,
      cardSize: size,
      lineY: playLineY(bounds),
      screenTop: bounds.top,
      emphasizedId,
      canPlay,
    },
    onPlay,
    onRefuse,
    onSelect,
    onHeldMove: (x, y) => {
      if (heldRef.current !== null) heldRef.current.style.transform = transformOf(heldLayout(x, y, box, bounds))
    },
    remoteRefusal,
  })

  // Toucher ailleurs retire l'emphase conservée. Les boutons gardent leur rôle : changer d'affichage
  // doit au contraire la transmettre à l'étalé.
  useEffect(() => {
    if (emphasizedId === null) return
    function dismiss(e: PointerEvent) {
      if (e.target instanceof Element && e.target.closest('.hand.fan, button, a, input, select') !== null) return
      onSelect(null)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [emphasizedId, onSelect])

  const gestureId = gestureCardId(state)
  const pending = state.phase === 'pending'
  // La carte en attente a quitté l'éventail, qui se referme derrière elle.
  const emphasisId = pending ? null : (gestureId ?? emphasizedId)
  const emphasisIndex = emphasisId === null ? -1 : cards.findIndex((card) => card.id === emphasisId)
  const displayed = emphasisLayout(slots, emphasisIndex < 0 ? null : emphasisIndex, box, bounds)

  // La situation peut changer pendant la prise (pause) : le signal ne promet pas un coup qui sera refusé.
  const stillPlayable = state.phase === 'holding' && canPlay(state.cardId)
  const willPlay = state.phase === 'holding' && state.aboveLine && stillPlayable
  const holdLabel = !stillPlayable
    ? 'Cette carte ne peut plus être jouée'
    : willPlay
      ? 'Relâchez pour jouer'
      : 'Tirez au-dessus de la ligne pour jouer'

  return (
    <div
      ref={containerRef}
      className="hand fan"
      role="group"
      aria-label="Votre main"
      style={
        {
          height: fanHeight(scale),
          '--card-w': `${size.width}px`,
          '--card-h': `${size.height}px`,
          '--fan-k': scale,
        } as CSSProperties
      }
      {...handlers}
    >
      {state.phase === 'holding' && (
        <div
          className={`play-line${willPlay ? ' crossed' : ''}`}
          style={{ top: state.lineY, left: bounds.left, width: bounds.right - bounds.left }}
        >
          <span>{holdLabel}</span>
        </div>
      )}
      {width > 0 &&
        cards.map((card, i) => {
          const slot = displayed[i]
          if (slot === undefined) return null
          const isGestureCard = card.id === gestureId
          const held = state.phase === 'holding' && isGestureCard
          const waiting = pending && isGestureCard
          const free = (held || waiting) && (state.phase === 'holding' || state.phase === 'pending')
          const shown = free ? heldLayout(state.x, state.y, box, bounds) : slot
          const emphasized = i === emphasisIndex
          const classes = [
            'fan-slot',
            emphasized ? 'emphasized' : '',
            free ? 'held' : '',
            held && willPlay ? 'ready' : '',
            state.phase === 'scrubbing' && isGestureCard && state.refused ? 'refused' : '',
          ]
          return (
            <div
              key={card.id}
              ref={held ? heldRef : undefined}
              className={classes.filter(Boolean).join(' ')}
              role="img"
              aria-label={cardName(card)}
              data-card-id={emphasized ? card.id : undefined}
              style={{ transform: transformOf(shown), zIndex: emphasized || free ? 1000 : i + 1 }}
            >
              <CardView card={card} selected={markedIds?.has(card.id) === true} disabled={isDisabled(card.id)} />
            </div>
          )
        })}
    </div>
  )
}
