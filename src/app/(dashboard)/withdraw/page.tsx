"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/wallet"); }, [router]);
  return null;
}
