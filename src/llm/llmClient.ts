export type Message = { role: "system" | "user" | "assistant"; content: string };

export interface LLMClient {
  sendMessages(messages: Message[]): Promise<{ reply: string; raw?: any }>; 
}

export function createOpenAIClient(apiKey: string, model = "gpt-4o-mini"): LLMClient {
  const endpoint = "https://api.openai.com/v1/chat/completions";

  return {
    async sendMessages(messages: Message[]) {
      const body = {
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.2,
        max_tokens: 800,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM request failed: ${res.status} ${text}`);
      }

      const json = await res.json();
      const reply =
        json?.choices?.[0]?.message?.content ??
        json?.choices?.[0]?.text ??
        JSON.stringify(json);

      return { reply, raw: json };
    },
  };
}