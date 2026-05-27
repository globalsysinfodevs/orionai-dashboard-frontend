import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import type { PaginationMeta } from "@/types";
import { formatNumber } from "@/lib/format";

interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Footer pager driven by the backend `PaginationMeta` envelope.
 * Renders nothing until metadata is available so it stays out of the
 * way during the first load.
 */
export function Pagination({ meta, onPageChange, disabled }: PaginationProps) {
  const { t } = useTranslation("common");
  if (!meta) return null;

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.page_size + 1;
  const to = Math.min(meta.page * meta.page_size, meta.total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 px-6 py-4 sm:flex-row dark:border-ink-800/70">
      <p className="text-xs text-ink-500 dark:text-ink-400">
        {t("pagination.range", {
          from: formatNumber(from),
          to: formatNumber(to),
          total: formatNumber(meta.total),
        })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
          disabled={disabled || !meta.has_prev}
          onClick={() => onPageChange(meta.page - 1)}
        >
          {t("pagination.prev")}
        </Button>
        <span className="px-1 text-xs font-medium text-ink-600 dark:text-ink-300">
          {t("pagination.page", {
            page: formatNumber(meta.page),
            total: formatNumber(meta.total_pages),
          })}
        </span>
        <Button
          size="sm"
          variant="outline"
          rightIcon={<ChevronRight className="h-4 w-4" />}
          disabled={disabled || !meta.has_next}
          onClick={() => onPageChange(meta.page + 1)}
        >
          {t("pagination.next")}
        </Button>
      </div>
    </div>
  );
}
