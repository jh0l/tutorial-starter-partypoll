"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";

export function SignoutButton() {
  const session = useSession();
  if (!session) return null;
  return (
    <Link
      href="/api/auth/signout"
      className="bg-white rounded border absolute top-1 right-1 text-sm font-semibold text-gray-500 hover:text-gray-700 p-1 px-2"
    >
      Sign out
    </Link>
  );
}
