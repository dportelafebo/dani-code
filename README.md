# dani-code

A lightweight terminal-based AI chat assistant powered by Claude. Built with Ink (React for CLI) and the Vercel AI SDK.

## 📋 Prerequisites

- [Bun](https://bun.sh) runtime installed
- An [Anthropic API key](https://console.anthropic.com/)

## 🚀 Getting Started

### Installation

```bash
pnpm install
```

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your Anthropic API key to `.env`:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Usage

```bash
bun run src/index.tsx
```

Type your message and press Enter to chat with Claude!

## 🛠️ Tech Stack

- [Bun](https://bun.sh) — JavaScript runtime
- [Ink](https://github.com/vadimdemedes/ink) — React for interactive CLIs
- [Vercel AI SDK](https://sdk.vercel.ai) — AI SDK with streaming support
- [Anthropic Claude](https://anthropic.com) — AI model (claude-haiku-4-5)

## 📝 License

MIT
