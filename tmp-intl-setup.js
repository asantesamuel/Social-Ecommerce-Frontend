const fs = require('fs');
const path = require('path');

const appsDir = 'd:\\EcommerceBackendAPI\\ecommerce-frontend\\apps';
const apps = ['admin-dashboard', 'vendor-dashboard'];

const requestTs = `import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(\`../messages/\${locale}.json\`)).default
  };
});`;

const routingTs = `import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'es', 'fr'],
  defaultLocale: 'en'
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);`;

const middlewareTs = `import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(en|es|fr)/:path*']
};`;

const enJson = `{ "Index": { "title": "Welcome to Dashboard" } }`;
const esJson = `{ "Index": { "title": "Bienvenido a Dashboard" } }`;
const frJson = `{ "Index": { "title": "Bienvenue à Dashboard" } }`;

for (const app of apps) {
  const appDir = path.join(appsDir, app);
  
  // Create folders
  fs.mkdirSync(path.join(appDir, 'i18n'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'messages'), { recursive: true });
  fs.mkdirSync(path.join(appDir, 'app', '[locale]'), { recursive: true });

  // i18n logic
  fs.writeFileSync(path.join(appDir, 'i18n', 'request.ts'), requestTs);
  fs.writeFileSync(path.join(appDir, 'i18n', 'routing.ts'), routingTs);
  fs.writeFileSync(path.join(appDir, 'middleware.ts'), middlewareTs);
  fs.writeFileSync(path.join(appDir, 'messages', 'en.json'), enJson);
  fs.writeFileSync(path.join(appDir, 'messages', 'es.json'), esJson);
  fs.writeFileSync(path.join(appDir, 'messages', 'fr.json'), frJson);

  // update next.config.js
  const configPath = path.join(appDir, 'next.config.js');
  if (fs.existsSync(configPath)) {
    let cfg = fs.readFileSync(configPath, 'utf8');
    if (!cfg.includes('withNextIntl')) {
        cfg = `import createNextIntlPlugin from 'next-intl/plugin';\nconst withNextIntl = createNextIntlPlugin('./i18n/request.ts');\n` + cfg;
        cfg = cfg.replace('export default nextConfig;', 'export default withNextIntl(nextConfig);');
        fs.writeFileSync(configPath, cfg);
    }
  }

  // move files to [locale]
  const layoutFrom = path.join(appDir, 'app', 'layout.tsx');
  const layoutTo = path.join(appDir, 'app', '[locale]', 'layout.tsx');
  if (fs.existsSync(layoutFrom)) {
     fs.renameSync(layoutFrom, layoutTo);
     let lcfg = fs.readFileSync(layoutTo, 'utf8');
     lcfg = lcfg.replace('import "./globals.css";', 'import "../globals.css";\nimport { NextIntlClientProvider } from \'next-intl\';\nimport { getMessages } from \'next-intl/server\';');
     lcfg = lcfg.replace('export default function RootLayout({', 'export default async function RootLayout({');
     lcfg = lcfg.replace('children,', 'children,\n  params,');
     lcfg = lcfg.replace('}: Readonly<{', '}: Readonly<{');
     lcfg = lcfg.replace('  children: React.ReactNode;\n}>) {', '  children: React.ReactNode;\n  params: Promise<{ locale: string }>;\n}>) {\n  const { locale } = await params;\n  const messages = await getMessages();');
     lcfg = lcfg.replace('<html lang="en">', '<html lang={locale}>');
     lcfg = lcfg.replace('{children}', '<NextIntlClientProvider messages={messages}>\n          {children}\n        </NextIntlClientProvider>');
     fs.writeFileSync(layoutTo, lcfg);
  }

  const pageFrom = path.join(appDir, 'app', 'page.tsx');
  const pageTo = path.join(appDir, 'app', '[locale]', 'page.tsx');
  if (fs.existsSync(pageFrom)) {
      fs.renameSync(pageFrom, pageTo);
  }

  const cssFrom = path.join(appDir, 'app', 'page.module.css');
  const cssTo = path.join(appDir, 'app', '[locale]', 'page.module.css');
  if (fs.existsSync(cssFrom)) {
      fs.renameSync(cssFrom, cssTo);
  }
}
console.log('Successfully structured admin-dashboard and vendor-dashboard');
