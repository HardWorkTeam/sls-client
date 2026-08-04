import type { ReactNode } from "react";

/**
 * Invitation data is loaded in the browser after authentication, so its IDs
 * are not available while creating the GitHub Pages export. Returning no
 * build-time paths lets Next.js export the rest of the portal successfully.
 */
export function generateStaticParams(): { id: string }[] {
  return [];
}

export default function InvitationLayout({ children }: { children: ReactNode }) {
  return children;
}
