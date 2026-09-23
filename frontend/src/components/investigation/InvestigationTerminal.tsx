import React, { useState, useEffect } from "react";
import { Search, Send, Sparkles, Shield, Camera, ArrowRight, CornerDownLeft, Bot, User } from "lucide-react";
import { investigationService } from "@/services/investigationService";
import type { InvestigationAnswer } from "@/types";
import { useNavigate } from "@tanstack/react-router";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  answer?: InvestigationAnswer;
  timestamp: string;
}

export function InvestigationTerminal() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: "IBVAP Tactical Intelligence Cell online. Query natural language incident correlations, vehicle corridors, cross-camera continuity, or perimeter anomalies.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const navigate = useNavigate();

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const response = await investigationService.query(queryText);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.answer,
        answer: response,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (presetText: string) => {
    setPrompt(presetText);
    handleQuery(presetText);
  };

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col h-[680px] overflow-hidden shadow-xs">
      {/* Terminal Header */}
      <div className="p-3 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Ask IBVAP · Natural Language Investigation Terminal
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
          INFERENCE ENGINE v2.4
        </span>
      </div>

      {/* Suggested Prompts Banner */}
      <div className="p-3 border-b border-border/60 bg-muted/20">
        <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold block mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-warning" />
          Tactical Query Suggestions (Click to execute):
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            "Show night-time intrusions near BOP-04",
            "Where was vehicle GJ01AB1234 seen yesterday?",
            "Reconstruct Person P102 cross-camera trajectory",
            "List high-priority alerts in past 2 hours",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handlePreset(suggestion)}
              className="px-2.5 py-1 text-xs font-mono rounded bg-secondary/70 hover:bg-secondary border border-border/80 text-foreground transition-colors text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.sender === "user" ? "ml-auto justify-end" : "mr-auto justify-start"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3.5 rounded-lg border font-mono text-xs leading-relaxed space-y-2 ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 border-border text-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 border-b border-current/15 pb-1 mb-1">
                <span>{msg.sender === "user" ? "INVESTIGATOR QUERY" : "IBVAP SYSTEM ANSWER"}</span>
                <span>{msg.timestamp}</span>
              </div>

              <p>{msg.text}</p>

              {/* Render Structured Answer Cards if returned */}
              {msg.answer && msg.answer.results.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/60 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-primary block">
                    Correlated Tactical Matches ({msg.answer.results.length}):
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {msg.answer.results.map((item) => (
                      <div
                        key={item.refId}
                        onClick={() => item.route && navigate({ to: item.route })}
                        className="p-2.5 rounded border border-border/80 bg-card hover:border-primary cursor-pointer transition-colors flex items-center justify-between text-left group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span>{item.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                          {item.timestamp && (
                            <span className="text-[10px] text-muted-foreground/80 block mt-1">
                              Time: {item.timestamp}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 font-mono text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>Scanning relational intelligence graph &amp; optical detection logs...</span>
          </div>
        )}
      </div>

      {/* Query Input Box */}
      <div className="p-3 border-t border-border bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(prompt);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask IBVAP... (e.g. 'Show night-time intrusions near BOP-04')"
              className="w-full pl-9 pr-3 py-2 bg-secondary/40 border border-input rounded-md text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
          >
            <span>Run Query</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
