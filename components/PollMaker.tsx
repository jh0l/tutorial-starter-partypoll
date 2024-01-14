"use client";

import { useRef, useState } from "react";
import Button from "./Button";
import Input from "./Input";
import { User } from "@/party/utils/auth";
import Link from "next/link";

const callbackUrl = process.env.NEXTAUTH_URL;

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

export default function PollMaker({ user }: { user?: User }) {
  const [newOption, setNewOption] = useState<string>("");
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const newOptionRef = useRef<HTMLInputElement>(null);
  const addNewOption = () => {
    if (newOption?.trim().length !== 0) {
      setOptions((prevOptions) => [...prevOptions, newOption]);
      setNewOption("");
    }
  };

  const canAdd = options.length < MAX_OPTIONS;
  const canSubmit =
    title.length > 0 &&
    options.length >= MIN_OPTIONS &&
    options.filter((option) => option.trim().length === 0).length === 0 &&
    user;
  return (
    <>
      <Input
        placeholder="Poll title"
        type="text"
        name="title"
        className={"text-2xl font-bold"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            newOptionRef.current?.focus();
          }
        }}
      />
      <ul className="flex flex-col space-y-4">
        {options.map((value, i) => (
          <li className="flex" key={i}>
            <Input type="text" name={`option-${i}`} defaultValue={value} />
          </li>
        ))}
        {canAdd && (
          <li className="flex space-x-4">
            <Input
              ref={newOptionRef}
              type="text"
              name="option-new"
              placeholder="New option"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newOption.length > 0) {
                    addNewOption();
                  }
                }
              }}
            />
            <Button theme="light" onClick={addNewOption}>
              Add
            </Button>
          </li>
        )}
      </ul>
      <Button type="submit" disabled={!canSubmit}>
        Create poll
      </Button>
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
            href={`/api/auth/signin?callbackUrl=${
              callbackUrl || window.location.href
            }`}
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
