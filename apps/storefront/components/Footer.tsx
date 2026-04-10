export default function Footer() {
  return (
    <footer className="mt-auto py-8 border-t border-black/5 dark:border-white/10">
      <div className="container mx-auto px-4 text-center text-minimal-gray text-sm font-medium tracking-wide">
        <p>&copy; {new Date().getFullYear()} STOREFRONT. All rights reserved.</p>
      </div>
    </footer>
  );
}
