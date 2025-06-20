"use client";

import { usePathname } from "next/navigation";

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  const isFlowsPage = pathname === "/flows";

  if (isFlowsPage) {
    return <div className="h-full">{children}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      {children}
    </div>
  );
}
