import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { readApiError, tenantsApi, getTenantDisplayName } from "@/lib/api";
import type { Tenant } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  tenant?: Tenant | null; // when present → edit mode
  onSuccess?: (tenant: Tenant) => void;
}

export function TenantFormModal({ open, onClose, tenant, onSuccess }: Props) {
  const { t } = useTranslation(["tenants", "common"]);
  const queryClient = useQueryClient();
  const isEdit = !!tenant;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && tenant) {
      setName(getTenantDisplayName(tenant));
      setSlug(tenant.slug);
      setDescription(tenant.description ?? "");
      setContactEmail(tenant.contact_email ?? "");
    }
    if (open && !tenant) {
      setName("");
      setSlug("");
      setDescription("");
      setContactEmail("");
    }
    setErrors({});
  }, [open, tenant]);

  const create = useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: (created) => {
      toast.success(t("toast.created"));
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      onSuccess?.(created);
      onClose();
    },
    onError: (err) => toast.error(readApiError(err)),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; patch: Parameters<typeof tenantsApi.update>[1] }) =>
      tenantsApi.update(vars.id, vars.patch),
    onSuccess: (updated) => {
      toast.success(t("toast.updated"));
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      onSuccess?.(updated);
      onClose();
    },
    onError: (err) => toast.error(readApiError(err)),
  });

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("validation.nameRequired");
    if (!isEdit) {
      if (!slug.trim()) next.slug = t("validation.slugRequired");
      else if (!/^[a-z0-9-]+$/.test(slug.trim()))
        next.slug = t("validation.slugFormat");
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      next.contactEmail = t("validation.emailInvalid");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isEdit && tenant) {
      update.mutate({
        id: tenant.tenant_id,
        patch: {
          name: name.trim(),
          company_name: name.trim(),
          description: description.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
        },
      });
    } else {
      create.mutate({
        name: name.trim(),
        company_name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
      });
    }
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("form.editTitle") : t("form.createTitle")}
      description={
        isEdit ? t("form.editDescription") : t("form.createDescription")
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("common:actions.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? t("common:actions.saveChanges") : t("form.createSubmit")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("form.nameLabel")}
          required
          placeholder={t("form.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          leftIcon={<Building2 className="h-4 w-4" />}
        />
        <Input
          label={t("common:labels.slug")}
          required
          disabled={isEdit}
          placeholder={t("form.slugPlaceholder")}
          helperText={
            isEdit ? t("form.slugLockedHelper") : t("form.slugHelper")
          }
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          error={errors.slug}
        />
        <Input
          label={t("common:labels.contactEmail")}
          type="email"
          placeholder={t("form.emailPlaceholder")}
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          error={errors.contactEmail}
        />
        <div />
        <div className="sm:col-span-2">
          <Textarea
            label={t("common:labels.description")}
            placeholder={t("form.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
