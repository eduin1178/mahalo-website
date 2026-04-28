import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AppRole = "admin" | "agent";

type ClerkPublicMetadata = {
  role?: AppRole;
};

export async function getCurrentRole(): Promise<AppRole | null> {
  const { sessionClaims } = await auth();
  const publicMetadata = sessionClaims?.publicMetadata as
    | ClerkPublicMetadata
    | undefined;
  return publicMetadata?.role ?? null;
}

export async function requireRole(role: AppRole): Promise<AppRole> {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) {
    redirectToSignIn();
    redirect("/admin/sign-in");
  }
  const publicMetadata = sessionClaims?.publicMetadata as
    | ClerkPublicMetadata
    | undefined;
  const currentRole = publicMetadata?.role;
  if (role === "admin" && currentRole !== "admin") {
    redirect("/admin");
  }
  if (role === "agent" && currentRole !== "admin" && currentRole !== "agent") {
    redirect("/admin/sign-in");
  }
  return currentRole as AppRole;
}
