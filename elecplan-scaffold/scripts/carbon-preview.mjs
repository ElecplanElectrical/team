/** Build an isolated browser review from actual components. No production API/data. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const cwd=process.cwd();
const require=createRequire(path.join(cwd,'package.json'));
const esbuild=createRequire(require.resolve('tsx/package.json'))('esbuild');
const out=path.join(cwd,'.carbon-review');fs.mkdirSync(out,{recursive:true});
const nextMock=`import React,{useSyncExternalStore} from 'react';
const sub=cb=>{window.addEventListener('popstate',cb);return()=>window.removeEventListener('popstate',cb)};
export const usePathname=()=>useSyncExternalStore(sub,()=>window.__route||'/dashboard',()=>'/dashboard');
export const useSearchParams=()=>new URLSearchParams();
export const useRouter=()=>({push:go,replace:go,refresh:()=>{}});
export function go(p){window.__route=p;window.dispatchEvent(new PopStateEvent('popstate'))}
export default function Link({href,children,onClick,...p}){return <a href={href} {...p} onClick={e=>{e.preventDefault();onClick?.(e);go(href)}}>{children}</a>}`;
fs.writeFileSync(path.join(out,'next.jsx'),nextMock);
fs.writeFileSync(path.join(out,'auth.js'),`export const signOut=async()=>({});export const signIn=async()=>({ok:true});export const useSession=()=>({data:null,status:'unauthenticated'});`);
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{usePathname}from'./next.jsx';
import Sidebar from '@/components/Sidebar';import MobileNav from '@/components/MobileNav';
import Dashboard from '@/components/DashboardView';import Calendar from '@/components/CalendarView';
import Jobs from '@/components/JobsView';import Clients from '@/components/ClientsView';
import Bills from '@/components/BillsView';import Quotes from '@/components/QuotesView';
import Documents from '@/components/DocumentsView';import Materials from '@/components/MaterialsView';
import Equipment from '@/components/EquipmentView';import Employees from '@/components/EmployeesView';
import Reminders from '@/components/RemindersView';import Timesheets from '@/components/TimesheetsView';
import Inspections from '@/components/InspectionsView';import Certificates from '@/components/CertificatesView';
import Projects from '@/components/ProjectsView';import Reviews from '@/components/ReviewsView';
import Reels from '@/components/ReelsView';import Leads from '@/components/LeadsView';
import Kpis from '@/components/KpisView';import Analytics from '@/components/AnalyticsView';
import LoginForm from '@/components/LoginForm';import ChangePassword from '@/components/ChangePasswordForm';
import AI from '@/app/(app)/ai-assistant/AiAssistantClient';
const zero=new Proxy({},{get:()=>0});
const noop=()=>{};
const events=[{id:'review-one',title:'Example scheduled job',customTitle:null,jobId:null,assignedToId:null,type:'job-scheduled',startsAt:'2026-09-21T09:00:00+10:00',endsAt:'2026-09-21T11:00:00+10:00'},
{id:'review-two',title:'Example general event',customTitle:null,jobId:null,assignedToId:null,type:'event',startsAt:'2026-09-22T10:00:00+10:00',endsAt:'2026-09-22T11:30:00+10:00'},
{id:'review-three',title:'Example in-progress job',customTitle:null,jobId:null,assignedToId:null,type:'job-in-progress',startsAt:'2026-09-23T08:00:00+10:00',endsAt:'2026-09-23T12:00:00+10:00'}];
const exampleClients=Array.from({length:6},(_,i)=>({id:'example-client-'+i,name:'Example client '+(i+1),contactName:null,phone:null,email:null,address:null,billingNotes:null,jobs:0,billed:0,lastJob:null,sites:[{address:'Example site '+(i+1),jobs:[]}]}));
const views={
'/dashboard':()=> <Dashboard metrics={zero} upcomingJobs={[]} reminders={[]} weeklyGoal='Plan the day. Finish the job.' cashSeries={[{label:'Mon',value:0},{label:'Tue',value:0}]} />,
'/calendar':()=> <Calendar weekStart='2026-09-21' events={events} jobs={[]} employees={[]} role='ADMIN' currentUserId='review' />,
'/jobs':()=> <Jobs jobs={[]} clients={[]} crew={[]} canCreate={true} />,
'/clients':()=> <Clients clients={exampleClients} totalBilled={0} crew={[]} currentUserRole='ADMIN' xero={{configured:false,connected:false,tenantName:null}} />,
'/bills':()=> <Bills bills={[]} clients={[]} jobs={[]} storageReady={true} />,
'/quotes':()=> <Quotes quotes={[]} clients={[]} jobs={[]} />,
'/documents':()=> <Documents documents={[]} jobs={[]} canDelete={true} storageReady={true} canConfigureStorage={true} />,
'/materials':()=> <Materials items={[]} />,
'/equipment':()=> <Equipment equipment={[]} jobs={[]} users={[]} role='ADMIN' />,
'/employees':()=> <Employees rows={[]} currentUserId='review' assignableRoles={['EMPLOYEE']} />,
'/reminders':()=> <Reminders reminders={[]} />,
'/timesheets':()=> <Timesheets entries={[]} role='ADMIN' currentUserId='review' />,
'/inspections':()=> <Inspections inspections={[]} jobs={[]} />,
'/certificates':()=> <Certificates certificates={[]} jobs={[]} electricians={[]} />,
'/projects':()=> <Projects photos={[]} jobs={[]} canDelete={true} storageReady={true} canConfigureStorage={true} />,
'/reviews':()=> <Reviews reviews={[]} clients={[]} />,
'/reels':()=> <Reels ideas={[]} />,
'/leads':()=> <Leads leads={[]} clients={[]} />,
'/kpis':()=> <Kpis employees={[]} initialKpis={[]} />,
'/analytics':()=> <Analytics metrics={zero} />,
'/account':()=> <div className='p-8'><ChangePassword /></div>,
'/ai-assistant':()=> <AI />,
'/login':()=> <div className='flex min-h-screen items-center justify-center p-5'><LoginForm callbackUrl='/dashboard' /></div>
};
function App(){const current=usePathname(),role=window.__role||'ADMIN',View=views[current]||views['/dashboard'];
return current==='/login'?<View/>:<div className='flex min-h-screen w-full flex-col md:flex-row'><Sidebar role={role} name='Elecplan preview' /><main className='ep-portal-main flex min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0'><View key={current}/></main><MobileNav role={role} name='Elecplan preview'/></div>}
window.setCarbonReview=(route,role='ADMIN')=>{window.__route=route;window.__role=role;window.dispatchEvent(new PopStateEvent('popstate'))};
window.reviewRoutes=Object.keys(views);
createRoot(document.getElementById('root')).render(<App/>);`;
fs.writeFileSync(path.join(out,'entry.jsx'),entry);
await esbuild.build({entryPoints:[path.join(out,'entry.jsx')],outfile:path.join(out,'bundle.js'),bundle:true,jsx:'automatic',platform:'browser',format:'iife',tsconfig:path.join(cwd,'tsconfig.json'),alias:{'next/link':path.join(out,'next.jsx'),'next/navigation':path.join(out,'next.jsx'),'next-auth/react':path.join(out,'auth.js')},define:{'process.env.NODE_ENV':'"production"'},minify:true});
const css=[];const walk=p=>{for(const f of fs.readdirSync(p,{withFileTypes:true})){const q=path.join(p,f.name);if(f.isDirectory())walk(q);else if(q.endsWith('.css'))css.push(fs.readFileSync(q,'utf8'));}};walk(path.join(cwd,'.next/static'));
fs.writeFileSync(path.join(out,'styles.css'),css.join('\n')+'\n'+fs.readFileSync(path.join(cwd,'src/styles/recessed-carbon.css'),'utf8')+'\n'+fs.readFileSync(path.join(cwd,'src/styles/portal-layout.css'),'utf8'));
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elecplan carbon visual test - synthetic data</title><link rel="stylesheet" href="/styles.css"></head><body class="ep-carbon"><div id="root"></div><script src="/bundle.js"></script></body></html>');
fs.writeFileSync(path.join(out,'README.txt'),'Isolated visual tests using actual React components with synthetic data and mocked navigation/auth. Not a production route. No customer data, API keys or sessions included.');
console.log('CARBON_PREVIEW_BUNDLE_READY');
