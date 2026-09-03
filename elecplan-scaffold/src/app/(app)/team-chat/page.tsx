import TopBar from "@/components/TopBar";
import TeamChat from "@/components/TeamChat";
import { requireAccess } from "@/lib/session";

export default async function TeamChatPage(){
  const user=await requireAccess("teamChat");
  const teamName=user.business?.name??"YourPlan";
  return <>
    <TopBar title="Team Chat" subtitle={`${teamName} group chat`} />
    <div className="flex flex-1 overflow-hidden p-3 sm:p-4 md:p-6" style={{background:"var(--app-bg, #03101f)"}}>
      <TeamChat embedded teamName={teamName} />
    </div>
  </>;
}
