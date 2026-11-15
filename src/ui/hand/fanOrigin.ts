/**
 * Position de l'éventail dans l'écran, mesurée après chaque rendu. Fonction pure : pas de DOM.
 *
 * La mesure déclenche un nouveau rendu quand elle change ; elle doit donc rester stable d'un rendu à
 * l'autre, sinon React tourne en boucle jusqu'à abandonner (« Maximum update depth exceeded ») et
 * vide l'écran. On ignore donc les fractions de pixel et les valeurs non numériques. L'appelant doit
 * en plus ne pas appeler setState quand la position est inchangée (voir FanHand).
 */

export interface Origin {
  left: number
  top: number
}

/**
 * Nouvelle position à retenir, ou `current` (même référence) si rien ne change à l'œil : on arrondit
 * au pixel, et une mesure non finie est ignorée. Garder la même référence évite le rendu suivant.
 */
export function nextOrigin(current: Origin, measured: Origin): Origin {
  if (!Number.isFinite(measured.left) || !Number.isFinite(measured.top)) return current
  const left = Math.round(measured.left)
  const top = Math.round(measured.top)
  return left === current.left && top === current.top ? current : { left, top }
}
