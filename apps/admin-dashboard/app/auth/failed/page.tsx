import Link from "next/link";

export default function AuthFailedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">Unable to complete sign in</h1>
      <p>The dashboard session could not be established. Check your account and try again.</p>
      <Link href="/auth/start" className="underline">Try again</Link>
    </main>
  );
}
