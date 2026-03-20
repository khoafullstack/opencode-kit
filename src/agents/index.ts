import path from "node:path"
import { fileURLToPath } from "node:url"
import fs from "node:fs"
import matter from "gray-matter"

type AgentPermission = {
  edit?: string
  bash?: string | Record<string, string>
  webfetch?: string
  skill?: string
}

type AgentTools = {
  write?: boolean
  edit?: boolean
  bash?: boolean | string | Record<string, string>
  glob?: boolean
  grep?: boolean
  read?: boolean
  webfetch?: boolean
  patch?: boolean
  todowrite?: boolean
  todoread?: boolean
  question?: boolean
  [key: string]: unknown
}

type AgentConfig = {
  description?: string
  mode?: string
  temperature?: number
  top_p?: number
  prompt?: string
  color?: string
  permission?: AgentPermission
  tools?: AgentTools
  steps?: number
  hidden?: boolean
  model?: string
  [key: string]: unknown
}

const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)
const agentsDir = currentDir

export const bundledAgents: Record<string, AgentConfig> = {}

if (fs.existsSync(agentsDir)) {
  const entries = fs.readdirSync(agentsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const agentName = entry.name
      const mdPath = path.join(agentsDir, agentName, `${agentName}.md`)
      if (fs.existsSync(mdPath)) {
        const fileContent = fs.readFileSync(mdPath, "utf-8")
        const { data, content } = matter(fileContent)
        bundledAgents[agentName] = {
          ...data,
          prompt: content.trim(),
        }
      }
    }
  }
}
