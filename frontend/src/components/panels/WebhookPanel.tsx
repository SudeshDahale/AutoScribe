import { formatDate } from "../../constants";
import { Badge } from "../ui/Badge";
import { ErrorMsg } from "../ui/ErrorMsg";
import type { WebhookStatus } from "../../types";

interface Props {
  webhookStatus: WebhookStatus | null;
  webhookSecret: string;
  webhookAutoRegen: boolean;
  saving: boolean;
  saved: { webhook_url: string; instructions: Record<string, string> } | null;
  error: string;
  copied: boolean;
  onSecretChange: (v: string) => void;
  onAutoRegenToggle: () => void;
  onSave: (e: React.FormEvent) => void;
  onCopy: (text: string) => void;
}

export function WebhookPanel({
  webhookStatus, webhookSecret, webhookAutoRegen, saving, saved, error, copied,
  onSecretChange, onAutoRegenToggle, onSave, onCopy,
}: Props) {
  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">PR Bot / Webhook</h2>
        {webhookStatus?.configured && (
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">✅ Configured</Badge>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
        Auto-regenerate documentation whenever code is pushed to this repository.
      </p>

      {/* Current status */}
      {webhookStatus?.configured && (
        <div className="card border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 p-5 mb-5">
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              ["Status", webhookStatus.enabled ? "🟢 Enabled" : "🔴 Disabled"],
              ["Auto-regen", webhookStatus.auto_regenerate ? "✅ On" : "❌ Off"],
              ["Last triggered", webhookStatus.last_triggered_at ? formatDate(webhookStatus.last_triggered_at) : "Never"],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config form */}
      <form onSubmit={onSave} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Webhook Secret</label>
          <input
            type="text"
            value={webhookSecret}
            onChange={(e) => onSecretChange(e.target.value)}
            placeholder="Leave blank to auto-generate"
            className="input-base font-mono"
          />
          <p className="text-xs text-gray-400 mt-1.5">Used to verify the webhook signature from GitHub.</p>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-white/[0.06]">
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Auto-regenerate docs on push</p>
            <p className="text-xs text-gray-400 mt-0.5">Re-runs docstrings + README for changed files automatically.</p>
          </div>
          <button
            type="button"
            onClick={onAutoRegenToggle}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${webhookAutoRegen ? "bg-violet-600" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${webhookAutoRegen ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>

        {error && <ErrorMsg msg={error} />}

        <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-sm rounded-xl">
          {saving ? "Saving…" : webhookStatus?.configured ? "Update Configuration" : "Enable Webhook"}
        </button>
      </form>

      {/* Instructions */}
      {saved && (
        <div className="mt-5 card border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10 p-5">
          <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">✅ Webhook configured — set it up in GitHub:</p>
          <div className="space-y-2 mb-4">
            {Object.entries(saved.instructions).map(([key, val]) => (
              <div key={key} className="flex gap-3 text-sm">
                <span className="text-blue-400 font-bold flex-shrink-0 w-4">{key.replace("step_", "")}.</span>
                <span className="text-gray-700 dark:text-gray-300">{val}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#17171f] rounded-xl border border-blue-100 dark:border-blue-900/50">
            <code className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{saved.webhook_url}</code>
            <button onClick={() => onCopy(saved.webhook_url)} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex-shrink-0">
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}