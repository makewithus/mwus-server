import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MWU | Employee Management System",
    template: "MWU | %s",
  },
  description:
    "Enterprise-grade Employee Management System for HR departments. Manage attendance, payroll, leaves, documents, and more.",
  keywords: ["employee management", "HR software", "attendance", "payroll", "leaves"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster richColors theme="light" closeButton duration={2000} position="top-center" />
      </body>
    </html>
  );
}
