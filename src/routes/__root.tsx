import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { ThemeProvider } from "@/lib/theme";

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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shopee RTS · Executive Dashboard" },
      {
        name: "description",
        content:
          "Dashboard executivo do setor RTS — monitoramento operacional EHA & RTS, buffer de salvados e mapa visual em tempo real.",
      },
      { name: "author", content: "Shopee Operations" },
      { property: "og:title", content: "Shopee RTS · Executive Dashboard" },
      {
        property: "og:description",
        content:
          "Monitoramento operacional, buffer de salvados, mapa visual e insights inteligentes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Shopee RTS · Executive Dashboard" },
      { name: "description", content: "Executive Operations Hub provides dynamic, interactive dashboards for operational monitoring and strategic insights." },
      { property: "og:description", content: "Executive Operations Hub provides dynamic, interactive dashboards for operational monitoring and strategic insights." },
      { name: "twitter:description", content: "Executive Operations Hub provides dynamic, interactive dashboards for operational monitoring and strategic insights." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/95f96247-9b5c-4d7c-bdf5-21f40ddf8878/id-preview-51c9b1ee--62601ff2-d2e3-4bea-83b0-4d00f49f00a2.lovable.app-1777276942869.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/95f96247-9b5c-4d7c-bdf5-21f40ddf8878/id-preview-51c9b1ee--62601ff2-d2e3-4bea-83b0-4d00f49f00a2.lovable.app-1777276942869.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}
