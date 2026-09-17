import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export const runtime="nodejs";
const MAX_IMAGE_BYTES=12*1024*1024;

export async function POST(req:Request){
 const user=await getSessionUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!canAccess(user.role,"aiAssistant"))return NextResponse.json({error:"Forbidden"},{status:403});
 const apiKey=process.env.OPENAI_API_KEY;
 if(!apiKey)return NextResponse.json({error:"AI Assistant is not configured yet (OPENAI_API_KEY missing)."},{status:503});
 const form=await req.formData();
 const image=form.get("image");
 const instruction=String(form.get("instruction")||"Organise this whiteboard into my calendar and reminders.").slice(0,1000);
 if(!(image instanceof File)||!image.type.startsWith("image/"))return NextResponse.json({error:"Please upload a whiteboard image."},{status:400});
 if(image.size>MAX_IMAGE_BYTES)return NextResponse.json({error:"Image is too large. Maximum is 12 MB."},{status:413});
 const base64=Buffer.from(await image.arrayBuffer()).toString("base64");
 const today=new Date().toISOString();
 const schema={type:"object",additionalProperties:false,properties:{summary:{type:"string"},proposals:{type:"array",items:{type:"object",additionalProperties:false,properties:{kind:{type:"string",enum:["event","reminder"]},title:{type:"string"},startsAt:{type:["string","null"]},endsAt:{type:["string","null"]},dueDate:{type:["string","null"]},notes:{type:["string","null"]},confidence:{type:"number"}},required:["kind","title","startsAt","endsAt","dueDate","notes","confidence"]}}},required:["summary","proposals"]};
 const prompt=`You are Elecplan's scheduling assistant in Melbourne, Australia. Read a weekly handwritten electrical contractor whiteboard. Current timestamp is ${today}. User instruction: ${instruction}\nInterpret the board spatially: bottom Monday-Friday row usually contains jobs for those weekdays; right-side checklist contains reminders/tasks; left calendar contains dated/timed commitments. Do not invent unreadable handwriting. Put uncertainty in notes and lower confidence. For calendar items return ISO-8601 startsAt and endsAt with +10:00/+11:00 Australian local offset as appropriate; if a job has no time use a sensible 8:00am start and note that the time was assumed, normally 8 hours ending 4:00pm. Reminders use dueDate; if no reliable date, use null. Never apply anything: only propose it for user approval.`;
 try{
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_VISION_MODEL||"gpt-5.4-mini",input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:`data:${image.type};base64,${base64}`,detail:"high"}]}],text:{format:{type:"json_schema",name:"whiteboard_plan",strict:true,schema}}})});
  const data=await r.json();
  if(!r.ok)return NextResponse.json({error:"AI could not read the board right now."},{status:502});
  const text=data.output_text??data.output?.flatMap((o:any)=>o.content??[]).find((c:any)=>c.type==="output_text")?.text;
  if(!text)return NextResponse.json({error:"AI returned no readable plan."},{status:502});
  const parsed=JSON.parse(text);
  const proposals=(parsed.proposals||[]).filter((p:any)=>p?.title&&((p.kind==="event"&&p.startsAt&&p.endsAt)||p.kind==="reminder")).map((p:any)=>({kind:p.kind,title:p.title,startsAt:p.startsAt||undefined,endsAt:p.endsAt||undefined,dueDate:p.dueDate||undefined,notes:[p.notes,p.confidence<0.75?`AI confidence: ${Math.round(p.confidence*100)}% — check this item.`:null].filter(Boolean).join(" ")||undefined}));
  return NextResponse.json({summary:parsed.summary||"Board read. Check every item before applying.",proposals});
 }catch{return NextResponse.json({error:"Could not analyse whiteboard image."},{status:502});}
}
