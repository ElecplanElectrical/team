"use client";
import Link from "next/link";
import {useRef,useState} from "react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

type DashboardMetrics={quotePipeline:number;acceptedQuotes:number;receivables:number;payables:number;paidRevenue:number;paidSupplierBills:number;overdueCount:number;activeJobs:number;completedJobs:number;quotedJobs:number;scheduledJobs:number;clients:number;quoteCount:number;invoiceCount:number};
type UpcomingJob={id:string;title:string;scheduledStart:string|null;scheduledEnd:string|null;status:string;assignedTo:string|null;client:string};
type Reminder={id:string;title:string;dueDate:string|null;tag:string|null};
type CashPoint={label:string;value:number};

export default function DashboardView({
  metrics,
  upcomingJobs,
  reminders,
  weeklyGoal,
  cashSeries:_cashSeries,
}:{
  metrics:DashboardMetrics;
  upcomingJobs:UpcomingJob[];
  reminders:Reminder[];
  weeklyGoal:string;
  cashSeries:CashPoint[];
}){
  const[currentGoal,setCurrentGoal]=useState(weeklyGoal);
  const[editingGoal,setEditingGoal]=useState(false);
  const[goalDraft,setGoalDraft]=useState(weeklyGoal);
  const[goalSaving,setGoalSaving]=useState(false);
  const[goalError,setGoalError]=useState<string|null>(null);
  const lastGoalTap=useRef(0);

  function startGoalEdit(){
    if(editingGoal)return;
    setGoalDraft(currentGoal);
    setGoalError(null);
    setEditingGoal(true);
  }

  function handleGoalTouch(){
    if(editingGoal)return;
    const now=Date.now();
    if(now-lastGoalTap.current<350){
      lastGoalTap.current=0;
      startGoalEdit();
    }else{
      lastGoalTap.current=now;
    }
  }

  async function saveGoal(){
    const text=goalDraft.trim();
    if(!text){
      setGoalError("Enter a focus for this week.");
      return;
    }
    setGoalSaving(true);
    setGoalError(null);
    try{
      const response=await fetch("/api/weekly-goal",{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({text}),
      });
      const body=await response.json().catch(()=>null);
      if(!response.ok){
        setGoalError(body?.error??"Could not save weekly focus.");
        return;
      }
      setCurrentGoal(body?.goal??text);
      setGoalDraft(body?.goal??text);
      setEditingGoal(false);
    }catch{
      setGoalError("Could not save weekly focus. Check your connection and try again.");
    }finally{
      setGoalSaving(false);
    }
  }

  const focusJobs=upcomingJobs.slice(0,5);
  const openReminders=reminders.slice(0,5);

  return <>
    <TopBar title="Dashboard" subtitle="Deep Work"/>
    <div
      className="flex-1 overflow-auto px-3 pb-8 pt-3 sm:px-4 md:px-6 xl:px-7"
      style={{background:"var(--ep-main)"}}
    >
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 sm:gap-4">

        <section
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6"
          style={{
            background:"linear-gradient(145deg,var(--ep-shell),var(--ep-tray))",
            border:"1px solid rgba(67,210,255,.34)",
            boxShadow:"var(--ep-raised-shadow),0 0 30px rgba(67,210,255,.08)",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{background:"linear-gradient(90deg,#43D2FF,#78E5FF 55%,transparent)"}}
          />
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em]" style={{color:UI.cyan}}>
                Today
              </p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl" style={{color:UI.text}}>
                Focus
              </h2>
              <p className="mt-1 text-xs sm:text-sm" style={{color:UI.mute}}>
                The work that matters now. Everything else stays underneath.
              </p>
            </div>
            <Link
              href="/calendar"
              className="inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"
              style={{background:"rgba(67,210,255,.14)",border:"1px solid rgba(67,210,255,.28)",color:UI.cyan}}
            >
              Full calendar <ArrowRight size={13}/>
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,.65fr)]">
            <div
              className="rounded-xl p-3 sm:p-4"
              style={{background:"rgba(255,255,255,.035)",border:`1px solid ${UI.borderSoft}`}}
            >
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays size={17} style={{color:UI.cyan}}/>
                <h3 className="text-sm font-semibold" style={{color:UI.text}}>Today & next up</h3>
                <span className="ml-auto text-[10px]" style={{color:UI.faint}}>
                  {focusJobs.length} scheduled
                </span>
              </div>

              {focusJobs.length ? (
                <div className="divide-y" style={{borderColor:UI.borderSoft}}>
                  {focusJobs.map((job,index)=><div
                    key={job.id}
                    className="grid grid-cols-[44px_1fr] gap-3 py-3 first:pt-1"
                  >
                    <DateBadge value={job.scheduledStart}/>
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" style={{color:UI.text}}>
                            {job.title}
                          </p>
                          <p className="mt-1 truncate text-[11px]" style={{color:UI.mute}}>
                            {formatTimeRange(job.scheduledStart,job.scheduledEnd)}
                            {job.client?` · ${job.client}`:""}
                          </p>
                        </div>
                        {index===0&&<span
                          className="shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide"
                          style={{background:"rgba(67,210,255,.15)",color:UI.cyan}}
                        >
                          Next
                        </span>}
                      </div>
                    </div>
                  </div>)}
                </div>
              ):(
                <Empty icon={CalendarDays} text="No scheduled jobs. Your focus lane is clear."/>
              )}
            </div>

            <div
              className="rounded-xl p-4"
              style={{background:"linear-gradient(145deg,rgba(67,210,255,.08),rgba(255,255,255,.025))",border:"1px solid rgba(67,210,255,.20)"}}
            >
              <div className="flex items-center gap-2">
                <Target size={18} style={{color:UI.orange}}/>
                <p className="text-[10px] font-bold uppercase tracking-[.15em]" style={{color:UI.orange}}>
                  Weekly focus
                </p>
              </div>

              <div
                className="mt-4 min-h-[150px]"
                onDoubleClick={startGoalEdit}
                onPointerUp={e=>{if(e.pointerType==="touch")handleGoalTouch()}}
                aria-label="Double tap to edit weekly focus"
              >
                {editingGoal ? (
                  <div onDoubleClick={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}>
                    <textarea
                      autoFocus
                      value={goalDraft}
                      onChange={e=>setGoalDraft(e.target.value)}
                      rows={5}
                      maxLength={500}
                      placeholder="Set this week's focus…"
                      className="w-full resize-none rounded-xl px-3 py-3 text-sm outline-none"
                      style={{background:"var(--ep-input)",border:`1px solid ${UI.border}`,color:UI.text,boxShadow:"var(--ep-inset-shadow)"}}
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={goalSaving}
                        onClick={()=>{setGoalDraft(currentGoal);setGoalError(null);setEditingGoal(false)}}
                        className="rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{color:UI.mute,border:`1px solid ${UI.border}`}}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={goalSaving}
                        onClick={()=>void saveGoal()}
                        className="rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50"
                        style={{background:UI.blue,color:"#062531"}}
                      >
                        {goalSaving?"Saving…":"Save focus"}
                      </button>
                    </div>
                    {goalError&&<p className="mt-2 text-xs" style={{color:UI.red}}>{goalError}</p>}
                  </div>
                ):(
                  <>
                    <p className="whitespace-pre-line text-base font-semibold leading-7 sm:text-lg" style={{color:UI.text}}>
                      {currentGoal||"Set the main focus for the week."}
                    </p>
                    <p className="mt-5 text-[10px]" style={{color:UI.faint}}>
                      Double-click or double-tap to edit.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniStat label="Active jobs" value={metrics.activeJobs}/>
                <MiniStat label="Scheduled" value={metrics.scheduledJobs}/>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
          <Panel
            title="Upcoming reminders"
            action={{href:"/reminders",label:"View all reminders"}}
          >
            {openReminders.length?(
              <div className="space-y-2">
                {openReminders.map(r=><div
                  key={r.id}
                  className="flex gap-3 rounded-lg p-3"
                  style={{background:"rgba(255,255,255,.04)",border:`1px solid ${UI.borderSoft}`}}
                >
                  <Bell size={16} className="mt-0.5 shrink-0" style={{color:UI.orange}}/>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{color:UI.text}}>{r.title}</p>
                    <p className="mt-1 text-[11px]" style={{color:UI.faint}}>
                      {reminderDate(r.dueDate)}{r.tag?` · ${r.tag}`:""}
                    </p>
                  </div>
                </div>)}
              </div>
            ):(
              <Empty icon={CheckCircle2} text="No open reminders. You're clear."/>
            )}
          </Panel>

          <Panel title="Quick actions">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <QuickAction href="/calendar" icon={CalendarDays} label="New event"/>
              <QuickAction href="/jobs" icon={BriefcaseBusiness} label="Jobs"/>
              <QuickAction href="/quotes" icon={FileText} label="New quote"/>
              <QuickAction href="/clients" icon={Users} label="Clients"/>
              <QuickAction href="/reminders" icon={Bell} label="To do"/>
              <QuickAction href="/ai-assistant" icon={Sparkles} label="AI Assistant"/>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="Quotes" value={metrics.quoteCount}/>
              <MiniStat label="Clients" value={metrics.clients}/>
              <MiniStat label="Overdue" value={metrics.overdueCount}/>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  </>;
}

