/**
 * Simple .gitignore pattern parser.
 * Supports: wildcards (*, ?), directory markers (/), negation (!), comments (#)
 */

export interface IgnoreRule {
  pattern: RegExp
  negate: boolean
  dirOnly: boolean
  rooted: boolean // anchored to root if starts with /
}

/**
 * Convert a .gitignore pattern to a RegExp.
 * Handles the most common glob syntax.
 */
function patternToRegex(pattern: string): RegExp {
  let re = ''
  let anchored = false

  // Anchor to beginning if starts with /
  if (pattern.startsWith('/')) {
    anchored = true
    pattern = pattern.slice(1)
  }

  // Remove trailing / (directory marker)
  if (pattern.endsWith('/')) {
    pattern = pattern.slice(0, -1)
  }

  // If not anchored and doesn't contain /, match at any depth
  if (!anchored && !pattern.includes('/')) {
    re += '(^|.*/)'
  } else if (anchored) {
    re += '^'
  } else {
    re += '^'
  }

  // Convert glob to regex
  let i = 0
  while (i < pattern.length) {
    const ch = pattern[i]
    switch (ch) {
      case '*':
        if (pattern[i + 1] === '*' && (i === 0 || pattern[i - 1] === '/')) {
          // ** matches zero or more directories
          re += '.*'
          i += 2
          continue
        }
        re += '[^/]*'
        break
      case '?':
        re += '[^/]'
        break
      case '.':
        re += '\\.'
        break
      case '[': {
        // Character class [...] - find closing bracket
        const close = pattern.indexOf(']', i)
        if (close > i) {
          re += pattern.slice(i, close + 1)
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          i = close
        } else {
          re += '\\['
        }
        break
      }
      default:
        // Escape regex special chars
        if ('+?^${}()|\\'.includes(ch)) {
          re += '\\' + ch
        } else {
          re += ch
        }
    }
    i++
  }

  if (!anchored) {
    re += '/?$'
  } else {
    re += '/?$'
  }

  return new RegExp(re)
}

/**
 * Parse raw .gitignore content into a list of IgnoreRules.
 */
export function parseGitignore(content: string): IgnoreRule[] {
  const rules: IgnoreRule[] = []
  const lines = content.split('\n')

  for (const rawLine of lines) {
    let line = rawLine.trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue

    // Handle negation
    let negate = false
    if (line.startsWith('!')) {
      negate = true
      line = line.slice(1).trim()
      if (!line) continue
    }

    // Check if directory-only pattern (ends with /)
    const dirOnly = line.endsWith('/')
    const rooted = line.startsWith('/')

    // Remove trailing / for regex conversion
    const cleanPattern = dirOnly ? line.slice(0, -1) : line

    try {
      const regex = patternToRegex(cleanPattern)
      rules.push({ pattern: regex, negate, dirOnly, rooted })
    } catch {
      // Skip invalid patterns
    }
  }

  return rules
}

/**
 * Test if a given name should be ignored based on ignore rules.
 * @param name - file/directory name (not full path)
 * @param isDir - whether this entry is a directory
 * @param rules - parsed ignore rules
 */
export function isIgnored(name: string, isDir: boolean, rules: IgnoreRule[]): boolean {
  let ignored = false

  for (const rule of rules) {
    // dirOnly rules only apply to directories
    if (rule.dirOnly && !isDir) continue

    if (rule.pattern.test(name)) {
      ignored = !rule.negate
    }
  }

  return ignored
}

/**
 * Convenience: parse content and return a filter function.
 */
export function createIgnoreFilter(content: string): (name: string, isDir: boolean) => boolean {
  const rules = parseGitignore(content)
  return (name: string, isDir: boolean) => isIgnored(name, isDir, rules)
}
