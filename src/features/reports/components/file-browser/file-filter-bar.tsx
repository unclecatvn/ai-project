"use client";

import type { FileTypeFilter, SensitivityFilter } from "@/features/reports/components/file-browser/types";
import { getMessages } from "@/shared/i18n/messages";
import type { AppLang } from "@/shared/i18n/resolve-language";

type FileFilterBarProps = {
  lang: AppLang;
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: FileTypeFilter;
  onTypeFilterChange: (value: FileTypeFilter) => void;
  sensitivityFilter: SensitivityFilter;
  onSensitivityFilterChange: (value: SensitivityFilter) => void;
  availableTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearFilters: () => void;
};

export function FileFilterBar({
  lang,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  sensitivityFilter,
  onSensitivityFilterChange,
  availableTags,
  selectedTags,
  onToggleTag,
  onClearFilters,
}: FileFilterBarProps) {
  const m = getMessages(lang);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={m.explorer.searchPlaceholder}
          className="app-input w-full py-2 px-3 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as FileTypeFilter)}
          className="app-input cursor-pointer px-3 py-2 text-sm"
        >
          <option value="all">{m.explorer.allFileTypes}</option>
          <option value="markdown">{m.common.markdown}</option>
          <option value="html">{m.common.html}</option>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="text">Text</option>
        </select>
        <select
          value={sensitivityFilter}
          onChange={(event) => onSensitivityFilterChange(event.target.value as SensitivityFilter)}
          className="app-input cursor-pointer px-3 py-2 text-sm"
        >
          <option value="all">{m.explorer.allSensitivity}</option>
          <option value="public">public</option>
          <option value="internal">internal</option>
          <option value="restricted">restricted</option>
        </select>
      </div>

      {availableTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  active ? "app-accent-bg app-accent-text" : "app-muted app-text-soft"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center justify-end">
        <button type="button" onClick={onClearFilters} className="app-button-ghost rounded-full px-2 py-1 text-xs font-medium">
          {m.explorer.clearFilters}
        </button>
      </div>
    </div>
  );
}
