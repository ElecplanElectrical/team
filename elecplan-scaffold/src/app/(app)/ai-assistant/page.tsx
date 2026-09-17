import { requireAccess } from "@/lib/session";
import AiAssistantClient from "./AiAssistantClient";

export default async function AiAssistantPage(){
  await requireAccess("aiAssistant");
  return <AiAssistantClient/>;
}
