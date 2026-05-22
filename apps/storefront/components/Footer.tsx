export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#ded7ca] py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm font-medium text-[#706b63] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>&copy; {new Date().getFullYear()} Storefront. All rights reserved.</p>
        <p className="font-black uppercase tracking-[0.14em] text-[#11100e]">Curated goods, verified vendors</p>
      </div>
    </footer>
  );
}
