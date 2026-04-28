import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

import type { AppRole } from "./require-role";

function getBootstrapEmails(): string[] {
  return (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

type AuthorizationResult =
  | { status: "unauthenticated" }
  | { status: "authorized"; role: AppRole }
  | { status: "pending"; email: string | null };

/**
 * Resolves the current user's effective role for the admin panel.
 *
 * Side effect: if the user has no role assigned but their primary email is in
 * `ADMIN_BOOTSTRAP_EMAILS`, they are auto-promoted to `admin` on first hit so
 * the very first deployer of a fresh Clerk app can get into the panel without
 * manually editing publicMetadata in the dashboard.
 */
export async function authorizeAdminUser(): Promise<AuthorizationResult> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { status: "unauthenticated" };

  const claims = sessionClaims?.publicMetadata as { role?: AppRole } | undefined;
  if (claims?.role === "admin" || claims?.role === "agent") {
    return { status: "authorized", role: claims.role };
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
  const bootstrap = getBootstrapEmails();

  if (email && bootstrap.includes(email)) {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { ...(user?.publicMetadata ?? {}), role: "admin" },
    });
    return { status: "authorized", role: "admin" };
  }

  return { status: "pending", email };
}
