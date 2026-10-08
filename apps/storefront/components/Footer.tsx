export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--jwso-line)] bg-white py-7">
      <div className="jwso-container flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--jwso-muted)]">
        <p>&copy; {new Date().getFullYear()} JWSO</p>
        <p>Independent sellers. Thoughtful shopping.</p>
      </div>
    </footer>
  );
}
