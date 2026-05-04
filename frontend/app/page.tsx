import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Stellar Invoice Protocol</h1>
      <p>On-chain invoice financing for SMEs — powered by Stellar &amp; Soroban.</p>
      <nav>
        <Link href="/sme">SME Dashboard</Link>
        {" | "}
        <Link href="/investor">Investor Dashboard</Link>
      </nav>
    </main>
  );
}
