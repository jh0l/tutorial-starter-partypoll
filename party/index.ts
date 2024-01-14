import type * as Party from "partykit/server";
import type {
  Poll,
  VoteMessage,
  User,
  IndexPartySocketMessageFromUser,
  IndexPartySocketMessageFromServer,
  UsersMessage,
  PollMessage,
  VoteMessageBroadcast,
} from "@/app/types";
import { error, ok } from "./utils/response";
import { getNextAuthSession } from "./utils/auth";

type PollPartyConnection = Party.Connection<{
  user: Omit<User, "option" | "present"> | null;
}>;

function randomUserGenerator(options: number) {
  const user: User = {
    username: Math.random().toString(36).substring(2, 5),
    name: "Test User",
    email: `${Math.random().toString(36).substring(2, 5)}@example.com`,
    image: "https://i.pravatar.cc/100",
    present: Math.random() > 0.5,
    option:
      Math.random() > 0.5 ? Math.floor(Math.random() * options) : undefined,
  };
  return user;
}

function addTestUsers(server: Server, numberOfUsers = 5) {
  const options = server.poll?.options.length || 0;
  for (let i = 0; i < numberOfUsers; i++) {
    const user = randomUserGenerator(options);
    server.addUser(user);
    user.option !== undefined && server.poll?.votes[user.option].push(user);
  }
}

export default class Server implements Party.Server {
  constructor(readonly party: Party.Room) {}

  poll: Poll | undefined;
  users: { [k: string]: User } = {};

  async onStart() {
    this.poll = await this.party.storage.get<Poll>("poll");
    this.users =
      (await this.party.storage.get<{ [k: string]: User }>("users")) || {};
    // set all users to nto present
    Object.values(this.users).forEach((user) => (user.present = false));

    // addTestUsers(this);
  }

  async onRequest(req: Party.Request) {
    // respond to cors preflight requests
    if (req.method === "OPTIONS") {
      return ok();
    }

    const { pathname } = new URL(req.url);
    // if request ends in /auth, auth request
    if (pathname.endsWith("/auth")) {
      return await this.authenticateUser(req);
    }
    // if request ends in /data, poll request
    else if (pathname.endsWith("/poll")) {
      if (req.method === "POST") {
        const poll = (await req.json()) as Poll;
        this.poll = { ...poll, votes: poll.options.map(() => []) };
        this.savePoll();
      }

      if (this.poll) {
        return new Response(JSON.stringify(this.poll), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not found", { status: 404 });
    }
    return new Response("Not found", { status: 404 });
  }

  async onMessage(message: string, sender: PollPartyConnection) {
    if (!this.poll) return;
    console.log("ONMESSAGE", message, this.users, sender.state);
    const user = sender.state?.user;
    if (!user) {
      sender.send(JSON.stringify({ error: "e0: Not logged in" }));
      return;
    }
    const { username } = user;
    const event = JSON.parse(message) as IndexPartySocketMessageFromUser;
    if (event.type === "vote") {
      const { option } = this.users[username];
      if (option !== undefined) {
        this.poll.votes[option] = this.poll.votes[option].filter(
          (u) => u.username !== username,
        );
      }
      this.users[username].option = event.option;
      sender.setState({ user: this.users[username] });

      this.poll.votes[event.option].push(this.users[username]);
      this.party.broadcast(
        JSON.stringify({
          type: "vote",
          option: event.option,
          user: this.users[username],
          oldOption: option,
        } as VoteMessageBroadcast),
      );
      this.savePoll();
      this.saveUsers();
    }
  }

  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
    const { state } = connection;
    if (!state || !("user" in state) || typeof state.user !== "object") return;
    if (!state.user || !("username" in state.user)) return;
    if (typeof state.user.username !== "string") return;
    this.users[state.user.username].present = false;
    this.party.broadcast(
      JSON.stringify({
        type: "users",
        users: this.users,
      } as UsersMessage),
    );
  }

  async savePoll() {
    if (this.poll) {
      await this.party.storage.put<Poll>("poll", this.poll);
    }
  }

  async saveUsers() {
    await this.party.storage.put<{ [k: string]: User }>("users", this.users);
  }

  async addUser(user: User) {
    const existingUser = this.users[user.username];
    const userPresent = { ...existingUser, ...user, present: true };
    this.users[user.username] = userPresent;
    this.party.broadcast(
      JSON.stringify({ type: "users", users: this.users } as UsersMessage),
    );
    this.saveUsers();
  }

  async authenticateUser(proxiedRequest: Party.Request) {
    const id = new URL(proxiedRequest.url).searchParams.get("_pk");
    const connection = id && this.party.getConnection(id);
    if (!connection) {
      return error("Failed to find connection with id " + id);
    }
    // authenticate
    const session = await getNextAuthSession(proxiedRequest);
    console.log("AUTHENTICATE USER", session);
    if (!session) {
      connection.send(await error("Failed to get session").text());
      return error("Failed to get session");
    }

    // this is where you would update main room user listings

    connection.setState({ user: session });
    this.addUser({ ...session, present: true });
    connection.send(
      JSON.stringify({
        type: "poll",
        poll: this.poll,
      } as PollMessage),
    );
    return ok();
  }
}

Server satisfies Party.Worker;
