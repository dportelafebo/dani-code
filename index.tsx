import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { render, Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useState } from "react";

type Message = { role: 'user' | 'assistant', content: string };

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [stream, setStream] = useState('');

    async function onSubmit(value: string) {
        if (!value.trim()) return;
        const msgs: Message[] = [...messages, { role: 'user', content: value }];
        setMessages(msgs);
        setInput('');

        let full = '';
        for await (const chunk of streamText({model: anthropic("claude-haiku-4-5"), messages: msgs}).textStream) {
            setStream(full += chunk)
        }

        setMessages([...msgs, { role: 'assistant', content: full }]);
        setStream('');
    }

    return (
        <Box flexDirection="column">
            {messages.map((m, i) => <Text key={i} color={m.role === "user" ? 'blue' : 'green'}>{m.role}: {m.content}</Text>)}
            {stream && <Text color="green">assistant: {stream}</Text>}
            <Box>
                <Text>❯❯ </Text><TextInput value={input} onChange={setInput} onSubmit={onSubmit}/> 
            </Box>
        </Box>
    )
}
render(<App />);