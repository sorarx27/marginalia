import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reading Log & Literary History | Marginalia",
  description: "Browse your complete literary history. Review completed books, custom reading ratings, text reflections, and visual memories synthesized by Liora.",
};

export default function LogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
