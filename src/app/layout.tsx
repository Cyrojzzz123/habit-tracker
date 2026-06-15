import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageTransition } from "@/components/PageTransition";
import { UndoToastProvider } from "@/components/UndoToast";
import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "Track your daily habits and build better routines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-[var(--font-poppins)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="grey"
          enableSystem
          disableTransitionOnChange
        >
          <UndoToastProvider>
            <TooltipProvider>
              <AppShell>
                <PageTransition>{children}</PageTransition>
              </AppShell>
            </TooltipProvider>
          </UndoToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
