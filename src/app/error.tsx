"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[#f6465d] text-sm font-semibold tracking-widest uppercase mb-4">Error 500</p>
        <h1 className="text-7xl font-black text-white mb-4">500</h1>
        <p className="text-xl font-bold text-white mb-2">Something Went Wrong</p>
        <p className="text-gray-400 text-sm mb-8">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#f0b90b] text-black text-sm font-bold rounded-lg hover:bg-[#f0b90b]/90 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#0d0d0d] border border-[#1e1e1e] text-white text-sm font-semibold rounded-lg hover:border-[#f0b90b]/40 transition-colors"
          >
            Go Home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-gray-600 font-mono">ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
