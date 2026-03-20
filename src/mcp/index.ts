type RemoteMcpConfig = {
  type: "remote"
  url: string
  enabled?: boolean
  headers?: Record<string, string>
  timeout?: number
}

type LocalMcpConfig = {
  type: "local"
  command: string[]
  enabled?: boolean
  environment?: Record<string, string>
  timeout?: number
}

type BundledMcpConfig = RemoteMcpConfig | LocalMcpConfig

export const bundledMcp: Record<string, BundledMcpConfig> = {
  exa: {
    type: "remote",
    url: "https://mcp.exa.ai/mcp",
    enabled: true,
  },
  context7: {
    type: "remote",
    url: "https://mcp.context7.com/mcp",
    enabled: true,
  },
  "chrome-devtools": {
    type: "local",
    command: ["npx", "-y", "chrome-devtools-mcp@latest"],
    enabled: true,
  },
}
