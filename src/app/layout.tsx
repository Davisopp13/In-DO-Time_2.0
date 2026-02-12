import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import AppShell from "@/components/layout/AppShell";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { ToastProvider } from "@/lib/toast";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "In DO Time",
  description: "Personal command center & time tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "In DO Time",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#84cc16",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Inline script to set data-theme before first paint, preventing FOUC
const themeScript = `
(function() {
  var t = localStorage.getItem('in-do-time-theme');
  if (t === 'light' || t === 'dark') {
    document.documentElement.setAttribute('data-theme', t);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

import { getWorkspaces } from "@/actions/workspaces";
import { WorkspaceProvider } from "@/lib/workspace";
import { SyncProvider } from "@/lib/sync";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const workspaces = await getWorkspaces();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${outfit.variable} font-outfit antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <WorkspaceProvider initialWorkspaces={workspaces}>
              <SyncProvider>
                <AppShell>{children}</AppShell>
                <ServiceWorkerRegistration />
                <Toaster />
              </SyncProvider>
            </WorkspaceProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
