"use client";

import { PARTYKIT_HOST } from "@/app/env";
import {
  IndexPartySocketMessageFromServer,
  User,
  VoteMessage,
} from "@/app/types";
import usePartySocket from "partysocket/react";
import { useEffect, useState } from "react";
import PollOptions from "./PollOptions";
import PartySocket from "partysocket";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

const identify = async (socket: PartySocket) => {
  // the ./auth route will authenticate the connection using the user's session cookie
  const url = `${window.location.pathname}/auth?_pk=${socket._pk}`;
  const req = await fetch(url, { method: "POST" });
  if (!req.ok) {
    const res = await req.text();
    console.error("Failed to authenticate connection", res);
  }
};

export default function PollUI({
  id,
  options,
  initialVotes,
  user,
}: {
  id: string;
  options: string[];
  initialVotes?: User[][];
  user?: User;
}) {
  const [users, setUsers] = useState<{ [k: string]: User }>({});
  const [votes, setVotes] = useState<User[][]>(initialVotes || []);
  const [vote, setVote] = useState<User>();
  const session = useSession();
  // 🎈 usePartySocket hook
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: id,
    onOpen(event) {
      if (session.status === "authenticated" && event.target) {
        identify(event.target as PartySocket);
      }
    },
    onMessage(event) {
      const message = JSON.parse(
        event.data,
      ) as IndexPartySocketMessageFromServer;
      switch (message.type) {
        case "vote":
          setUsers((prevUsers) => {
            const newUsers = { ...prevUsers };
            newUsers[message.user.username] = message.user;
            return newUsers;
          });
          setVotes((prevVotes) => {
            const newVotes = [...prevVotes];
            if (message.oldOption !== undefined) {
              newVotes[message.oldOption] = newVotes[message.oldOption].filter(
                (user) => user.username !== message.user.username,
              );
            }
            newVotes[message.option] = [
              ...newVotes[message.option],
              message.user,
            ];
            return newVotes;
          });
          break;
        case "users":
          setUsers(message.users);
          break;
        case "poll":
          setVotes(message.poll.votes);
          break;
        default:
          console.error(
            `Unexpected messeage: ${JSON.stringify(message, null, "  ")}`,
          );
          break;
      }
    },
  });

  useEffect(() => {
    console.log("POLLUI", user?.username, users);
    if (user?.username) {
      setVote(users[user.username]);
    }
  }, [users, user?.username]);

  // authenticate connection to the partykit room if session status changes
  useEffect(() => {
    if (
      session.status === "authenticated" &&
      socket?.readyState === socket.OPEN
    ) {
      identify(socket);
    }
  }, [session.status, socket]);

  const sendVote = (option: number) => {
    // 🎈 send message via WebSockets
    const message: VoteMessage = { type: "vote", option };
    socket.send(JSON.stringify(message));
    // setVote(option);
  };

  return (
    <>
      <PollOptions
        options={options}
        votes={votes}
        vote={vote && vote.option}
        setVote={sendVote}
      />
      {/* wrapping list of user profile images, dimmed if not present */}
      <div className="flex flex-wrap gap-2">
        {Object.values(users).map((user) => (
          <div className="relative" key={user.username}>
            <HoverCard>
              <HoverCardTrigger>
                <Image
                  key={user.username}
                  src={user.image || "https://i.imgur.com/6VBx3io.png"}
                  alt={user.username}
                  className="rounded-full"
                  width={32}
                  height={32}
                />
                {user.present && (
                  <span className="w-2 h-2 absolute -top-0.5 -right-0.5 bg-green-400 rounded"></span>
                )}
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="flex justify-between gap-4">
                  <Image
                    key={user.username}
                    src={user.image || "https://i.imgur.com/6VBx3io.png"}
                    alt={user.username}
                    className="rounded-full w-16 h-16"
                    width={64}
                    height={64}
                  />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{user.username}</h4>
                    <p className="text-sm">{user.name}</p>
                    <div className="flex items-center pt-2">
                      <span className="text-xs text-muted-foreground break-all">
                        {user.email}
                      </span>
                    </div>
                    {user.option !== undefined ? (
                      <span className="text-xs">
                        voted for{" "}
                        <span className="bg-blue-100 shadow-inner px-2 rounded">
                          {user.option}
                        </span>
                      </span>
                    ) : (
                      <p className="text-xs">has not voted</p>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        ))}
      </div>
      {user ? (
        <div className="bg-green-100 bg-opacity-30 text-green-700 px-4 py-3 rounded relative mt-3">
          <span className="block text-sm">
            You are logged in as {user.name} ({user.email}).
          </span>
        </div>
      ) : (
        <div className="bg-red-100 border border-red-400 bg-opacity-20 text-red-700 px-4 py-3 rounded-lg relative mt-3">
          <Link
            className="underline"
            href={`/api/auth/signin?callbackUrl=${window.location.href}`}
          >
            Sign in
          </Link>
          <span className="block text-sm">
            You must be logged in to create a poll.
          </span>
        </div>
      )}
    </>
  );
}
