import { SignOutButton, UserButton } from "@clerk/nextjs";

import { Logo } from "@/components/brand/Logo";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { visibleNavFor } from "@/components/admin/nav-config";
import { authorizeAdminUser } from "@/lib/clerk/authorize";
import { countNewMessages } from "@/lib/contact/queries";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await authorizeAdminUser();

  if (result.status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mahalo-gradient-soft p-6">
        <div className="max-w-md space-y-4 rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
            Mahalo Admin
          </p>
          <h1 className="text-2xl font-bold text-mahalo-navy-900">
            Pending authorization
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account
            {result.email ? (
              <>
                {" "}
                (<span className="font-medium">{result.email}</span>)
              </>
            ) : null}{" "}
            is signed in but has not been granted access to this panel. Contact
            an administrator to be assigned a role.
          </p>
          <SignOutButton>
            <button className="text-sm font-semibold text-mahalo-blue-600 hover:underline">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  const role = result.status === "authorized" ? result.role : null;
  const baseItems = visibleNavFor(role);

  // Decorate the Messages entry with a count of unread submissions.
  const newMessages = role ? await countNewMessages() : 0;
  const items = baseItems.map((item) =>
    item.icon === "messages" ? { ...item, badge: newMessages } : item,
  );

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
