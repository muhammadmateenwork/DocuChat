import { redirect } from "next/navigation";
import { getCurrentUser, getOrCreateUserOrg } from "@/lib/authz";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileTopNav } from "@/components/dashboard/MobileTopNav";
import { CommandPalette } from "@/components/dashboard/CommandPalette";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const org = await getOrCreateUserOrg(user.id, user.email ?? null);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgName={org.name} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileTopNav />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
