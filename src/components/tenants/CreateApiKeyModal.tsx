import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, KeyRound, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { readApiError, tenantsApi } from "@/lib/api";
import { copyToClipboard } from "@/lib/utils";
import type { ApiKeyCreated } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  tenantId: string;
}

export function CreateApiKeyModal({ open, onClose, tenantId }: Props) {
  const { t } = useTranslation(["apiKeys", "common"]);
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("default");
  const [expiresAt, setExpiresAt] = useState("");
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setLabel("default");
      setExpiresAt("");
      setNewKey(null);
      setCopied(false);
    }
  }, [open]);

  const create = useMutation({
    mutationFn: () =>
      tenantsApi.createApiKey(tenantId, {
        label: label.trim() || "default",
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    onSuccess: (data) => {
      setNewKey(data);
      queryClient.invalidateQueries({ queryKey: ["api-keys", tenantId] });
    },
    onError: (err) => toast.error(readApiError(err)),
  });

  async function handleCopy() {
    if (!newKey) return;
    const ok = await copyToClipboard(newKey.raw_key);
    if (ok) {
      setCopied(true);
      toast.success(t("modal.keyCopied"));
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t("modal.copyFailed"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={newKey ? t("modal.createdTitle") : t("modal.generateTitle")}
      description={
        newKey ? t("modal.createdDescription") : t("modal.generateDescription")
      }
      size="lg"
      footer={
        newKey ? (
          <Button onClick={onClose}>{t("modal.savedKey")}</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={() => create.mutate()}
              loading={create.isPending}
              leftIcon={<KeyRound className="h-4 w-4" />}
            >
              {t("generate")}
            </Button>
          </>
        )
      }
    >
      {!newKey ? (
        <div className="space-y-4">
          <Input
            label={t("common:labels.label")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("modal.labelPlaceholder")}
            helperText={t("modal.labelHelper")}
          />
          <Input
            label={t("modal.expiresLabel")}
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            helperText={t("modal.expiresHelper")}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-900/20">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-300" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <strong className="block font-semibold">{t("modal.oneTimeTitle")}</strong>
              {t("modal.oneTimeBody")}
            </div>
          </div>

          <div>
            <p className="label-base">{t("modal.yourNewKey")}</p>
            <div className="flex items-stretch gap-2">
              <code className="flex-1 select-all break-all rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 font-mono text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100">
                {newKey.raw_key}
              </code>
              <Button
                variant="outline"
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={handleCopy}
              >
                {copied ? t("common:toast.copied") : t("common:actions.copy")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-xs dark:border-ink-800 dark:bg-ink-900/40">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {t("common:labels.prefix")}
              </p>
              <p className="mt-0.5 font-mono text-ink-700 dark:text-ink-200">
                {newKey.key_prefix}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {t("common:labels.label")}
              </p>
              <p className="mt-0.5 text-ink-700 dark:text-ink-200">{newKey.label}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
