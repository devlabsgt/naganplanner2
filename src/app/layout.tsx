import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/(base)/theme/provider";
import { NavDock } from "@/components/(base)/layout/nav-dock";
import Header from "@/components/(base)/layout/header";
import { createClient } from "@/utils/supabase/server";
import Providers from "@/components/(base)/providers/QueryProviders";
import { UserProvider } from "@/components/(base)/providers/UserProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "NAGAN Planner",
  description:
    "Aplicación para iglesias, servicios y gestión de actividades.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NAGAN Planner",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/favicon.ico",
  },
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script requerido para los íconos animados AnimatedIcon (lordicon) */}
        <script src="https://cdn.lordicon.com/lordicon.js" async></script>
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <UserProvider user={user}>
              <Header />
              <main className="flex-1 w-full pb-32">{children}</main>
              <NavDock />
            </UserProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
