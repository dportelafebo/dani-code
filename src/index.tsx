import { anthropic } from "@ai-sdk/anthropic";
import { streamText, stepCountIs } from "ai";
import { render, Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useState } from "react";
import { tools } from "./tools";

type Message = 
  | { role: "user" | "assistant"; content: string }
  | { role: "tool-call"; name: string; input: unknown }
  | { role: "tool-result"; name: string; input: unknown; output: unknown };

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stream, setStream] = useState("");

  async function onSubmit(value: string) {
    if (!value.trim()) return;
    const msgs: Message[] = [...messages, { role: "user", content: value }];
    setMessages(msgs);
    setInput("");

    let text = "";
    const newMessages: Message[] = [...msgs];

    const { fullStream } = streamText({
      model: anthropic("claude-haiku-4-5"),
      messages: msgs.filter((m): m is { role: "user" | "assistant"; content: string } => 
        m.role === "user" || m.role === "assistant"
      ),
      tools,
      stopWhen: stepCountIs(30),
    });

    for await (const chunk of fullStream) {
      if (chunk.type === "text-delta") {
        text += chunk.text;
        setStream(text);
      } else if (chunk.type === "tool-call") {
        const toolCallMessage: Message = {
          role: "tool-call",
          name: chunk.toolName,
          input: chunk.input,
        };
        newMessages.push(toolCallMessage);
        setMessages([...newMessages]);
      } else if (chunk.type === "tool-result") {
        const toolResultMessage: Message = {
          role: "tool-result",
          name: chunk.toolName,
          input: chunk.input,
          output: chunk.output,
        };
        newMessages.push(toolResultMessage);
        setMessages([...newMessages]);
      }
    }

    setMessages([...newMessages, { role: "assistant", content: text }]);
    setStream("");
  }

  return (
    <Box flexDirection="column">
      {messages.map((m, i) => {
        if (m.role === "user" || m.role === "assistant") {
          return (
            <Text key={i} color={m.role === "user" ? "blue" : "green"}>
              {m.role}: {m.content}
            </Text>
          );
        } else if (m.role === "tool-call") {
          return (
            <Box key={i} flexDirection="column">
              <Text color="yellow">
                🔧 {m.name} {JSON.stringify(m.input)}
              </Text>
            </Box>
          );
        } else if (m.role === "tool-result") {
          return (
            <Box key={i} flexDirection="column">
              <Text color="gray">
                ✓ {m.name}: {JSON.stringify(m.output)}
              </Text>
            </Box>
          );
        }
        return null;
      })}
      {stream && <Text color="green">assistant: {stream}</Text>}
      <Box>
        <Text>❯❯ </Text>
        <TextInput value={input} onChange={setInput} onSubmit={onSubmit} />
      </Box>
    </Box>
  );
}

render(<App />);