"use client";

import { useMemo, useState } from "react";
import { LOGO_MARK, LOGO_WORDMARK } from "@/lib/logo";

type Design = {
  name: string;
  family: string;
  accent: string;
  accent2: string;
  surface: string;
  bg: string;
  layout: "split"|"center"|"offset"|"rail"|"stack"|"frame"|"band"|"corner"|"wide"|"minimal";
  radius: number;
  glow: boolean;
  mark: "top"|"card"|"side"|"ghost"|"none";
};

const families = [
  ["Split Command","split"],["Centered Glass","center"],["Offset Panel","offset"],["Side Rail","rail"],["Stacked Portal","stack"],
  ["Framed Access","frame"],["Sky Band","band"],["Corner Card","corner"],["Wide Console","wide"],["Minimal Secure","minimal"],
] as const;
const accents = [
  ["#43D2FF","#168DFF"],["#58DCFF","#25A7FF"],["#34C8F4","#2F7CFF"],["#6DE3FF","#0EA5E9"],["#20C7F7","#38BDF8"],
];
const surfaces = ["#111820","#0e151d","#131b23","#0b1219","#151c24"];
const backgrounds = [
  "radial-gradient(circle at 18% 14%,rgba(67,210,255,.17),transparent 28%),linear-gradient(145deg,#071018,#0b1620 55%,#070c11)",
  "linear-gradient(125deg,#081019 0%,#102331 48%,#080d13 100%)",
  "radial-gradient(circle at 82% 20%,rgba(67,210,255,.16),transparent 25%),linear-gradient(160deg,#060b10,#101922)",
  "linear-gradient(145deg,#0a1016,#0c1d2a 46%,#080d12)",
  "radial-gradient(circle at 50% 0%,rgba(67,210,255,.13),transparent 34%),linear-gradient(#091018,#060b10)",
];

const designs: Design[] = Array.from({length:50},(_,i)=>{
  const f=families[Math.floor(i/5)];
  const v=i%5;
  return {
    name:`${String(i+1).padStart(2,"0")} · ${f[0]} ${["A","B","C","D","E"][v]}`,
    family:f[0],
    layout:f[1],
    accent:accents[v][0],
    accent2:accents[v][1],
    surface:surfaces[(v+Math.floor(i/5))%surfaces.length],
    bg:backgrounds[(v+Math.floor(i/10))%backgrounds.length],
    radius:[18,24,30,14,34][v],
    glow:v!==3,
    mark:(["top","card","side","ghost","none"] as const)[v],
  };
});

function Brand({small=false}:{small?:boolean}) {
  return <img src={LOGO_WORDMARK} alt="elecplan" style={{width:small?132:190,height:"auto",objectFit:"contain"}}/>;
}
function Mark({size=72}:{size?:number}) {
  return <img src={LOGO_MARK} alt="" style={{width:size,height:size,objectFit:"contain"}}/>;
}
function Form({d,compact=false}:{d:Design;compact?:boolean}) {
  return <div className="form" style={{"--a":d.accent,"--a2":d.accent2} as React.CSSProperties}>
    <div className="eyebrow">TEAM PORTAL // SECURE ACCESS</div>
    <h2>{compact?"Sign in.":"Welcome back."}</h2>
    <p>Use your Elecplan account to enter the portal.</p>
    <label>EMAIL<input placeholder="you@elecplan.com.au"/></label>
    <label>PASSWORD<input type="password" placeholder="••••••••"/></label>
    <button>ENTER PORTAL <span>↗</span></button>
    <div className="reset">▣ &nbsp; Forgot your password? Secure reset</div>
  </div>;
}

