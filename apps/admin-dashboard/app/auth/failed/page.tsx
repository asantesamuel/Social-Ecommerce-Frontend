import Link from "next/link";

export default function AuthFailedPage() {
  return (
    <main className="jwso-container flex min-h-screen max-w-md flex-col items-start justify-center gap-4 py-12">
      <p className="jwso-kicker">JWSO admin</p>
      <h1 className="jwso-page-title">Unable to complete sign in</h1>
      <p className="jwso-copy">
        Your admin session could not be established. Please check your account
        and try again.
      </p>
      <Link href="/auth/start" className="jwso-button">
        Try again
      </Link>
    </main>
  );
}
