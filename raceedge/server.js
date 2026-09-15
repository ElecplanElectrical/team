import express from 'express';
import pg from 'pg';
const { Pool } = pg;
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized:false } : false }) : null;

const demo = {
  updatedAt: new Date().toISOString(),
  meetings: [
    {id:'FLEM',code:'R',name:'Flemington',state:'VIC',condition:'Good 4',races:9,nextRace:5,nextTime:'14:45',status:'Open'},
    {id:'RAND',code:'R',name:'Randwick',state:'NSW',condition:'Soft 5',races:10,nextRace:4,nextTime:'14:55',status:'Open'},
    {id:'SAND',code:'G',name:'Sandown Park',state:'VIC',condition:'Fast',races:12,nextRace:6,nextTime:'15:02',status:'Open'},
    {id:'ALBP',code:'G',name:'Albion Park',state:'QLD',condition:'Good',races:12,nextRace:3,nextTime:'15:08',status:'Open'}
  ],
  tips: [
    {rank:1,runner:'Northern Edge',meeting:'Flemington',race:5,number:4,score:91,price:3.4,label:'TOP PICK',reason:'Strong recent figures, maps well and profiles positively at the trip.'},
    {rank:2,runner:'Fast Remedy',meeting:'Sandown Park',race:6,number:2,score:87,price:4.2,label:'GREYHOUND PICK',reason:'Early speed and box profile rate strongly against this field.'},
    {rank:3,runner:'Ocean State',meeting:'Randwick',race:4,number:7,score:84,price:6.5,label:'VALUE',reason:'Price is longer than the RaceEdge assessment after conditions adjustment.'}
  ]
};

async function initDb(){
 if(!pool) return;
 await pool.query(`CREATE TABLE IF NOT EXISTS raceedge_tip_results (id BIGSERIAL PRIMARY KEY, meeting TEXT NOT NULL, race_no INT NOT NULL, runner TEXT NOT NULL, score NUMERIC, price NUMERIC, result_position INT, created_at TIMESTAMPTZ DEFAULT NOW())`);
}

function scoreRunner(r={}){
 const weights={form:.25,speed:.20,classRating:.15,pace:.15,conditions:.15,barrier:.10};
 const val=(k,d=50)=>Number.isFinite(Number(r[k]))?Number(r[k]):d;
 return Math.round(Object.entries(weights).reduce((s,[k,w])=>s+val(k)*w,0));
}

app.get('/health', async (_req,res)=>{
 let database='not-configured';
 if(pool){ try{await pool.query('SELECT 1');database='ok';}catch{database='error';} }
 res.json({ok:true,service:'raceedge',database,time:new Date().toISOString()});
});
app.get('/api/v1/home', (_req,res)=>res.json(demo));
app.post('/api/v1/rating', (req,res)=>res.json({score:scoreRunner(req.body),weights:{form:.25,speed:.20,class:.15,pace:.15,conditions:.15,barrier:.10}}));
app.get('/api/v1/provider/next-to-go', async (_req,res)=>{
 const key=process.env.PUNTERSEDGE_API_KEY;
 if(!key) return res.status(503).json({connected:false,message:'Live racing provider key not configured yet.',demo});
 try{
  const base=process.env.PUNTERSEDGE_BASE_URL || 'https://api.puntersedge.online';
  const response=await fetch(`${base}/v1/racing/next-to-go`,{headers:{Authorization:`Bearer ${key}`,'x-api-key':key,Accept:'application/json'}});
  const text=await response.text();
  res.status(response.status).type(response.headers.get('content-type')||'application/json').send(text);
 }catch(e){res.status(502).json({connected:false,error:'Provider request failed'});}
});
app.get('/api/v1/results',async(_req,res)=>{
 if(!pool)return res.json([]);
 const {rows}=await pool.query('SELECT * FROM raceedge_tip_results ORDER BY created_at DESC LIMIT 100');res.json(rows);
});
app.post('/api/v1/results',async(req,res)=>{
 if(!pool)return res.status(503).json({error:'Database not configured'});
 const {meeting,raceNo,runner,score,price,resultPosition}=req.body;
 const {rows}=await pool.query('INSERT INTO raceedge_tip_results(meeting,race_no,runner,score,price,result_position) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[meeting,raceNo,runner,score,price,resultPosition]);res.status(201).json(rows[0]);
});
app.use(express.static('public'));
initDb().then(()=>app.listen(port,'0.0.0.0',()=>console.log(`RaceEdge listening on ${port}`))).catch(e=>{console.error(e);process.exit(1)});
