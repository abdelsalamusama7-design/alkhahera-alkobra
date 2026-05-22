import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "@/hooks/use-theme";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { SideRailAds } from "@/components/site/SideRailAds";
import { PopunderSmartLink } from "@/components/site/PopunderSmartLink";
import { MonetagScripts } from "@/components/site/MonetagScripts";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "القاهرة الكبرى - بوابة الأخبار المصرية والعربية" },
      { name: "description", content: "موقع القاهرة الكبرى الإخباري: آخر أخبار مصر والعالم، سياسة، اقتصاد، رياضة، فن، حوادث، وأسعار العملات والبورصة." },
      { name: "author", content: "القاهرة الكبرى" },
      { property: "og:title", content: "القاهرة الكبرى - بوابة الأخبار المصرية والعربية" },
      { property: "og:description", content: "موقع القاهرة الكبرى الإخباري: آخر أخبار مصر والعالم، سياسة، اقتصاد، رياضة، فن، حوادث، وأسعار العملات والبورصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "القاهرة الكبرى - بوابة الأخبار المصرية والعربية" },
      { name: "twitter:description", content: "موقع القاهرة الكبرى الإخباري: آخر أخبار مصر والعالم، سياسة، اقتصاد، رياضة، فن، حوادث، وأسعار العملات والبورصة." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/efdd7380-cded-41bc-8745-b44407129b99" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/efdd7380-cded-41bc-8745-b44407129b99" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;900&display=swap",
      },
    ],
    scripts: [
      // Adsterra Popunder (1 لكل صفحة)
      { src: "https://pl29522752.effectivecpmnetwork.com/e3/0d/81/e30d81e12c8ca7fa9dced44373e6fa55.js", async: true },
      // Monetag Multitag → يتم حقنها ديناميكيًا من <MonetagScripts /> حسب إعدادات لوحة التحكم
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // Inline pre-hydration script: applies the saved theme before React paints,
  // avoiding a flash of the wrong theme and any class mismatch on <html>.
  const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t='light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          src="https://quge5.com/88/tag.min.js"
          data-zone="242128"
          data-cfasync="false"
          data-monetag-id="quge5"
          async
        />
        <script
          src="https://al5sm.com/tag.min.js"
          data-zone="11044569"
          data-cfasync="false"
          data-monetag-id="al5sm"
          async
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Outlet />
        <SideRailAds />
        <WhatsAppFab />
        <PopunderSmartLink />
        <MonetagScripts />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
