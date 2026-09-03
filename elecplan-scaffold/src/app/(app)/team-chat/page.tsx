import TopBar from "@/components/TopBar";
import TeamChat from "@/components/TeamChat";
import { requireAccess } from "@/lib/session";

export default async function TeamChatPage(){
  const user=await requireAccess("teamChat");
  const businessName=user.business?.name??"YourPlan";
  const isQls=businessName.toLowerCase().includes("quality landscape solutions");
  const teamName=isQls?"QLS":businessName;
  return <>
    <TopBar title={isQls?"QLS Chat":"Team Chat"} subtitle={isQls?"QLS team chat":`${teamName} group chat`} />
    <div className="flex flex-1 overflow-hidden p-3 sm:p-4 md:p-6" style={{background:"var(--app-bg, #03101f)"}}>
      <TeamChat embedded teamName={teamName} />
    </div>
  </>;
}
