import { Metadata } from "next";
import WithdrawalsClient from "./WithdrawalsClient";

export const metadata: Metadata = {
  title: "Withdrawal Proofs | NovaBit",
  description: "Verified TRC20 USDT transfer proofs on the TRON blockchain.",
};

export const dynamic = "force-dynamic";

export default function WithdrawalsPage() {
  return <WithdrawalsClient />;
}
