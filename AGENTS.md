# Dự án:
Opencode plugins

## Mô tả:
Tạo một plugin trong opencode, là một bundle các tools, mcp, agents, skills trong có thể built in hoặc có thể là lấy từ bên ngoài và sẽ thêm vào opencode theo nguyên lý thêm vào lúc mở opencode lên để không phải thêm file vào trong workspace hoặc ~/.config/opencode của máy người dùng.

## Note:
- Dự án này sẽ không tự động tạo hoặc sửa folder `.opencode/`.

### Tài liệu:

#### Agent
- Docs: https://opencode.ai/docs/agents/
- Có 2 loại agent:
  - `primary`: agent chính để tương tác trực tiếp
  - `subagent`: agent phụ để được gọi qua `@mention` hoặc `Task`
- Built-in:
  - Primary: `build`, `plan`
  - Subagent: `general`, `explore`
- Cấu hình bằng:
  - `opencode.json` qua key `agent`
  - file markdown trong `.opencode/agents/` hoặc `~/.config/opencode/agents/`
- Các field quan trọng:
  - `description` (required)
  - `mode`: `primary` | `subagent` | `all`
  - `model`
  - `prompt`
  - `temperature`
  - `steps`
  - `permission`
  - `hidden`
  - `color`
  - `top_p`
- Có thể tạo agent bằng lệnh: `opencode agent create`

Ví dụ `opencode.json`:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for best practices",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
      "permission": {
        "edit": "deny",
        "bash": { "*": "ask", "git diff": "allow" }
      }
    }
  }
}
```

Ví dụ markdown agent:
```md
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
permission:
  edit: deny
  bash: deny
---

You are in code review mode. Focus on code quality, bugs, performance, and security.
```

#### Skill
- Docs: https://opencode.ai/docs/skills/
- Skill là các hướng dẫn tái sử dụng, load on-demand qua tool `skill`
- Vị trí:
  - `.opencode/skills/<name>/SKILL.md`
  - `~/.config/opencode/skills/<name>/SKILL.md`
  - `.claude/skills/<name>/SKILL.md`
  - `~/.claude/skills/<name>/SKILL.md`
  - `.agents/skills/<name>/SKILL.md`
  - `~/.agents/skills/<name>/SKILL.md`
- `SKILL.md` phải có YAML frontmatter
- Frontmatter hợp lệ:
  - `name` (required)
  - `description` (required)
  - `license`, `compatibility`, `metadata` (optional)
- Rule cho `name`:
  - 1-64 ký tự, lowercase alphanumeric và `-`
  - phải trùng tên thư mục chứa `SKILL.md`
  - regex: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Kiểm soát quyền qua `permission.skill`

Ví dụ:
```md
---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
---

## What I do
- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me
Use this when you are preparing a tagged release.
```

#### Tool
- Built-in tools: https://opencode.ai/docs/tools/
- Custom tools: https://opencode.ai/docs/custom-tools/
- Built-in tools: `bash`, `edit`, `write`, `read`, `grep`, `glob`, `patch`, `skill`, `todowrite`, `todoread`, `webfetch`, `websearch`, `question`
- Kiểm soát quyền qua `permission` trong `opencode.json`

Ví dụ:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "edit": "deny",
    "bash": "ask",
    "webfetch": "allow"
  }
}
```

- Custom tool định nghĩa bằng file `ts`/`js` trong:
  - `.opencode/tools/`
  - `~/.config/opencode/tools/`
- Tên file là tên tool
- Export nhiều tool trong 1 file: format `<filename>_<exportname>`
- Dùng helper `tool()` từ `@opencode-ai/plugin`
- Tool definition có thể gọi script ở bất kỳ ngôn ngữ nào

Ví dụ custom tool:
```ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    return `Executed query: ${args.query}`
  },
})
```

Ví dụ nhiều tool trong 1 file:
```ts
import { tool } from "@opencode-ai/plugin"

export const add = tool({
  description: "Add two numbers",
  args: {
    a: tool.schema.number(),
    b: tool.schema.number(),
  },
  async execute(args) { return args.a + args.b },
})

export const multiply = tool({
  description: "Multiply two numbers",
  args: {
    a: tool.schema.number(),
    b: tool.schema.number(),
  },
  async execute(args) { return args.a * args.b },
})
```

#### Command
- Docs: https://opencode.ai/docs/commands/
- Custom command tạo prompt tái sử dụng trong TUI
- Cấu hình bằng:
  - `opencode.json` qua key `command`
  - file markdown trong `.opencode/commands/` hoặc `~/.config/opencode/commands/`
- Tên file markdown là tên command (vd: `test.md` -> `/test`)
- Field: `template` (required JSON), `description`, `agent`, `subtask`, `model`
- Prompt hỗ trợ:
  - `$ARGUMENTS`
  - `$1`, `$2`, `$3`...
  - `!`command`` inject output shell
  - `@file` include file vào prompt
- Custom command có thể override built-in command

Ví dụ markdown command:
```md
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

Run the full test suite with coverage report and show any failures.
```

Ví dụ command có arguments:
```md
---
description: Create a new component
---

Create a new React component named $ARGUMENTS with TypeScript support.
```

- Nguồn: https://opencode.ai/docs/agents/, /skills/, /tools/, /custom-tools/, /commands/
