import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[#f0b90b] text-sm font-semibold tracking-widest uppercase mb-4">Error 404</p>
        <h1 className="text-7xl font-black text-white mb-4">404</h1>
        <p className="text-xl font-bold text-white mb-2">Page Not Found</p>
        <p className="text-gray-400 text-sm mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#f0b90b] text-black text-sm font-bold rounded-lg hover:bg-[#f0b90b]/90 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-[#0d0d0d] border border-[#1e1e1e] text-white text-sm font-semibold rounded-lg hover:border-[#f0b90b]/40 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
