"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen,
  File,
  ArrowLeft,
  Save,
  X,
  Home,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  permissions: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function FilesPage() {
  const [currentPath, setCurrentPath] = useState("/root");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<{
    path: string;
    content: string;
    name: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadDirectory(path: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setFiles(data.files || []);
      setCurrentPath(path);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  async function openFile(filePath: string, fileName: string) {
    try {
      const res = await fetch(
        `/api/files?path=${encodeURIComponent(filePath)}&action=read`
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setEditingFile({ path: filePath, content: data.content, name: fileName });
    } catch {
      setError("Dosya okunamadı");
    }
  }

  async function saveFile() {
    if (!editingFile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: editingFile.path,
          content: editingFile.content,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setEditingFile(null);
    } catch {
      setError("Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h1
          className="text-2xl font-bold rpg-gradient-text"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          Kale Arşivi
        </h1>
        <p className="text-sm text-parchment-dim mt-1">
          Sunucu dosya tarayıcısı
        </p>
      </div>

      {/* Editor overlay */}
      {editingFile && (
        <motion.div
          className="fixed inset-0 z-50 bg-castle-bg/95 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-castle-border">
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-gold" />
              <span className="text-parchment font-medium">{editingFile.name}</span>
              <Badge variant="outline">{editingFile.path}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="success" size="sm" onClick={saveFile} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditingFile(null)}>
                <X className="w-4 h-4" />
                Kapat
              </Button>
            </div>
          </div>
          <textarea
            value={editingFile.content}
            onChange={(e) =>
              setEditingFile((prev) => prev ? { ...prev, content: e.target.value } : null)
            }
            className="flex-1 bg-castle-bg text-parchment font-mono text-sm p-4 resize-none outline-none"
            spellCheck={false}
          />
        </motion.div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap rpg-card p-3">
        <button
          onClick={() => loadDirectory("/")}
          className="text-gold hover:text-gold/80 transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>
        {pathParts.map((part, i) => {
          const fullPath = "/" + pathParts.slice(0, i + 1).join("/");
          return (
            <div key={fullPath} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-parchment-dim/40" />
              <button
                onClick={() => loadDirectory(fullPath)}
                className="text-sm text-parchment-dim hover:text-parchment transition-colors"
              >
                {part}
              </button>
            </div>
          );
        })}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadDirectory(currentPath)}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-health-red text-sm bg-health-red/10 border border-health-red/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* File list */}
      <div className="flex-1 rpg-card overflow-y-auto">
        {/* Go up */}
        {currentPath !== "/" && (
          <button
            onClick={() => {
              const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
              loadDirectory(parent);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-castle-border/20 border-b border-castle-border/30 transition-colors text-left"
          >
            <ArrowLeft className="w-4 h-4 text-parchment-dim" />
            <span className="text-sm text-parchment-dim">..</span>
          </button>
        )}

        {loading && files.length === 0 && (
          <div className="p-8 text-center text-parchment-dim">Yükleniyor...</div>
        )}

        {files.map((file, i) => (
          <motion.button
            key={file.path}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => {
              if (file.isDirectory) {
                loadDirectory(file.path);
              } else {
                openFile(file.path, file.name);
              }
            }}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-castle-border/20 border-b border-castle-border/10 transition-colors text-left"
          >
            {file.isDirectory ? (
              <FolderOpen className="w-4 h-4 text-gold shrink-0" />
            ) : (
              <File className="w-4 h-4 text-parchment-dim shrink-0" />
            )}
            <span className="text-sm text-parchment flex-1 truncate">
              {file.name}
            </span>
            {!file.isDirectory && (
              <span className="text-xs text-parchment-dim shrink-0">
                {formatSize(file.size)}
              </span>
            )}
            <span className="text-xs text-parchment-dim/50 hidden sm:block shrink-0">
              {file.permissions}
            </span>
            <span className="text-xs text-parchment-dim/50 hidden md:block shrink-0">
              {file.modified}
            </span>
          </motion.button>
        ))}

        {!loading && files.length === 0 && !error && (
          <div className="p-8 text-center text-parchment-dim">Boş dizin</div>
        )}
      </div>
    </div>
  );
}
