import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stellar Invoice Protocol",
  description: "On-chain invoice financing for SMEs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
