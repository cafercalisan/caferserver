"use client";

import { useState, useRef } from "react";
import { Terminal as TerminalIcon, Send, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";

interface CommandResult {
  id: number;
  command: string;
  output: string;
  timestamp: string;
  isError: boolean;
}

const QUICK_COMMANDS = [
  { label: "Uptime", cmd: "uptime" },
  { label: "Disk", cmd: "df -h" },
  { label: "RAM", cmd: "free -m" },
  { label: "Docker PS", cmd: "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'" },
  { label: "Top 10 CPU", cmd: "ps aux --sort=-%cpu | head -11" },
  { label: "Docker Stats", cmd: "docker stats --no-stream --format 'table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}'" },
];

export default function TerminalPage() {
  const [command, setCommand] = useState("");
  const [results, setResults] = useState<CommandResult[]>([]);
  const [running, setRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let idCounter = useRef(0);

  async function executeCommand(cmd: string) {
    if (!cmd.trim()) return;

    setRunning(true);
    setCommandHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);

    const id = ++idCounter.current;
    const timestamp = new Date().toLocaleTimeString("tr-TR");

    // Add pending result
    setResults((prev) => [
      ...prev,
      { id, command: cmd, output: "Çalıştırılıyor...", timestamp, isError: false },
    ]);

    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json();

      setResults((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, output: data.output || data.error || "Çıktı yok", isError: !res.ok }
            : r
        )
      );
    } catch {
      setResults((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, output: "Bağlantı hatası", isError: true }
            : r
        )
      );
    }

    setRunning(false);
    setCommand("");

    // Scroll to bottom
    setTimeout(() => {
      outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      executeCommand(command);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      if (commandHistory[newIndex]) setCommand(commandHistory[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCommand(newIndex >= 0 ? commandHistory[newIndex] : "");
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold rpg-gradient-text"
            style={{ fontFamily: "var(--font-medieval)" }}
          >
            Kale Terminali
          </h1>
          <p className="text-sm text-parchment-dim mt-1">
            Sunucuya komut gönder
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResults([])}
        >
          <Trash2 className="w-4 h-4" />
          Temizle
        </Button>
      </div>

      {/* Quick commands */}
      <div className="flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((qc) => (
          <Button
            key={qc.cmd}
            variant="outline"
            size="sm"
            onClick={() => executeCommand(qc.cmd)}
            disabled={running}
          >
            {qc.label}
          </Button>
        ))}
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 rpg-card p-4 overflow-y-auto min-h-[300px] max-h-[calc(100vh-320px)] font-mono text-sm"
      >
        {results.length === 0 && (
          <div className="flex items-center justify-center h-full text-parchment-dim/40">
            <div className="text-center">
              <TerminalIcon className="w-12 h-12 mx-auto mb-3" />
              <p>Komut göndermeye hazır</p>
              <p className="text-xs mt-1">Yukarıdaki hızlı komutları veya kendi komutunu kullan</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {results.map((result) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 last:mb-0"
            >
              {/* Command line */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-health-green">root@cafer</span>
                <span className="text-parchment-dim">$</span>
                <span className="text-parchment">{result.command}</span>
                <span className="text-parchment-dim/40 text-xs ml-auto">
                  {result.timestamp}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(result.output)}
                  className="text-parchment-dim/40 hover:text-parchment-dim"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              {/* Output */}
              <pre
                className={`whitespace-pre-wrap text-xs leading-relaxed pl-4 border-l-2 ${
                  result.isError
                    ? "text-health-red border-health-red/30"
                    : "text-parchment-dim border-castle-border"
                }`}
              >
                {result.output}
              </pre>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 rpg-card px-3">
          <span className="text-health-green text-sm font-mono shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Komut girin..."
            disabled={running}
            className="flex-1 bg-transparent border-none outline-none text-parchment text-sm font-mono placeholder:text-parchment-dim/30 py-3"
            autoFocus
          />
        </div>
        <Button
          onClick={() => executeCommand(command)}
          disabled={running || !command.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
