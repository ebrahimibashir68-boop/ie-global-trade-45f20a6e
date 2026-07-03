import { useEffect, useState } from "react";
import { Settings2, Monitor, Smartphone, Sparkles, Bell, LineChart, WandSparkles, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  loadSettings,
  saveSettings,
  applySettings,
  type AppSettings,
} from "@/lib/app-settings";
import { clearSession } from "@/lib/pi-session";

type RowProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
};

function Row({ icon, title, desc, checked, onCheckedChange }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-surface/40 p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-gold">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SettingsButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    applySettings(loadSettings());
  }, []);

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const resetApp = () => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Clear your Pi session and reset app settings on this device?")) return;
    clearSession();
    localStorage.removeItem("pitrade_app_settings_v1");
    const fresh = loadSettings();
    setSettings(fresh);
    applySettings(fresh);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open settings"
          title="Settings"
          className={`inline-flex items-center justify-center rounded-full border border-border/60 bg-surface/60 text-muted-foreground transition hover:text-foreground hover:border-gold/50 ${
            compact ? "size-8" : "size-9"
          }`}
        >
          <Settings2 className={compact ? "size-4" : "size-[18px]"} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto bg-background">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display">Settings</SheetTitle>
          <SheetDescription>
            Tune how PiTrade behaves on this device. Changes save instantly and stay on this browser.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <Row
            icon={settings.desktopSite ? <Monitor className="size-4" /> : <Smartphone className="size-4" />}
            title="Desktop site"
            desc="Force the wide desktop layout on mobile — great for reviewing long contracts."
            checked={settings.desktopSite}
            onCheckedChange={(v) => update({ desktopSite: v })}
          />
          <Row
            icon={<Sparkles className="size-4" />}
            title="AI Copilot"
            desc="Show the floating trade assistant across the app."
            checked={settings.aiCopilot}
            onCheckedChange={(v) => update({ aiCopilot: v })}
          />
          <Row
            icon={<WandSparkles className="size-4" />}
            title="Reduced motion"
            desc="Minimize animations and transitions."
            checked={settings.reducedMotion}
            onCheckedChange={(v) => update({ reducedMotion: v })}
          />
          <Row
            icon={<Bell className="size-4" />}
            title="Notifications"
            desc="Alert me when a contract status changes."
            checked={settings.notifications}
            onCheckedChange={(v) => update({ notifications: v })}
          />
          <Row
            icon={<LineChart className="size-4" />}
            title="Analytics"
            desc="Share anonymous usage to improve PiTrade."
            checked={settings.analytics}
            onCheckedChange={(v) => update({ analytics: v })}
          />
        </div>

        <div className="mt-8 border-t border-border/60 pt-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            About
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>App</div><div className="text-right text-foreground">PiTrade</div>
            <div>Network</div><div className="text-right text-foreground">Pi Testnet</div>
            <div>Version</div><div className="text-right text-foreground">1.0.0</div>
          </div>

          <button
            onClick={resetApp}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20"
          >
            <Trash2 className="size-4" />
            Reset app data on this device
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
