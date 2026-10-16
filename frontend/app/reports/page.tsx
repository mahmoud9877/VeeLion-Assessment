import type { Metadata } from "next";
import { ReportsOverview } from "@/components/reports/ReportsOverview";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return <ReportsOverview />;
}
