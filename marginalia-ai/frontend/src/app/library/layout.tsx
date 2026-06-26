import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Library & Whispering Archive | Marginalia",
  description: "Step inside Liora's Library. Manage your active books, converse with your AI reading companion, and explore your personal whispering archives.",
};

export default function LibraryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
