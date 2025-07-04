import { ReactNode } from "react";

interface ManagementLayoutProps {
  children: ReactNode;
}

export default function ManagementLayout({ children }: ManagementLayoutProps) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
