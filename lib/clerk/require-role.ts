import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AppRole = "admin" | "agent";

type ClerkPublicMetadata = {
  role?: AppRole;
};

/**
 * Reads the role from `sessionClaims.publicMetadata.role` first (cheap, JWT-only).
 * If the JWT was issued before the role was set (e.g., right after a bootstrap
 * promotion via `clerkClient.users.updateUser`), falls back to `currentUser()`
 * which fetches fresh `publicMetadata` from Clerk's API.
 */
async function readRole(): Promise<AppRole | null> {
  const { sessionClaims } = await auth();
  const fromClaims = (sessionClaims?.publicMetadata as ClerkPublicMetadata | undefined)
    ?.role;
  if (fromClaims === "admin" || fromClaims === "agent") return fromClaims;

  const user = await currentUser();
  const fromUser = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
  if (fromUser === "admin" || fromUser === "agent") return fromUser;

  return null;
}

export async function getCurrentRole(): Promise<AppRole | null> {
  return readRole();
}

export async function requireRole(role: AppRole): Promise<AppRole> {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    redirectToSignIn();
    redirect("/admin/sign-in");
  }
  const currentRole = await readRole();
  if (role === "admin" && currentRole !== "admin") {
    redirect("/admin");
  }
  if (role === "agent" && currentRole !== "admin" && currentRole !== "agent") {
    redirect("/admin/sign-in");
  }
  return currentRole as AppRole;
}
