import Link from "next/link";

const Logo = () => {
  return (
    <Link
      href="/"
      className="object-contain w-10 h-10 fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
    >
      <img src="/papabear.jpg" alt="Papa Bear Logo" />
    </Link>
  );
};

export default Logo;
