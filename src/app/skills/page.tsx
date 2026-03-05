import { cookies, headers } from "next/headers";
import { resolveLanguage } from "@/shared/i18n/resolve-language";
import { AppNavbar } from "@/shared/components/app-navbar";
import { resolveTheme, THEME_COOKIE_KEY } from "@/shared/theme/resolve-theme";
import { SkillsManager } from "@/features/skills/components/skills-manager";

type SkillsPageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const headerStore = await headers();
  const cookieStore = await cookies();
  const lang = resolveLanguage(resolvedSearchParams.lang, headerStore.get("accept-language"), cookieStore.get("NEXT_LOCALE")?.value ?? null);
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_KEY)?.value ?? null);

  return (
    <main className="vscode-page">
      <AppNavbar lang={lang} initialTheme={initialTheme} />
      <div className="skills-layout">
        <SkillsManager />
      </div>
    </main>
  );
}
