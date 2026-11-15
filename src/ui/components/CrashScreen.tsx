import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

/**
 * Filet de sécurité de toute l'application. Sans lui, une erreur levée pendant un rendu fait démonter
 * tout l'arbre par React : il ne reste qu'un écran vide, sans aucun bouton. Ici, on affiche l'erreur
 * (pour pouvoir la signaler) et un bouton pour recharger la page.
 *
 * Seul cas du projet où une classe est nécessaire : React n'offre pas encore de hook pour attraper
 * les erreurs de rendu (componentDidCatch / getDerivedStateFromError).
 */

/** Dernières erreurs survenues hors rendu (minuteries, promesses) : elles précèdent souvent le plantage. */
const recentErrors: string[] = []
const MAX_RECENT = 5

function remember(text: string): void {
  recentErrors.push(`${new Date().toLocaleTimeString()} ${text}`)
  if (recentErrors.length > MAX_RECENT) recentErrors.shift()
}

/** Garde les premières lignes d'un texte : le rapport doit tenir sur une capture de téléphone. */
function firstLines(text: string, count: number): string {
  return text.trim().split('\n').slice(0, count).map((line) => line.trim()).join('\n')
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}\n${firstLines(error.stack ?? '', 6)}`
  return String(error)
}

/** Commence à noter les erreurs globales. À appeler une fois, au démarrage. */
export function recordGlobalErrors(): void {
  window.addEventListener('error', (event) => remember(describe(event.error ?? event.message)))
  window.addEventListener('unhandledrejection', (event) => remember(`Promesse rejetée : ${describe(event.reason)}`))
}

interface Props {
  children: ReactNode
}

interface State {
  crash: { error: string; componentStack: string; recent: string[]; at: string } | null
}

export class CrashBoundary extends Component<Props, State> {
  state: State = { crash: null }

  static getDerivedStateFromError(error: unknown): State {
    return {
      crash: { error: describe(error), componentStack: '', recent: [...recentErrors], at: new Date().toLocaleString() },
    }
  }

  componentDidCatch(_error: unknown, info: ErrorInfo): void {
    const componentStack = firstLines(info.componentStack ?? '', 8)
    this.setState((s) => (s.crash === null ? s : { crash: { ...s.crash, componentStack } }))
  }

  render(): ReactNode {
    const { crash } = this.state
    if (crash === null) return this.props.children
    const report = [
      `Papayou a planté le ${crash.at}`,
      `Navigateur : ${navigator.userAgent}`,
      `Écran : ${window.innerWidth} x ${window.innerHeight}, ${document.visibilityState}`,
      '',
      crash.error,
      crash.componentStack === '' ? '' : `\nComposants :\n${crash.componentStack}`,
      crash.recent.length === 0 ? '' : `\nErreurs précédentes :\n${crash.recent.join('\n')}`,
    ]
      .filter((line, i) => i < 4 || line !== '')
      .join('\n')
    return (
      <div className="home crash">
        <h1>Oups, le jeu a planté</h1>
        <p>Faites une capture de cet écran pour signaler le problème, puis rechargez la page.</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Recharger
        </button>
        <pre className="crash-report">{report}</pre>
      </div>
    )
  }
}