function Panel({title,children,action}:{title:string;children:React.ReactNode;action?:{href:string;label:string}}){
  return <section
    className="rounded-xl p-3.5 sm:p-4 md:p-5"
    style={{background:"var(--ep-shell)",boxShadow:"var(--ep-raised-shadow)",border:`1px solid ${UI.border}`}}
  >
    <div className="mb-3.5 flex items-center gap-3 sm:mb-5">
      <h2 className="text-sm font-semibold" style={{color:UI.text}}>{title}</h2>
    </div>
    {children}
    {action&&<Link href={action.href} className="mt-4 inline-flex items-center gap-1.5 text-xs sm:mt-5" style={{color:UI.cyan}}>
      {action.label}<ArrowRight size={13}/>
    </Link>}
  </section>;
}

function QuickAction({href,icon:Icon,label}:{href:string;icon:typeof CalendarDays;label:string}){
  return <Link
    href={href}
    className="flex min-h-[92px] flex-col justify-between rounded-xl p-3 transition hover:-translate-y-0.5"
    style={{background:"rgba(67,210,255,.065)",border:"1px solid rgba(67,210,255,.18)",color:UI.text}}
  >
    <Icon size={18} style={{color:UI.cyan}}/>
    <span className="text-xs font-bold">{label}</span>
  </Link>;
}

