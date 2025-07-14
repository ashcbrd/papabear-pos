import Link from "next/link";

const Logo = () => {
  return (
    <Link
      href="/"
      className="object-contain w-10 h-10 fixed bottom-4 right-4 z-50 rounded-full shadow-lg overflow-hidden bg-red-500"
    >
      <img src="/papabear.jpg" alt="Papa Bear Logo" className="rounded-full" />
    </Link>
  );
};

export default Logo;
