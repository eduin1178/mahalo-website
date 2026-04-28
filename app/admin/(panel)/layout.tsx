import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { Logo } from "@/components/brand/Logo";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { visibleNavFor } from "@/components/admin/nav-config";
import { getCurrentRole } from "@/lib/clerk/require-role";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();
  const role = await getCurrentRole();
  const items = visibleNavFor(role);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <Logo width={140} height={40} />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={items} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileSidebar items={items} />
            <span className="text-sm font-semibold text-mahalo-navy-900 md:hidden">
              Mahalo Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            {role ? (
              <span className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600 sm:inline">
                {role}
              </span>
            ) : null}
            <UserButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
