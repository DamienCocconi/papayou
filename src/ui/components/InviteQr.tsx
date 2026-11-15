import { useMemo } from 'react'
import { encodeQr, QR_QUIET_ZONE, qrPath } from '../qr'

interface Props {
  /** Lien d'invitation encodé dans le QR code. */
  link: string
}

/**
 * QR code du lien d'invitation, en SVG : modules noirs sur fond blanc, marge blanche comprise,
 * quel que soit le thème autour. Ne sait rien du calque qui l'affiche.
 */
export function InviteQr({ link }: Props) {
  const { size, path } = useMemo(() => {
    const matrix = encodeQr(link)
    return { size: matrix.length, path: qrPath(matrix) }
  }, [link])
  const full = size + 2 * QR_QUIET_ZONE

  return (
    <svg
      className="invite-qr"
      viewBox={`${-QR_QUIET_ZONE} ${-QR_QUIET_ZONE} ${full} ${full}`}
      role="img"
      aria-label="QR code du lien d'invitation"
      shapeRendering="crispEdges"
    >
      <rect x={-QR_QUIET_ZONE} y={-QR_QUIET_ZONE} width={full} height={full} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  )
}
