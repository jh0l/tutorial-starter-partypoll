"use client";

import { User } from "@/app/types";

function duplicateExtendArray(arr: any[], iterations: number = 10) {
  const res = [];
  for (let i = 0; i < iterations; i++) {
    res.push(...arr);
  }
  return res;
}

export default function PollOptions({
  options,
  votes,
  vote,
  setVote,
}: {
  options: string[];
  votes: User[][];
  vote: number | undefined;
  setVote: (option: number) => void;
}) {
  const totalVotes = votes.reduce((a, b) => a + b.length, 0);
  const mostVotes = votes.reduce((a, b) => (a.length > b.length ? a : b), []);

  return (
    <ul className="flex flex-col space-y-4">
      {options.map((option, i) => (
        <li key={i}>
          <div className="relative w-full min-h-[40px] border rounded-md border-black flex">
            <div
              className={`absolute top-0 left-0 bottom-0 w-full rounded-md transition-all duration-500 z-10 ${
                votes[i].length === mostVotes.length
                  ? "vote-bg-winning"
                  : vote === i
                    ? "vote-bg-own"
                    : "vote-bg"
              }`}
              style={{
                width:
                  vote === undefined
                    ? 0
                    : `${((votes[i].length ?? 0) / totalVotes) * 100}%`,
              }}
            >
              <div className="flex justify-end items-center w-full h-full max-w-xs overflow-hidden">
                {votes[i].slice(0, 5).map((user, i) => (
                  <div
                    key={user.username + i}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundImage: `url(${user.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                ))}
                {votes[i].length > 5 && (
                  <div className="h-3 rounded-sm bg-white bg-opacity-50  flex justify-center items-center text-xs">
                    +{votes[i].length - 5}
                  </div>
                )}
              </div>
            </div>

            <div className="select-none w-full flex items-center justify-between px-4 py-2 z-20">
              <button
                onClick={() => setVote(i)}
                className={`bg-blue-100 shadow-inner px-2 rounded hover:scale-110 transition-transform flex text-left ${
                  vote === undefined ? "cursor-pointer" : "cursor-default"
                } ${
                  vote === undefined
                    ? ""
                    : votes[i] === mostVotes
                      ? "font-bold"
                      : ""
                }`}
              >
                <span>
                  {vote === i && (
                    <span className="text-xl relative top-1">🎈 </span>
                  )}
                  {option}
                </span>
              </button>

              {vote === undefined ? null : <span>{votes[i].length ?? 0}</span>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
