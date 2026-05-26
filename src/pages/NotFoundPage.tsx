import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  const { t } = useTranslation("auth");
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        <Compass className="h-7 w-7" />
      </div>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
        {t("notFound.title")}
      </h2>
      <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
        {t("notFound.description")}
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button leftIcon={<ArrowLeft className="h-4 w-4" />} variant="primary">
          {t("notFound.backToDashboard")}
        </Button>
      </Link>
    </div>
  );
}
