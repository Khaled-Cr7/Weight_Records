import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

// A throwaway account for testing, so you never retype sign-up details.
// The mobile "Join as user1" button signs in with these (development only).
const DEV_USER = {
  email: "user1@repsy.dev",
  username: "user1",
  displayName: "User 1",
  password: "user1pass123",
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create the dev user in production");
  }

  const user = await prisma.user.upsert({
    where: { email: DEV_USER.email },
    update: {},
    create: {
      email: DEV_USER.email,
      username: DEV_USER.username,
      displayName: DEV_USER.displayName,
      passwordHash: await hashPassword(DEV_USER.password),
      settings: { create: {} },
    },
    select: { id: true, email: true },
  });

  console.log(`Dev user ready: ${user.email} (${user.id})`);
}

main()
  .catch((error) => {
    console.error("Dev user seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });