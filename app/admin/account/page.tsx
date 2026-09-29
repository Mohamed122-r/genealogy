import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountManager } from "@/components/admin/AccountManager";

export default async function AdminAccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AccountManager
      user={{
        id: session.user.id || "",
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role || "VIEWER",
      }}
    />
  );
}
