export function splitJsonObjects(input: string): { objects: string[]; remainder: string } {
  const objects: string[] = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === '"') {
        inString = false
      }
      continue
    }

    if (character === '"') {
      inString = true
      continue
    }

    if (character === '{') {
      if (depth === 0) start = index
      depth += 1
    } else if (character === '}' && depth > 0) {
      depth -= 1
      if (depth === 0 && start !== -1) {
        objects.push(input.slice(start, index + 1))
        start = -1
      }
    }
  }

  return {
    objects,
    remainder: start === -1 ? '' : input.slice(start),
  }
}