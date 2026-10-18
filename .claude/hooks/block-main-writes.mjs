// Hook PreToolUse : refuse toute écriture dans un dépôt git dont la branche courante est main (ou master).
// Claude Code transmet l'appel d'outil en JSON sur stdin ; un code de sortie 2 bloque l'appel
// et renvoie le message de stderr à l'agent.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const PROTECTED = new Set(['main', 'master'])

const input = JSON.parse(readFileSync(0, 'utf8'))
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path
if (typeof target !== 'string') process.exit(0)

// Le fichier peut ne pas encore exister : on remonte au premier dossier existant.
let dir = dirname(resolve(input.cwd ?? process.cwd(), target))
while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir)

function git(...args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

let branch
try {
  git('rev-parse', '--show-toplevel')
  branch = git('branch', '--show-current')
} catch {
  // Hors d'un dépôt git (mémoire, dossier temporaire...) : rien à protéger.
  process.exit(0)
}

if (PROTECTED.has(branch)) {
  process.stderr.write(
    `Écriture refusée : la branche courante est "${branch}". ` +
      'Crée d\'abord une branche de travail (voir "Branches git" dans CLAUDE.md), puis réessaie.\n',
  )
  process.exit(2)
}
