"use client";
/* eslint-disable react-hooks/set-state-in-effect -- prop-backed calendar state must resynchronise after server refreshes */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addMonths, differenceInCalendarDays, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Mic, Plus } from "lucide-react";
import type { Role } from "@prisma/client";
import { EVENT_COLOR } from "@/lib/theme";
import { weekKey } from "@/lib/week";
import TopBar from "@/components/TopBar";
import NewEventModal from "@/components/NewEventModal";
import EditEventModal,{type CalendarEvent}from"@/components/EditEventModal";
import VoiceScheduler from"@/components/VoiceScheduler";
import ClientSmsPanel from"@/components/ClientSmsPanel";

const UI={panel:"var(--brand-panel, #07192b)",panelAlt:"var(--brand-panel-alt, #09213a)",border:"var(--brand-border, rgba(77,150,221,.24))",borderSoft:"var(--brand-border-soft, rgba(77,150,221,.12))",text:"#f5f9ff",mute:"var(--brand-muted, #93a9c2)",faint:"var(--brand-faint, #617993)",blue:"var(--brand-primary, #168dff)",cyan:"var(--brand-accent, #25c7ff)"};
const JOB_CALENDAR_COLOR:Record<string,{bg:string;fg:string;border:string}>={
 SCHEDULED:{bg:"rgba(70,199,205,.24)",fg:"#b9fbff",border:"#52cbd0"},
 IN_PROGRESS:{bg:"rgba(34,197,94,.24)",fg:"#c9fbd8",border:"#43d879"},
 COMPLETE:{bg:"rgba(37,99,235,.28)",fg:"#dbeafe",border:"#60a5fa"},
};
type JobOption={id:string;title:string;client?:string|null;contactName?:string|null;phone?:string|null;address?:string|null;notes?:string|null;status?:string|null;crew?:string|null;scheduledStart?:string|null;scheduledEnd?:string|null};
type WeekSegment={event:CalendarEvent;startCol:number;endCol:number;lane:number};
function soft(color:string,amount:number){return`color-mix(in srgb, ${color} ${amount}%, transparent)`}
function dayStamp(d:Date){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}

