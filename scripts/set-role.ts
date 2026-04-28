/**
 * Set a Clerk user's admin-panel role from the command line.
 *
 * Usage:
 *   npm run set-role -- <email> <admin|agent>
 *   npm run set-role -- eduin1178@gmail.com admin
 *
 * Reads CLERK_SECRET_KEY from the environment.
 */
import "dotenv/config";
import { createClerkClient } from "@clerk/backend";

const VALID_ROLES = ["admin", "agent"] as const;
type Role = (typeof VALID_ROLES)[number];

async function main() {
  const [email, roleArg] = process.argv.slice(2);

  if (!email || !roleArg) {
    console.error("Usage: npm run set-role -- <email> <admin|agent>");
    process.exit(1);
  }
  if (!VALID_ROLES.includes(roleArg as Role)) {
    console.error(`Invalid role: ${roleArg}. Must be one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is not set in the environment.");
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  const { data: users } = await clerk.users.getUserList({ emailAddress: [email] });
  if (users.length === 0) {
    console.error(`No Clerk user found with email: ${email}`);
    process.exit(1);
  }
  const user = users[0];

  await clerk.users.updateUser(user.id, {
    publicMetadata: { ...(user.publicMetadata ?? {}), role: roleArg as Role },
  });

  console.log(`OK · ${email} → role=${roleArg}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
