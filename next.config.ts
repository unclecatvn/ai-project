import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router does not support next.config i18n yet.
  // Locale handling is implemented via query + NEXT_LOCALE cookie in app code.
};

export default nextConfig;
