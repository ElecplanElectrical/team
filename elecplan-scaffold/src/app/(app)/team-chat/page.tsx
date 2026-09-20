import TopBar from "@/components/TopBar";
import TeamChat from "@/components/TeamChat";

export default function TeamChatPage(){
  return <>
    <TopBar title="Team Chat" subtitle="Elecplan team group chat" />
    <div className="flex flex-1 overflow-hidden p-3 sm:p-4 md:p-6" style={{background:"#0d1117"}}>
      <TeamChat embedded />
    </div>
  </>;
}
