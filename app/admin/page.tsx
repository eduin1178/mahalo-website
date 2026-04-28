import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCurrentRole } from "@/lib/clerk/require-role";

export default async function AdminHomePage() {
  await auth.protect();
  const user = await currentUser();
  const role = await getCurrentRole();

  const greeting =
    user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "there";

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold text-mahalo-navy-900">
          Mahalo Admin
        </h1>
        <UserButton />
      </header>
      <section className="flex-1 px-6 py-10">
        <h2 className="text-2xl font-semibold text-mahalo-navy-900">
          Welcome, {greeting}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Role:{" "}
          <span className="font-medium text-mahalo-navy-900">
            {role ?? "no role assigned"}
          </span>
        </p>
      </section>
    </main>
  );
}
