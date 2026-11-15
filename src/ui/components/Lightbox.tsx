import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  /** Appelé au premier clic ou toucher n'importe où sur le calque, ou à la touche Échap. */
  onClose: () => void
  /** Nom accessible du calque, lu par les lecteurs d'écran. */
  label: string
  children: ReactNode
}

/**
 * Calque plein écran, réutilisable pour tout contenu à montrer en grand (QR code d'invitation,
 * illustration d'un atout...) : fond assombri qui laisse voir l'écran de derrière, rendu inerte.
 *
 * Ouvert = monté : c'est l'écran appelant qui décide de l'afficher. Rendu par portail dans `body`,
 * hors de `#root`, pour passer devant tout l'écran de jeu quels que soient ses `z-index`.
 */
export function Lightbox({ onClose, label, children }: Props) {
  const layer = useRef<HTMLDivElement>(null)
  // Toujours la dernière version de onClose, sans relancer l'effet (et donc sans rendre le focus) à chaque rendu.
  const close = useRef(onClose)
  close.current = onClose

  // Effet de mise en page (synchrone) plutôt qu'effet passif : quand le calque disparaît avec l'écran qui l'a
  // ouvert (partie qui démarre, salle fermée), `inert` est retiré avant que le nouvel écran ne soit affiché.
  useLayoutEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.getElementById('root')
    const previousOverflow = document.body.style.overflow
    // Écran de derrière inaccessible au clic, au clavier et aux lecteurs d'écran ; page bloquée.
    // Limite connue : un seul calque à la fois. Deux calques superposés (par exemple un atout agrandi
    // par-dessus le QR code) se partageraient `inert` et `overflow` : le premier fermé réactiverait l'écran
    // de derrière alors que l'autre est encore ouvert. Il faudrait alors un compteur de calques ouverts.
    root?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'
    layer.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close.current()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      root?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
      // Le bouton d'ouverture a pu disparaître avec son écran : on ne rend le focus qu'à un élément encore affiché.
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  // Fermeture au click, jamais au pointerdown : sinon le calque disparaîtrait sous le doigt
  // et le click qui suit tomberait sur l'écran de derrière. Le contenu ne bloque pas la propagation :
  // un clic sur lui ferme aussi.
  return createPortal(
    <div ref={layer} className="lightbox" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onClick={onClose}>
      <div className="lightbox-content">{children}</div>
    </div>,
    document.body,
  )
}
