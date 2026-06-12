import { ClientShell } from "@/components/layout/client-shell";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientShell>{children}</ClientShell>;
}