function MiniStat({label,value}:{label:string;value:number}){
  return <div
    className="rounded-lg p-2.5"
    style={{background:"rgba(255,255,255,.035)",border:`1px solid ${UI.borderSoft}`}}
  >
    <p className="text-[9px] uppercase tracking-[.08em]" style={{color:UI.faint}}>{label}</p>
    <p className="mt-1 text-lg font-bold" style={{color:UI.text}}>{value}</p>
  </div>;
}

function DateBadge({value}:{value:string|null}){
  if(!value)return <div/>;
  const d=new Date(value);
  return <div
    className="flex h-12 w-11 flex-col items-center justify-center rounded-lg"
    style={{background:"rgba(67,210,255,.11)",border:"1px solid rgba(67,210,255,.26)"}}
  >
    <span className="text-[9px] font-semibold uppercase" style={{color:UI.cyan}}>
      {d.toLocaleDateString("en-AU",{weekday:"short",timeZone:"Australia/Melbourne"})}
    </span>
    <strong className="text-base" style={{color:UI.text}}>
      {new Intl.DateTimeFormat("en-AU",{day:"numeric",timeZone:"Australia/Melbourne"}).format(d)}
    </strong>
  </div>;
}

function formatTimeRange(s:string|null,e:string|null){
  if(!s)return"Time not set";
  const f=new Intl.DateTimeFormat("en-AU",{hour:"numeric",minute:"2-digit",timeZone:"Australia/Melbourne"});
  return e?`${f.format(new Date(s))} – ${f.format(new Date(e))}`:f.format(new Date(s));
}

function reminderDate(v:string|null){
  if(!v)return"No due date";
  return new Intl.DateTimeFormat("en-AU",{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",timeZone:"Australia/Melbourne"}).format(new Date(v));
}

function Empty({icon:Icon,text}:{icon:typeof CalendarDays;text:string}){
  return <div className="flex min-h-[130px] flex-col items-center justify-center gap-3 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{background:"rgba(67,210,255,.14)",color:UI.cyan}}>
      <Icon size={18}/>
    </div>
    <p className="max-w-xs text-xs" style={{color:UI.mute}}>{text}</p>
  </div>;
}
