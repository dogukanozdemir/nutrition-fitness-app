"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Key, LogOut, Moon, Sun, Copy, Trash2, Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const [keys, setKeys] = useState<Array<{ id: string; name: string; createdAt: string; masked: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/v1/settings/api-keys")
      .then((r) => r.json())
      .then(setKeys)
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    if (theme === "system") {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.add(prefers ? "dark" : "light");
    } else {
      document.documentElement.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/v1/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Default" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedKey(data.key);
      setKeys((prev) => [{ id: data.id, name: data.name, createdAt: data.createdAt, masked: "••••••••••••" + (data.name?.slice(-2) ?? "") }, ...prev]);
      setNewKeyName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    try {
      const res = await fetch(`/api/v1/settings/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success(t("common.keyRevoked"));
    } catch {
      toast.error("Failed to revoke key");
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success(t("common.copied"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              {t("settings.appearance")}
            </CardTitle>
            <CardDescription>{t("settings.themeDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((themeKey) => (
                <Button
                  key={themeKey}
                  variant={theme === themeKey ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setTheme(themeKey)}
                >
                  {themeKey === "light" && <Sun className="mr-1 h-4 w-4" />}
                  {themeKey === "dark" && <Moon className="mr-1 h-4 w-4" />}
                  {t(`settings.${themeKey}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t("settings.language")}
            </CardTitle>
            <CardDescription>{t("settings.languageDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={locale === "en" ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setLocale("en")}
              >
                {t("settings.english")}
              </Button>
              <Button
                variant={locale === "tr" ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setLocale("tr")}
              >
                {t("settings.turkish")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t("settings.apiKeys")}
            </CardTitle>
            <CardDescription>
              {t("settings.apiKeysDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog
              open={keyDialogOpen}
              onOpenChange={(open) => {
                setKeyDialogOpen(open);
                if (!open) setCreatedKey(null);
              }}
            >
              <DialogTrigger asChild>
                <Button className="rounded-xl">{t("settings.createKey")}</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-border/50">
                <DialogHeader>
                  <DialogTitle>
                    {createdKey ? t("settings.saveKey") : t("settings.createKey")}
                  </DialogTitle>
                </DialogHeader>
                {createdKey ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t("settings.copyKeyHint")}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={createdKey}
                        className="rounded-xl font-mono text-sm"
                      />
                      <Button
                        size="icon"
                        className="rounded-xl"
                        onClick={() => copyKey(createdKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      className="w-full rounded-xl"
                      onClick={() => {
                        setCreatedKey(null);
                        setKeyDialogOpen(false);
                      }}
                    >
                      {t("settings.done")}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateKey} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">{t("settings.keyName")}</Label>
                      <Input
                        id="keyName"
                        placeholder="My GPT"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-xl"
                      disabled={creating}
                    >
                      {creating ? t("settings.creating") : t("settings.createKey")}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {loading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("settings.noKeys")}</p>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{k.name}</p>
                      <p className="font-mono text-sm text-muted-foreground">{k.masked}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-destructive hover:text-destructive"
                      onClick={() => handleRevoke(k.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("settings.signOut")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
