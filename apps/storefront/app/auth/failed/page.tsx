import Link from "next/link";

export default function AuthFailedPage() {
  return (
    <main className="jwso-container flex min-h-screen max-w-md flex-col items-start justify-center gap-4 py-12">
      <p className="jwso-kicker">JWSO account</p>
      <h1 className="jwso-page-title">Unable to complete sign in</h1>
      <p className="jwso-copy">
        Your session could not be established. Please try signing in again.
      </p>
      <Link href="/en/login" className="jwso-button">
        Return to sign in
      </Link>
    </main>
  );
}
