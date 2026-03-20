import { tool } from "@opencode-ai/plugin"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

const astGrep = tool({
  description:
    "Search codebase using AST-aware structural patterns with ast-grep (sg). " +
    "Use $VAR as metavariable placeholder (e.g. 'console.log($A)'). " +
    "Returns matched code snippets with file path and line numbers.",
  args: {
    pattern: tool.schema.string()
      .describe("AST pattern to search. Use $VAR as metavariable. Example: 'function $NAME($PARAMS) { $BODY }'"),
    lang: tool.schema.string()
      .describe("Language to parse: typescript, javascript, python, rust, go, java, tsx, jsx, html, css, etc."),
    path: tool.schema.string().optional().default(".")
      .describe("Directory or file path to search. Default: current directory"),
    json: tool.schema.boolean().optional().default(false)
      .describe("Return structured JSON output instead of plain text"),
  },
  async execute(args, context) {
    const dir = args.path === "." ? context.worktree : args.path
    const jsonFlag = args.json ? "--json" : ""

    try {
      const { stdout, stderr } = await execFileAsync(
        "sg",
        ["--pattern", args.pattern, "--lang", args.lang, jsonFlag, dir],
        {
          cwd: context.worktree,
          maxBuffer: 1024 * 1024 * 10,
        }
      )

      if (stderr && !stdout) {
        return `ast-grep warning/error: ${stderr}`
      }

      return stdout.trim() || "No matches found."
    } catch (e: any) {
      if (e.stdout) {
        return e.stdout.trim() || "No matches found."
      }
      return `ast-grep execution error: ${e.message}`
    }
  },
})

export default astGrep
