import { Metadata } from "next";
import WithdrawalsClient from "./WithdrawalsClient";

export const metadata: Metadata = {
  title: "Campaign | GROXchange",
  description: "October 2024 loan campaign disbursement records. Verified TRC20 USDT transfers on the TRON blockchain.",
};

export const dynamic = "force-dynamic";

export default function WithdrawalsPage() {
  return <WithdrawalsClient />;
}
