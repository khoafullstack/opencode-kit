import path from "node:path"
import { fileURLToPath } from "node:url"
import fs from "node:fs"
import matter from "gray-matter"

type CommandConfig = {
  description?: string
  agent?: string
  model?: string
  subtask?: boolean
  template?: string
  [key: string]: unknown
}

const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)
const commandsDir = currentDir

export const bundledCommands: Record<string, CommandConfig> = {}

if (fs.existsSync(commandsDir)) {
  const entries = fs.readdirSync(commandsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const commandName = entry.name
      const mdPath = path.join(commandsDir, commandName, `${commandName}.md`)
      if (fs.existsSync(mdPath)) {
        const fileContent = fs.readFileSync(mdPath, "utf-8")
        const { data, content } = matter(fileContent)
        bundledCommands[commandName] = {
          ...data,
          template: content.trim(),
        }
      }
    }
  }
}
