import type { Plugin } from "@opencode-ai/plugin"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { bundledMcp } from "./mcp/index.js"
import { bundledAgents } from "./agents/index.js"
import { bundledTools } from "./tools/index.js"
import { bundledCommands } from "./commands/index.js"

export default (async () => {
  return {
    tool: bundledTools,
    async config(input) {
      const cfg = input as {
        skills?: { paths?: string[] }
        mcp?: Record<string, unknown>
        agent?: Record<string, unknown>
        command?: Record<string, unknown>
      }

      const currentFile = fileURLToPath(import.meta.url)
      const currentDir = path.dirname(currentFile)
      const skillsRoot = path.join(currentDir, "skills")

      cfg.skills ??= {}
      cfg.skills.paths ??= []

      if (!cfg.skills.paths.includes(skillsRoot)) {
        cfg.skills.paths.push(skillsRoot)
      }

      cfg.mcp ??= {}

      for (const [name, server] of Object.entries(bundledMcp)) {
        if (!cfg.mcp[name]) {
          cfg.mcp[name] = server
        }
      }

      cfg.agent ??= {}

      for (const [name, agent] of Object.entries(bundledAgents)) {
        if (!cfg.agent[name]) {
          cfg.agent[name] = agent
        }
      }

      cfg.command ??= {}

      for (const [name, command] of Object.entries(bundledCommands)) {
        if (!cfg.command[name]) {
          cfg.command[name] = command
        }
      }
    },
  }
}) satisfies Plugin
