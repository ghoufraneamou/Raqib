import { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { askAI } from "@/api/ai";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Bonjour, je suis l’assistant AMMPS. Comment puis-je vous aider ?",
    },
  ]);

  const handleSend = async () => {
    const text = question.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuestion("");
    setLoading(true);

    try {
      const answer = await askAI(text);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.message || "Une erreur est survenue avec l'assistant IA.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between bg-emerald-900 px-4 py-4 text-white">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h3 className="text-xl font-semibold">Assistant IA</h3>
              </div>
              <p className="mt-1 text-sm text-white/80">
                ITS, plateforme AMMPS
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-[380px] space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "ml-auto bg-emerald-600 text-white"
                    : "bg-white text-gray-800 border"
                }`}
              >
                {msg.content}
              </div>
            ))}

            {loading && (
              <div className="max-w-[85%] rounded-2xl border bg-white px-4 py-3 text-sm text-gray-500">
                Chargement...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Écrivez votre message..."
                className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                onClick={handleSend}
                disabled={loading}
                className="rounded-xl bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}