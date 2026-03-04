import Link from "next/link";
import { UiControls } from "@/features/preferences/components/ui-controls";
import type { AppLang } from "@/shared/i18n/resolve-language";
import { getMessages } from "@/shared/i18n/messages";
import type { AppTheme } from "@/shared/theme/resolve-theme";

type AppNavbarProps = {
  lang: AppLang;
  initialTheme: AppTheme;
};

export function AppNavbar({ lang, initialTheme }: AppNavbarProps) {
  const m = getMessages(lang);
  return (
    <header className="app-card-glass mb-6 px-5 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/?lang=${lang}`} className="flex items-center gap-2.5 hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--ui-accent-green)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span className="app-text text-base font-bold tracking-tight">{m.common.appName}</span>
        </Link>
        <UiControls lang={lang} initialTheme={initialTheme} />
      </div>
    </header>
  );
}
