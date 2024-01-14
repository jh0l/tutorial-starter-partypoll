export type User = {
  username: string;
  name?: string;
  email?: string;
  image?: string;
  expires?: string;
  present?: boolean;
  option?: number;
};

export type Poll = {
  title: string;
  options: string[];
  votes: User[][];
  creator: User;
};

export type IndexPartySocketMessageFromUser = VoteMessage;

export type VoteMessage = {
  type: "vote";
  option: number;
};

export type IndexPartySocketMessageFromServer =
  | PollMessage
  | VoteMessageBroadcast
  | UsersMessage;

export type PollMessage = {
  type: "poll";
  poll: Poll;
};

export type VoteMessageBroadcast = {
  type: "vote";
  option: number;
  user: User;
  oldOption?: number;
};

export type UsersMessage = {
  type: "users";
  users: { [k: string]: User };
};