export default function CalendarView({weekStart,events,jobs,employees,role,currentUserId}:{weekStart:string;events:CalendarEvent[];jobs:JobOption[];employees:{id:string;name:string}[];role:Role;currentUserId:string}){
 const router=useRouter();
 const[showModal,setShowModal]=useState(false),[showVoice,setShowVoice]=useState(false),[editingEvent,setEditingEvent]=useState<CalendarEvent|null>(null),[selectedCrew,setSelectedCrew]=useState<string[]>([]),[smsJobId,setSmsJobId]=useState<string|null>(null),[calendarEvents,setCalendarEvents]=useState(events);
 useEffect(()=>setCalendarEvents(events),[events]);
 const anchor=parseISO(weekStart),monthStart=startOfMonth(anchor),gridStart=startOfWeek(monthStart,{weekStartsOn:1}),gridEnd=endOfWeek(endOfMonth(anchor),{weekStartsOn:1});
 const days=useMemo(()=>{const count=differenceInCalendarDays(gridEnd,gridStart)+1;return Array.from({length:count},(_,i)=>addDays(gridStart,i))},[gridStart.getTime(),gridEnd.getTime()]);
 const weeks=useMemo(()=>Array.from({length:Math.ceil(days.length/7)},(_,i)=>days.slice(i*7,i*7+7)),[days]);
 const filteredEvents=useMemo(()=>selectedCrew.length===0?calendarEvents:calendarEvents.filter(e=>e.assignedToId&&selectedCrew.includes(e.assignedToId)),[calendarEvents,selectedCrew]);
 function goMonth(delta:number){router.push(`/calendar?month=${format(addMonths(monthStart,delta),"yyyy-MM")}`)}
 function goToday(){router.push(`/calendar?month=${format(new Date(),"yyyy-MM")}`)}
 function refresh(){setShowModal(false);setEditingEvent(null);router.refresh()}
 function toggleCrew(id:string){setSelectedCrew(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id])}
 function openEvent(event:CalendarEvent){if(event.jobId)router.push(`/jobs/${event.jobId}`);else setEditingEvent(event)}
 function segmentsForWeek(week:Date[]):WeekSegment[]{
  const weekStartDay=dayStamp(week[0]),weekEndDay=dayStamp(week[6]);
  const candidates=filteredEvents.map(event=>{
   const eventStart=dayStamp(parseISO(event.startsAt)),eventEnd=dayStamp(parseISO(event.endsAt));
   if(eventEnd<weekStartDay||eventStart>weekEndDay)return null;
   const start=eventStart<weekStartDay?weekStartDay:eventStart,end=eventEnd>weekEndDay?weekEndDay:eventEnd;
   return{event,startCol:differenceInCalendarDays(start,weekStartDay),endCol:differenceInCalendarDays(end,weekStartDay)};
  }).filter((x):x is Omit<WeekSegment,"lane">=>Boolean(x)).sort((a,b)=>a.startCol-b.startCol||b.endCol-a.endCol);
  const laneEnds:number[]=[];
  return candidates.map(item=>{let lane=laneEnds.findIndex(end=>end<item.startCol);if(lane<0){lane=laneEnds.length;laneEnds.push(item.endCol)}else laneEnds[lane]=item.endCol;return{...item,lane}});
 }
 function weekBar(segment:WeekSegment){
  const {event,startCol,endCol,lane}=segment,job=event.jobId?jobs.find(j=>j.id===event.jobId):null,c=(job?.status&&JOB_CALENDAR_COLOR[job.status])||EVENT_COLOR[event.type]||EVENT_COLOR.job;
  const label=[event.title,job?.client,job?.address,job?.crew].filter((part,index,all):part is string=>Boolean(part)&&all.indexOf(part)===index).join(" · ");
  const continuesBefore=dayStamp(parseISO(event.startsAt))<dayStamp(weeks.flat()[0]??monthStart);
  void continuesBefore;
  return <button key={`${event.id}-${format(weeks[0]?.[0]??monthStart,"yyyy-MM")}-${lane}-${startCol}`} onClick={()=>openEvent(event)} className="pointer-events-auto min-w-0 truncate px-2.5 py-1 text-left text-[10px] font-semibold sm:text-[11px]" style={{gridColumn:`${startCol+1} / ${endCol+2}`,gridRow:lane+1,background:c.bg,color:c.fg,borderLeft:`3px solid ${c.border}`,borderRight:`2px solid ${c.border}`,borderTop:`1px solid ${soft(c.border,48)}`,borderBottom:`1px solid ${soft(c.border,48)}`,borderRadius:7,marginLeft:5,marginRight:5,height:25,alignSelf:"start"}} title={`${label} — ${format(parseISO(event.startsAt),"d MMM")} to ${format(parseISO(event.endsAt),"d MMM")}`}>{label}</button>
 }
 const crewLabel=selectedCrew.length===0?"All team members":selectedCrew.length===1?(employees.find(x=>x.id===selectedCrew[0])?.name||"1 team member"):`${selectedCrew.length} team members`;
 return <><TopBar title="Calendar" rightSlot={<div className="flex items-center gap-2"><button onClick={()=>setShowVoice(true)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold" style={{background:"rgb(var(--brand-primary-rgb, 22 141 255) / .13)",color:UI.cyan,border:"1px solid rgb(var(--brand-accent-rgb, 37 199 255) / .28)"}}><Mic size={17}/><span className="hidden sm:inline">Voice</span></button><button onClick={()=>setShowModal(true)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold" style={{background:UI.blue,color:"white"}}><Plus size={17}/><span className="hidden sm:inline">New event</span></button></div>}/><div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{background:"radial-gradient(circle at 55% 0%,var(--brand-glow, rgba(20,91,160,.13)),transparent 35%),var(--app-bg, #03101f)"}}><div className="mx-auto w-full max-w-[1900px]"><main className="min-w-0 overflow-hidden rounded-xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex flex-wrap items-center justify-between gap-3 border-b p-3" style={{borderColor:UI.borderSoft}}><div className="flex items-center gap-2"><button onClick={goToday} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{background:UI.panelAlt,color:UI.text,border:`1px solid ${UI.border}`}}>Today</button><NavButton onClick={()=>goMonth(-1)} label="Previous month"><ChevronLeft size={15}/></NavButton><NavButton onClick={()=>goMonth(1)} label="Next month"><ChevronRight size={15}/></NavButton><strong className="ml-1 text-sm sm:text-base" style={{color:UI.text}}>{format(monthStart,"MMMM yyyy")}</strong></div><div className="flex items-center gap-2"><details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{background:UI.panelAlt,color:UI.text,border:`1px solid ${UI.border}`}}><Filter size={13}/><span>{crewLabel}</span><ChevronDown size={13}/></summary><div className="absolute right-0 top-11 z-40 w-56 rounded-xl p-2 shadow-2xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><button onClick={()=>setSelectedCrew([])} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs" style={{background:selectedCrew.length===0?"rgb(var(--brand-primary-rgb, 22 141 255) / .13)":"transparent",color:selectedCrew.length===0?UI.cyan:UI.mute}}><span>All team members</span></button>{employees.map(x=><button key={x.id} onClick={()=>toggleCrew(x.id)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs" style={{background:selectedCrew.includes(x.id)?"rgba(80,216,120,.10)":"transparent",color:selectedCrew.includes(x.id)?UI.text:UI.mute}}>{x.name}</button>)}</div></details><div className="rounded-lg px-3 py-2 text-xs font-semibold" style={{background:"rgb(var(--brand-primary-rgb, 22 141 255) / .13)",color:UI.cyan,border:`1px solid ${UI.border}`}}>Month</div></div></div><div className="overflow-x-auto"><div style={{minWidth:760}}><div className="grid grid-cols-7 border-b" style={{borderColor:UI.borderSoft}}>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider" style={{color:UI.faint}}>{d}</div>)}</div>{weeks.map((week,weekIndex)=>{const segments=segmentsForWeek(week),laneCount=Math.max(1,...segments.map(s=>s.lane+1)),rowHeight=Math.max(128,48+laneCount*29);return <div key={week[0].toISOString()} className="relative" style={{height:rowHeight}}><div className="grid h-full grid-cols-7">{week.map(day=><div key={day.toISOString()} className="border-b border-r p-1.5" style={{borderColor:UI.borderSoft,background:isToday(day)?"rgb(var(--brand-primary-rgb, 22 141 255) / .055)":isSameMonth(day,monthStart)?"transparent":"rgba(0,0,0,.13)"}}><span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold" style={{background:isToday(day)?UI.blue:"transparent",color:isToday(day)?"white":isSameMonth(day,monthStart)?UI.text:UI.faint}}>{format(day,"d")}</span></div>)}</div><div className="pointer-events-none absolute inset-x-0 top-10 grid grid-cols-7 gap-y-1" style={{gridAutoRows:"25px"}}>{segments.map(segment=>weekBar({...segment,lane:segment.lane}))}</div></div>})}</div></div></main></div></div><button onClick={()=>setShowVoice(true)} aria-label="Voice schedule" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full md:hidden" style={{background:"linear-gradient(145deg,var(--brand-primary, #168dff),var(--brand-primary-deep, #075fd0))",color:"white"}}><Mic size={23}/></button>{showModal&&<NewEventModal jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} defaultDate={weekKey(monthStart)} onClose={()=>setShowModal(false)} onDone={refresh}/>} {editingEvent&&<EditEventModal event={editingEvent} jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} onClose={()=>setEditingEvent(null)} onDone={refresh}/>}<VoiceScheduler open={showVoice} onClose={()=>setShowVoice(false)} onDone={()=>router.refresh()} jobs={jobs} employees={employees} role={role} currentUserId={currentUserId}/><ClientSmsPanel jobId={smsJobId} open={Boolean(smsJobId)} onClose={()=>setSmsJobId(null)}/></>}
function NavButton({children,onClick,label}:{children:React.ReactNode;onClick:()=>void;label:string}){return <button onClick={onClick} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{background:UI.panelAlt,border:`1px solid ${UI.border}`,color:UI.mute}}>{children}</button>}
