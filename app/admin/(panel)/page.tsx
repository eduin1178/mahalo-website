import { currentUser } from "@clerk/nextjs/server";

import { getCurrentRole } from "@/lib/clerk/require-role";

export default async function AdminHomePage() {
  const user = await currentUser();
  const role = await getCurrentRole();

  const greeting =
    user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "there";

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
        Dashboard
      </p>
      <h1 className="text-3xl font-bold text-mahalo-navy-900">
        Welcome, {greeting}
      </h1>
      <p className="text-sm text-muted-foreground">
        Role:{" "}
        <span className="font-medium text-mahalo-navy-900">
          {role ?? "no role assigned"}
        </span>
      </p>
    </div>
  );
}
