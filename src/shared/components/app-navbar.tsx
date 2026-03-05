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
        <div className="flex items-center gap-5">
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

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link href={`/?lang=${lang}`} className="app-button-ghost px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Files
            </Link>
            <Link href={`/dashboard?lang=${lang}`} className="app-button-ghost px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Dashboard
            </Link>
            <Link href={`/skills?lang=${lang}`} className="app-button-ghost px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              Skills
            </Link>
          </nav>
        </div>

        <UiControls lang={lang} initialTheme={initialTheme} />
      </div>
    </header>
  );
}