function Desktop({d}:{d:Design}) {
  const left=<div className="brandPane">
    <div className="brandTop"><Brand/><span>FIELD OPS</span></div>
    {d.mark==="side"&&<Mark size={92}/>}
    <div className="statement"><b>PLAN.</b><b>INSTALL.</b><b>POWER.</b><em>TOGETHER.</em></div>
    <div className="micro">JOBS &nbsp; | &nbsp; PEOPLE &nbsp; | &nbsp; PROGRESS</div>
  </div>;
  const card=<div className="loginCard" style={{borderRadius:d.radius}}>
    {d.mark==="card"&&<Mark size={78}/>}
    {d.mark==="top"&&<div className="miniBrand"><Mark size={52}/><Brand small/></div>}
    <Form d={d}/>
  </div>;

  return <div className={`desktop layout-${d.layout}`} style={{background:d.bg,"--a":d.accent,"--a2":d.accent2,"--s":d.surface,"--r":`${d.radius}px`,"--glow":d.glow?"0 0 70px rgba(67,210,255,.10)":"none"} as React.CSSProperties}>
    {d.mark==="ghost"&&<div className="ghostMark"><Mark size={260}/></div>}
    <header><Brand/><span>PLAN &nbsp; | &nbsp; INSTALL &nbsp; | &nbsp; POWER</span></header>
    <div className="desktopBody">{left}{card}</div>
    <footer><span>ELECPLAN PTY LTD</span><span>SAME GOAL. &nbsp; BRIGHTER TOMORROW.</span></footer>
  </div>;
}
function Mobile({d}:{d:Design}) {
  return <div className="phone"><div className="phoneScreen" style={{background:d.bg,"--a":d.accent,"--a2":d.accent2,"--s":d.surface} as React.CSSProperties}>
    <div className="status"><b>03:29</b><span>▮▮▮ 5G ▰</span></div>
    <div className="mobileBrand">{d.mark!=="none"&&<Mark size={58}/>}<Brand small/></div>
    <div className="mobileCard" style={{borderRadius:Math.min(d.radius,24)}}><Form d={d} compact/></div>
    <div className="mobileFoot">PLAN &nbsp; | &nbsp; INSTALL &nbsp; | &nbsp; POWER</div>
  </div></div>;
}

