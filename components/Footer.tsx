import { CreateNewPollButton } from "./CreateNewPollButton";

export default function Footer() {
  return (
    <div className="text-white flex flex-col items-center space-y-4">
      <CreateNewPollButton />
      <div className="font-medium">Built with PartyKit and Next.js</div>
    </div>
  );
}
