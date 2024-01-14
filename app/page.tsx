import Button from "@/components/Button";
import PollMaker from "@/components/PollMaker";
import Balloon from "@/components/Balloon";
import { Poll } from "@/app/types";
import { redirect } from "next/navigation";
import { PARTYKIT_URL } from "./env";
import Input from "@/components/Input";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";
import { User } from "@/party/utils/auth";

const randomId = () => Math.random().toString(36).substring(2, 10);

export default async function Home() {
  // fetch user session for server rendering
  const session = await getServerSession(authOptions);
  const user = session?.user as User | undefined;

  async function createPoll(formData: FormData) {
    "use server";
    if (!user) {
      return;
    }

    const title = formData.get("title")?.toString() ?? "Anonymous poll";
    const options: string[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("option-") && value.toString().trim().length > 0) {
        options.push(value.toString());
      }
    }

    const id = randomId();
    const poll: Poll = {
      title,
      options,
      creator: user,
      votes: [],
    };

    // 🎈 send a POST request to a PartyKit room
    await fetch(`${PARTYKIT_URL}/party/${id}/poll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(poll),
    });

    redirect(`/${id}`);
  }

  return (
    <>
      <form action={createPoll}>
        <div className="flex flex-col space-y-6">
          <PollMaker user={user} />
        </div>
      </form>
      <Balloon />
    </>
  );
}
