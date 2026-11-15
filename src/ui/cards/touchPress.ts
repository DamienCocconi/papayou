/**
 * Doigts (et stylets) posés sur l'écran, suivis pour toute la page.
 *
 * Sur Android, garder le doigt posé fait envoyer au navigateur un `contextmenu` vers 500 ms, le même
 * événement que le clic droit. Il ne doit pas agrandir la carte : au doigt, seul notre appui long compte
 * (700 ms, et dans l'éventail seulement sur la carte en emphase). Le suivi est global, et non par carte,
 * parce que dans l'éventail le doigt peut avoir été posé ailleurs que sur la carte qui reçoit l'événement.
 */

const pressing = new Set<number>()

/** Vrai si un `contextmenu` vient du doigt : type de pointeur tactile, ou doigt encore posé quelque part. */
export function isTouchContextMenu(pointerType: string | undefined, touchesDown: number): boolean {
  return pointerType === 'touch' || pointerType === 'pen' || touchesDown > 0
}

/** Pour un événement `contextmenu` reçu : vient-il d'un doigt ? */
export function contextMenuFromTouch(event: MouseEvent): boolean {
  const pointerType = 'pointerType' in event && typeof event.pointerType === 'string' ? event.pointerType : undefined
  return isTouchContextMenu(pointerType, pressing.size)
}

/** Commence le suivi des doigts posés ; renvoie la fonction qui l'arrête (à appeler au démontage). */
export function trackTouches(): () => void {
  function down(e: PointerEvent) {
    if (e.pointerType !== 'mouse') pressing.add(e.pointerId)
  }
  function lift(e: PointerEvent) {
    pressing.delete(e.pointerId)
  }
  // Phase de capture : le suivi ne dépend pas de ce que font les éléments (capture du pointeur, arrêt de propagation).
  window.addEventListener('pointerdown', down, true)
  window.addEventListener('pointerup', lift, true)
  window.addEventListener('pointercancel', lift, true)
  return () => {
    window.removeEventListener('pointerdown', down, true)
    window.removeEventListener('pointerup', lift, true)
    window.removeEventListener('pointercancel', lift, true)
    pressing.clear()
  }
}
