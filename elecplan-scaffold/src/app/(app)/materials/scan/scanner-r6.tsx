"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ArrowLeft,Barcode,Check,Pencil} from "lucide-react";

declare global{interface Window{Quagga?:any}}

const BUILD="scanner-r10-2026-08-27";
const Q="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js";

function script(){return new Promise<void>((ok,no)=>{const e=document.getElementById("quagga-r10")as HTMLScriptElement|null;if(e){if(e.dataset.loaded==="1")ok();else e.addEventListener("load",()=>ok(),{once:true});return}const s=document.createElement("script");s.id="quagga-r10";s.src=Q;s.async=true;s.onload=()=>{s.dataset.loaded="1";ok()};s.onerror=no;document.head.appendChild(s)})}

export default function ScannerR10(){
  const cam=useRef<HTMLDivElement>(null);
  const busy=useRef(false);
  const reviewing=useRef(false);
  const armedAt=useRef(0);
  const mounted=useRef(true);

  const[status,setStatus]=useState("Starting camera…");
  const[photo,setPhoto]=useState("");
  const[code,setCode]=useState("");
  const[review,setReview]=useState(false);
  const[known,setKnown]=useState(false);
  const[itemName,setItemName]=useState("");
  const[originalName,setOriginalName]=useState("");
  const[editing,setEditing]=useState(false);
  const[manual,setManual]=useState("");

  function snap(){
    const v=cam.current?.querySelector("video")as HTMLVideoElement|null;
    if(!v?.videoWidth)return null;
    const c=document.createElement("canvas");
    c.width=Math.min(v.videoWidth,1200);
    c.height=Math.round(v.videoHeight*c.width/v.videoWidth);
    c.getContext("2d")?.drawImage(v,0,0,c.width,c.height);
    return c;
  }

  async function capture(barcode:string){
    if(busy.current||reviewing.current||Date.now()<armedAt.current)return;
    const c=snap();
    if(!c)return;
    busy.current=true;
    reviewing.current=true;
    const data=c.toDataURL("image/jpeg",.78);
    setCode(barcode);
    setPhoto(data);
    setReview(true);
    setStatus("PHOTO CAPTURED — nothing saved yet");
    try{
      const r=await fetch(`/api/materials/scan?barcode=${encodeURIComponent(barcode)}`,{cache:"no-store"});
      const b=await r.json();
      const n=b.item?.name||"";
      setKnown(Boolean(b.known));
      setItemName(n);
      setOriginalName(n);
      setEditing(!b.known);
      setStatus(b.known?`KNOWN ITEM — ${n||barcode}`:"NEW BARCODE — type the exact item name from label");
    }catch{
      setKnown(false);
      setEditing(true);
      setStatus("Could not check barcode — type item name");
    }
    busy.current=false;
  }

  function resumeScanning(message="READY — barcode + full label in frame"){
    busy.current=false;
    reviewing.current=false;
    armedAt.current=Date.now()+1000;
    setPhoto("");
    setCode("");
    setReview(false);
    setKnown(false);
    setItemName("");
    setOriginalName("");
    setEditing(false);
    setStatus(message);
  }

  async function queue(){
    const name=itemName.trim();
    if(!name){setStatus("Type the item name from the label first");setEditing(true);return}
    if(busy.current)return;
    busy.current=true;
    try{
      if(known&&name!==originalName){
        setStatus("UPDATING ITEM NAME…");
        const u=await fetch("/api/materials/scan",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({barcode:code,name})});
        const ub=await u.json().catch(()=>({}));
        if(!u.ok)throw new Error(ub.error||"Could not update item name");
      }

      setStatus("QUEUING PHOTO — server will read THIS box quantity");
      const r=await fetch("/api/materials/scan-queue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({barcode:code,dataUrl:photo,itemName:name})});
      const b=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(b.error||"Queue failed");
      setStatus("QUEUED ✓ — ready for next box");
      window.setTimeout(()=>resumeScanning(),350);
    }catch(e){
      setStatus(`NOT QUEUED — ${e instanceof Error?e.message:"try again"}`);
      busy.current=false;
    }
  }

  async function start(){
    try{
      await script();
      if(!cam.current||!mounted.current)return;
      try{window.Quagga?.offDetected();window.Quagga?.stop()}catch{}
      cam.current.innerHTML="";
      window.Quagga.init({
        inputStream:{type:"LiveStream",target:cam.current,constraints:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}},area:{top:"8%",right:"3%",left:"3%",bottom:"8%"}},
        locator:{patchSize:"medium",halfSample:true},numOfWorkers:0,frequency:18,
        decoder:{readers:["code_128_reader","ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_39_reader","code_93_reader","i2of5_reader"]},locate:true
      },(e:any)=>{
        if(e){setStatus("Camera failed — reopen scanner");return}
        window.Quagga.start();
        armedAt.current=Date.now()+700;
        setStatus("READY — barcode + full label in frame");
      });
      window.Quagga.onDetected((d:any)=>{
        const c=String(d?.codeResult?.code||"").trim();
        if(!c||busy.current||reviewing.current||Date.now()<armedAt.current)return;
        void capture(c);
      });
    }catch{setStatus("Camera failed — reopen scanner")}
  }

  useEffect(()=>{
    mounted.current=true;
    void start();
    return()=>{mounted.current=false;try{window.Quagga?.offDetected();window.Quagga?.stop()}catch{}};
  },[]);

  return <div className="min-h-screen bg-[#03101f] p-4 text-white"><div className="mx-auto max-w-xl space-y-4">
    <div className="flex items-center justify-between"><Link href="/materials" className="flex items-center gap-2 text-sm text-[#93a9c2]"><ArrowLeft size={16}/> Materials</Link><span className="text-[11px] text-[#5f7894]">{BUILD}</span></div>
    <h1 className="text-3xl font-semibold">Scan Stock</h1>
    <div className="overflow-hidden rounded-2xl border border-[#168dff55] bg-[#07192b]"><div className="relative aspect-[4/3] overflow-hidden bg-black">
      <div ref={cam} className="absolute inset-0 [&_canvas]:hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover"/>
      {review&&photo&&<img src={photo} alt="captured label" className="absolute inset-0 z-10 h-full w-full object-fill"/>}
      {!review&&<div className="pointer-events-none absolute inset-[8%_3%] z-20 rounded-xl border-4 border-[#25c7ff]"/>}
    </div><div className="p-4 text-center font-semibold text-[#18d3a0]">{status}</div></div>

    {review&&<div className="rounded-2xl border border-[#18d3a055] bg-[#07192b] p-4"><div className="flex items-center justify-between"><div className="text-xl font-semibold">{known?"Item recognised":"Teach this barcode"}</div>{known&&!editing&&<button type="button" onClick={()=>setEditing(true)} className="flex items-center gap-2 rounded-lg border border-[#168dff55] px-3 py-2 text-sm"><Pencil size={15}/>Edit Item</button>}</div><div className="mt-1 text-sm text-[#93a9c2]">Barcode {code}. Quantity is read separately from THIS box photo.</div>{editing||!known?<><div className="mt-4 text-sm text-[#93a9c2]">Item name — type exactly what you want saved</div><input autoFocus value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="e.g. HYMF5 Mounting Flange 18mm Shallow" className="mt-2 w-full rounded-xl border border-[#18d3a077] bg-[#041323] px-3 py-4 text-lg text-white outline-none focus:border-[#18d3a0]"/></>:<div className="mt-4 rounded-xl border border-[#18d3a055] bg-[#0b302c] p-4"><Check className="mr-2 inline"/> {itemName}</div>}<button type="button" onClick={()=>void queue()} className="mt-4 w-full rounded-xl bg-[#18d3a0] py-4 text-lg font-bold text-[#03101f]"><Check className="mr-2 inline"/>Confirm Item & Scan Next</button><button type="button" onClick={()=>resumeScanning()} className="mt-2 w-full rounded-xl border border-[#168dff44] py-3">Cancel / Scan Next</button></div>}

    {!review&&<div className="rounded-2xl border border-[#168dff33] bg-[#07192b] p-4"><div className="mb-2 flex items-center gap-2 font-semibold"><Barcode size={17}/> Enter barcode</div><form onSubmit={e=>{e.preventDefault();const c=manual.trim();if(c){void capture(c);setManual("")}}} className="flex gap-2"><input value={manual} onChange={e=>setManual(e.target.value)} placeholder="Barcode number" className="min-w-0 flex-1 rounded-xl border border-[#168dff44] bg-[#041323] px-3 py-3"/><button className="rounded-xl bg-[#168dff] px-4 font-semibold">Add</button></form></div>}
  </div></div>
}
