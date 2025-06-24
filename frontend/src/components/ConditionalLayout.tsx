"use client";

import { usePathname } from "next/navigation";
import PageWrapper from "./PageWrapper";
import Sidebar from "./Sidebar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// Páginas que não precisam de autenticação (layout público)
const publicPages = ["/login", "/register", "/forgot-password"];

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isPublicPage = publicPages.includes(pathname);

  // Layout público (sem sidebar)
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Layout protegido (com sidebar)
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-16 transition-all duration-300 ease-in-out overflow-y-auto">
        <PageWrapper>{children}</PageWrapper>
      </main>
    </div>
  );
}
