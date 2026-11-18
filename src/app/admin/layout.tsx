import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user  = token ? await getSessionUser(token) : null;
  const adminEmail = process.env.ADMIN_EMAIL ?? "";

  if (!user || !adminEmail || user.email !== adminEmail) {
    notFound();
  }

  return <>{children}</>;
}
