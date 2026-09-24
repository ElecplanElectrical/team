"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { ArrowUp, CalendarDays, Camera, CheckCircle2, Clock3, ImagePlus, Loader2, Mic, MicOff, Plus, X } from "lucide-react";

import styles from "./assistant.module.css";


type Proposal={kind:"event"|"reminder";title:string;startsAt?:string;endsAt?:string;dueDate?:string;notes?:string;selected:boolean};
type Recognition={lang:string;continuous:boolean;interimResults:boolean;start():void;stop():void;onresult:((e:{results:ArrayLike<{0:{transcript:string}}>} )=>void)|null;onend:(()=>void)|null;onerror:(()=>void)|null};

export default function AiAssistantClient(){
 const [message,setMessage]=useState(""),[file,setFile]=useState<File|null>(null),[items,setItems]=useState<Proposal[]>([]),[answer,setAnswer]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[listening,setListening]=useState(false);
 const camera=useRef<HTMLInputElement>(null),library=useRef<HTMLInputElement>(null),rec=useRef<Recognition|null>(null),hold=useRef<ReturnType<typeof setTimeout>|null>(null),held=useRef(false),lastTap=useRef(0);
 const selected=items.filter(x=>x.selected).length;
 function choose(next?:File){if(!next)return;if(next.size>12*1024*1024){setError("That file is too large. Maximum 12 MB.");return}setFile(next);setItems([]);setAnswer("");setError("")}
 function startVoice(){if(busy||rec.current)return;const w=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C){setError("Voice input is not available in this browser. You can still type below.");return}const r=new C();r.lang="en-AU";r.continuous=true;r.interimResults=true;rec.current=r;setListening(true);setError("");r.onresult=e=>{let t="";for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript+" ";setMessage(t.trim())};r.onerror=()=>{setListening(false);rec.current=null;setError("Voice input stopped. Try again or type below.")};r.onend=()=>{setListening(false);rec.current=null};r.start()}
 function stopVoice(){rec.current?.stop()}
 async function send(text=message,ignoreFile=false){if(busy||(!text.trim()&&!file))return;setBusy(true);setError("");setAnswer("");setItems([]);try{const fd=new FormData();if(file&&!ignoreFile)fd.append("file",file);fd.append("instruction",text.trim()||"Read this and propose anything actionable. Do not add it until I approve.");const res=await fetch("/api/ai-assistant/analyse",{method:"POST",body:fd,cache:"no-store"});const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not complete that request.");setAnswer(data.summary||"Check the result below.");setItems((data.proposals||[]).map((x:Proposal)=>({...x,selected:x.kind==="reminder"||Boolean(x.startsAt)})))}catch(e){setError(e instanceof Error?e.message:"Could not complete that request.")}finally{setBusy(false)}}
 async function apply(){const proposals=items.filter(x=>x.selected);if(!proposals.length)return;setBusy(true);setError("");try{const res=await fetch("/api/ai-assistant/apply",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({proposals})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not add those items.");setItems([]);setFile(null);setMessage("");setAnswer(`Done — ${data.created} item${data.created===1?"":"s"} added to Elecplan.`)}catch(e){setError(e instanceof Error?e.message:"Could not add those items.")}finally{setBusy(false)}}
 function quick(q:string){setMessage(q);void send(q,true)}
 function down(){if(busy||listening)return;held.current=false;hold.current=setTimeout(()=>{held.current=true;lastTap.current=0;startVoice()},320)}
 function up(){if(hold.current){clearTimeout(hold.current);hold.current=null}if(held.current){held.current=false;stopVoice();return}const now=Date.now();if(now-lastTap.current<350){lastTap.current=0;camera.current?.click()}else lastTap.current=now}
 return <div className={styles.page}><div className={styles.wrap}>
  <header className={styles.head}><h1>Automated Assistant</h1><p>Speak, snap or type. Check bookings or organise work.</p></header>
  <section className={styles.hero}>
   <button type="button" className={`${styles.orb} ${listening?styles.live:""}`} onPointerDown={down} onPointerUp={up} onPointerCancel={()=>{if(hold.current)clearTimeout(hold.current);hold.current=null;if(held.current)stopVoice();held.current=false}} onContextMenu={e=>e.preventDefault()} aria-label="Hold EP to speak; double tap for camera"><img src="/ep-assistant-exact.svg" alt="EP" className={styles.epLogo}/></button>
   <strong>{listening?"Listening… release to finish":"Press and hold to speak"}</strong><small>Double tap the EP button for camera</small>
  </section>
  <input ref={camera} className={styles.hidden} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>{choose(e.target.files?.[0]);e.currentTarget.value=""}}/>
  <input ref={library} className={styles.hidden} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={e=>{choose(e.target.files?.[0]);e.currentTarget.value=""}}/>
  <div className={styles.actions}><button type="button" onClick={()=>camera.current?.click()}><Camera/>Take photo</button><button type="button" onClick={()=>library.current?.click()}><ImagePlus/>Choose from library</button></div>
  {file&&<div className={styles.attach}><ImagePlus/><span>{file.name}</span><button type="button" aria-label="Remove attachment" onClick={()=>setFile(null)}><X/></button></div>}
  <form className={styles.composer} onSubmit={e=>{e.preventDefault();void send()}}><textarea aria-label="Message Automated Assistant" placeholder="Ask Automated Assistant…" value={message} onChange={e=>setMessage(e.target.value)} maxLength={1000}/><button type="button" className={`${styles.round} ${styles.secondary}`} onClick={listening?stopVoice:startVoice} aria-label={listening?"Stop listening":"Start voice message"}>{listening?<MicOff/>:<Mic/>}</button><button className={styles.round} type="submit" disabled={busy||(!message.trim()&&!file)} aria-label="Send">{busy?<Loader2 className={styles.spin}/>:<ArrowUp/>}</button></form>
  <div className={styles.quick}><button onClick={()=>quick("What's booked for today?")}><CalendarDays/>Bookings</button><button onClick={()=>quick("Do I have any availability tomorrow?")}><Clock3/>Availability</button><button onClick={()=>setMessage("Schedule ")}><Plus/>Add event</button><button onClick={()=>setMessage("Remind me to ")}><CheckCircle2/>Add task</button></div>
  <p className={styles.note}>Calendar checks are read-only. Changes wait for your approval.</p>
  {error&&<div className={styles.error} role="alert">{error}</div>}
  {answer&&<section className={styles.answer} aria-live="polite"><h2>Assistant</h2><p>{answer}</p></section>}
  {items.length>0&&<section className={styles.review}><h2>Review before adding</h2>{items.map((x,i)=><div className={styles.proposal} key={i}><input type="checkbox" checked={x.selected} onChange={()=>setItems(v=>v.map((a,n)=>n===i?{...a,selected:!a.selected}:a))}/><div><strong>{x.title}</strong><small>{x.startsAt?new Date(x.startsAt).toLocaleString():x.dueDate?new Date(x.dueDate).toLocaleString():"No date supplied"}</small>{x.notes&&<small>{x.notes}</small>}</div><button type="button" onClick={()=>setItems(v=>v.filter((_,n)=>n!==i))}><X/></button></div>)}<button className={styles.apply} disabled={!selected||busy} onClick={()=>void apply()}>Approve and add {selected||"selected"}</button></section>}
 </div></div>
}