import { notFound } from "next/navigation";
import { PARTYKIT_URL } from "@/app/env";
import type { Poll } from "@/app/types";
import PollUI from "@/components/PollUI";
import Balloon from "@/components/Balloon";
import { getServerSession } from "next-auth";
import { User } from "@/party/utils/auth";
import { authOptions } from "../api/auth/[...nextauth]/authOptions";

export default async function PollPage({
  params,
}: {
  params: { poll_id: string };
}) {
  const pollId = params.poll_id;

  // 🎈 send a GET request to the PartyKit room
  const req = await fetch(`${PARTYKIT_URL}/party/${pollId}/poll`, {
    method: "GET",
    next: {
      revalidate: 0,
    },
  });

  if (!req.ok) {
    if (req.status === 404) {
      return notFound();
    } else {
      console.error(req.text());
      throw new Error(`Unexpected response: ${req.status}`);
    }
  }

  const session = await getServerSession(authOptions);
  const user = session?.user as User | undefined;

  // 🎈 replace the mock data
  const poll = (await req.json()) as Poll;
  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between w-full">
          <h1 className="text-2xl font-bold">{poll.title}</h1>
          {/* creator title */}
          <div className="flex items-center gap-2 text-sm opacity-60">
            Created by {poll.creator.name} ({poll.creator.username})
          </div>
        </div>
        <PollUI
          id={pollId}
          options={poll.options}
          initialVotes={poll.votes}
          user={user}
        />
      </div>

      <Balloon float />
    </>
  );
}
