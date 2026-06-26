import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Taste Profile & Literary Identity | Marginalia",
  description: "Visualize your dynamic literary profile. View your personal reading radar chart, extracted taste traits, and customized reading goals curated by Liora.",
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
