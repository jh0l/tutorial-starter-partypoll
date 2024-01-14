"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CreateNewPollButton() {
  const url = usePathname();
  console.log(url);
  if (url === "/") {
    return null;
  }
  return (
    <div>
      <Link
        href="/"
        className="p-2 px-4 bg-white text-black rounded shadow-lg font-semibold active:shadow active:border-4 border-blue-500"
      >
        Create New Poll
      </Link>
    </div>
  );
}