export default function LoginDesignsPage(){
  const [index,setIndex]=useState(0);
  const [grid,setGrid]=useState(false);
  const d=designs[index];
  const go=(n:number)=>setIndex((n+designs.length)%designs.length);
  const tiles=useMemo(()=>designs.map((x,i)=><button key={x.name} className={`tile ${i===index?"active":""}`} onClick={()=>{setIndex(i);setGrid(false)}}><span>{String(i+1).padStart(2,"0")}</span><b>{x.family}</b><i style={{background:`linear-gradient(90deg,${x.accent},${x.accent2})`}}/></button>),[index]);
  return <main className="showcase">
    <nav className="controls">
      <div><Brand small/><b>50 SIGN-IN DESIGNS</b></div>
      <div className="navBtns"><button onClick={()=>go(index-1)}>←</button><span>{index+1} / 50</span><button onClick={()=>go(index+1)}>→</button><button className="gridBtn" onClick={()=>setGrid(!grid)}>{grid?"SLIDE":"ALL 50"}</button></div>
    </nav>
    {grid?<section className="grid">{tiles}</section>:<section className="stage">
      <div className="title"><span>DESIGN {String(index+1).padStart(2,"0")}</span><h1>{d.family}</h1><p>Desktop + mobile · Elecplan portal palette · production-ready direction</p></div>
      <div className="previews"><Desktop d={d}/><Mobile d={d}/></div>
      <div className="dots">{designs.map((_,i)=><button key={i} onClick={()=>setIndex(i)} className={i===index?"on":""}/>)}</div>
    </section>}
    <style jsx global>{`
      *{box-sizing:border-box} body{margin:0;background:#05080c;color:#eef7ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      button,input{font:inherit}.showcase{min-height:100vh;background:linear-gradient(180deg,#05080c,#091018);padding:18px}
      .controls{max-width:1500px;margin:0 auto 18px;height:64px;padding:0 18px;border:1px solid #1b3444;background:#0c1218;border-radius:18px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 18px 50px #0008}
      .controls>div{display:flex;align-items:center;gap:16px}.controls b{font-size:12px;letter-spacing:.18em;color:#a9c0cf}.navBtns button{border:1px solid #29485a;background:#111b23;color:#dff7ff;border-radius:10px;height:38px;min-width:42px}.navBtns span{font-size:12px;color:#7e9aaa}.navBtns .gridBtn{padding:0 16px;color:#43d2ff;font-weight:800}
      .stage{max-width:1500px;margin:auto}.title{display:flex;align-items:baseline;gap:14px;padding:6px 4px 14px}.title span{color:#43d2ff;font-size:11px;font-weight:900;letter-spacing:.18em}.title h1{margin:0;font-size:25px}.title p{margin:0 0 0 auto;color:#6f8797;font-size:12px}
      .previews{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px;align-items:center}.desktop{height:720px;border:1px solid color-mix(in srgb,var(--a) 35%,transparent);border-radius:26px;overflow:hidden;position:relative;box-shadow:0 32px 90px #000a,var(--glow);padding:34px}
      .desktop:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(67,210,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(67,210,255,.025) 1px,transparent 1px);background-size:48px 48px;pointer-events:none}
      .desktop header,.desktop footer{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between}.desktop header span,.desktop footer{font-size:9px;letter-spacing:.28em;color:#8398a7}.desktop footer{position:absolute;left:34px;right:34px;bottom:28px}
      .desktopBody{position:relative;z-index:2;height:560px;display:grid;grid-template-columns:1fr 480px;align-items:center;gap:50px}.brandPane{padding:30px}.brandTop{display:flex;justify-content:space-between;align-items:center}.brandTop span{border:1px solid #2a5368;border-radius:99px;padding:7px 12px;color:var(--a);font-size:9px;letter-spacing:.2em}.statement{margin-top:70px;display:flex;flex-direction:column;font-size:47px;line-height:1.05;letter-spacing:-.04em}.statement b{font-weight:300;color:#c9d5dc}.statement em{font-style:normal;font-weight:900;color:#fff}.micro{margin-top:34px;color:#7f98a8;font-size:9px;letter-spacing:.26em}
      .loginCard{background:linear-gradient(145deg,color-mix(in srgb,var(--s) 94%,#1a3545),#0b1117);border:1px solid color-mix(in srgb,var(--a) 30%,transparent);padding:34px;box-shadow:0 28px 80px #0009,inset 0 1px #ffffff08;position:relative}.miniBrand{display:flex;align-items:center;gap:12px;margin-bottom:20px}.ghostMark{position:absolute;right:-60px;bottom:-60px;opacity:.055}
      .form .eyebrow{font-size:9px;font-weight:900;letter-spacing:.2em;color:var(--a)}.form h2{font-size:34px;letter-spacing:-.04em;margin:10px 0 5px}.form p{color:#91a6b4;font-size:13px;margin:0 0 24px}.form label{display:block;color:#8297a6;font-size:9px;font-weight:800;letter-spacing:.12em;margin:12px 0}.form input{display:block;width:100%;height:52px;margin-top:7px;border-radius:12px;border:1px solid color-mix(in srgb,var(--a) 27%,#20303b);background:#0b1219cc;color:white;padding:0 14px;outline:none}.form button{width:100%;height:52px;border:0;border-radius:12px;margin-top:8px;background:linear-gradient(100deg,var(--a),var(--a2));color:#04111a;font-weight:950;letter-spacing:.08em}.form button span{margin-left:10px}.reset{margin-top:18px;border-top:1px solid #29404d;padding-top:16px;text-align:center;color:#7992a2;font-size:10px}
      .layout-center .desktopBody{grid-template-columns:1fr}.layout-center .brandPane{display:none}.layout-center .loginCard{width:500px;justify-self:center}.layout-offset .desktopBody{grid-template-columns:430px 1fr}.layout-offset .loginCard{width:470px;justify-self:start}.layout-offset .brandPane{order:2}.layout-rail .desktopBody{grid-template-columns:300px 1fr}.layout-rail .brandPane{border-right:1px solid #1d4052;height:100%;padding-top:80px}.layout-rail .loginCard{width:500px;justify-self:center}.layout-stack .desktopBody{display:flex;flex-direction:column;justify-content:center;gap:20px}.layout-stack .brandPane{padding:0;text-align:center}.layout-stack .brandTop,.layout-stack .micro{display:none}.layout-stack .statement{margin:0;display:block;font-size:18px;letter-spacing:.18em}.layout-stack .statement b,.layout-stack .statement em{display:inline;margin:0 5px}.layout-stack .loginCard{width:520px}.layout-frame .desktopBody{grid-template-columns:1fr 1fr;border:1px solid #1b4155;border-radius:26px;margin-top:24px;height:520px;padding:24px}.layout-band .desktopBody{grid-template-columns:1fr 520px}.layout-band:after{content:"";position:absolute;left:0;right:0;top:44%;height:150px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--a) 18%,transparent),transparent);z-index:1}.layout-corner .desktopBody{display:block}.layout-corner .brandPane{width:52%;padding-top:80px}.layout-corner .loginCard{position:absolute;right:40px;bottom:70px;width:460px}.layout-wide .desktopBody{grid-template-columns:1fr}.layout-wide .brandPane{position:absolute;left:55px;top:110px;width:310px}.layout-wide .loginCard{width:620px;justify-self:end}.layout-minimal .brandPane{display:none}.layout-minimal .desktopBody{grid-template-columns:1fr}.layout-minimal .loginCard{width:440px;justify-self:center;background:transparent;border-color:#244657;box-shadow:none}
      .phone{width:315px;height:650px;border-radius:48px;background:#020304;border:7px solid #343d44;padding:5px;box-shadow:0 30px 80px #000c;justify-self:center}.phoneScreen{height:100%;border-radius:38px;overflow:hidden;position:relative;padding:18px}.status{display:flex;justify-content:space-between;font-size:11px}.mobileBrand{height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}.mobileCard{background:#0b1219b8;border:1px solid color-mix(in srgb,var(--a) 25%,transparent);padding:20px}.mobileCard .eyebrow{font-size:7px}.mobileCard h2{font-size:26px}.mobileCard p{font-size:11px;margin-bottom:18px}.mobileCard label{font-size:8px}.mobileCard input{height:44px}.mobileCard button{height:46px}.mobileCard .reset{font-size:8px}.mobileFoot{position:absolute;bottom:20px;left:0;right:0;text-align:center;font-size:7px;letter-spacing:.22em;color:#718895}
      .dots{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin:18px auto;max-width:650px}.dots button{width:8px;height:8px;border-radius:50%;padding:0;border:0;background:#263844}.dots .on{background:#43d2ff;box-shadow:0 0 12px #43d2ff}
      .grid{max-width:1500px;margin:auto;display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.tile{height:110px;border:1px solid #1c3544;background:#0d141b;border-radius:16px;color:white;text-align:left;padding:16px;position:relative;overflow:hidden}.tile span{display:block;color:#43d2ff;font-size:10px;letter-spacing:.2em}.tile b{display:block;margin-top:8px;font-size:14px}.tile i{position:absolute;left:0;right:0;bottom:0;height:4px}.tile.active{border-color:#43d2ff;box-shadow:0 0 30px #43d2ff18}
      @media(max-width:900px){.showcase{padding:10px}.controls{height:auto;min-height:64px;gap:10px;padding:10px}.controls>div:first-child b{display:none}.navBtns{gap:6px!important}.navBtns span{display:none}.previews{grid-template-columns:1fr}.desktop{display:none}.title{display:block;padding:8px}.title h1{margin-top:5px}.title p{margin:5px 0 0}.phone{width:min(92vw,360px);height:690px}.grid{grid-template-columns:repeat(2,1fr)}}
    `}</style>
  </main>;
}
