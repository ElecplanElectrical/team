import express from 'express';
import pg from 'pg';
import { prototypeWeights, scoreRunner, rateField, buildSelectionSummary } from './lib/ratingEngine.js';
import { providerConfigured, getNextToGo, getNormalizedNextToGo } from './lib/provider.js';

const { Pool } = pg;
const app = express();
app.use(express.json({ limit: '256kb' }));

const port = process.env.PORT || 3000;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

const demoMeetings = [
  {id:'FLEM',code:'R',name:'Flemington',state:'VIC',condition:'Good 4',races:9,nextRace:5,nextTime:'14:45',status:'Open'},
  {id:'RAND',code:'R',name:'Randwick',state:'NSW',condition:'Soft 5',races:10,nextRace:4,nextTime:'14:55',status:'Open'},
  {id:'SAND',code:'G',name:'Sandown Park',state:'VIC',condition:'Fast',races:12,nextRace:6,nextTime:'15:02',status:'Open'},
  {id:'ALBP',code:'G',name:'Albion Park',state:'QLD',condition:'Good',races:12,nextRace:3,nextTime:'15:08',status:'Open'}
];
const demoTips = [
  {rank:1,runner:'Northern Edge',meeting:'Flemington',race:5,number:4,score:91,price:3.4,label:'TOP PICK',reason:'Strong recent figures, maps well and profiles positively at the trip.'},
  {rank:2,runner:'Fast Remedy',meeting:'Sandown Park',race:6,number:2,score:87,price:4.2,label:'GREYHOUND PICK',reason:'Early speed and box profile rate strongly against this field.'},
  {rank:3,runner:'Ocean State',meeting:'Randwick',race:4,number:7,score:84,price:6.5,label:'VALUE',reason:'Price is longer than the RaceEdge assessment after conditions adjustment.'}
];
const demoField = [
  {number:4,name:'Northern Edge',barrier:3,price:3.4,scratched:false,form:94,speed:91,classRating:88,pace:92,conditions:90,barrier:90},
  {number:7,name:'Ocean State',barrier:6,price:6.5,scratched:false,form:86,speed:84,classRating:87,pace:82,conditions:88},
  {number:2,name:'Capital Run',barrier:1,price:4.8,scratched:false,form:83,speed:87,classRating:82,pace:84,conditions:80},
  {number:9,name:'Trackside',barrier:8,price:9.0,scratched:true,form:89,speed:86,classRating:81,pace:79,conditions:85}
];
const homePayload = () => ({updatedAt:new Date().toISOString(),source:'demo',meetings:demoMeetings,tips:demoTips,disclaimer:'RaceEdge ratings are analytical estimates, not guaranteed outcomes.'});

async function initDb(){
 if(!pool) return;
 await pool.query(`CREATE TABLE IF NOT EXISTS raceedge_tip_results (id BIGSERIAL PRIMARY KEY, meeting TEXT NOT NULL, race_no INT NOT NULL, runner TEXT NOT NULL, score NUMERIC, price NUMERIC, result_position INT, created_at TIMESTAMPTZ DEFAULT NOW())`);
 await pool.query(`CREATE TABLE IF NOT EXISTS raceedge_published_tips (id BIGSERIAL PRIMARY KEY, meeting TEXT NOT NULL, race_no INT NOT NULL, runner TEXT NOT NULL, runner_no INT, rating NUMERIC, price NUMERIC, label TEXT, published BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`);
}

app.get('/health',async(_req,res)=>{let database='not-configured';if(pool){try{await pool.query('SELECT 1');database='ok';}catch{database='error';}}res.json({ok:true,service:'raceedge',version:'0.3.0',database,providerConfigured:providerConfigured(),time:new Date().toISOString()});});
app.get('/api/v1/home',(_req,res)=>res.json(homePayload()));
app.get('/api/v1/meetings',(_req,res)=>res.json({updatedAt:new Date().toISOString(),meetings:demoMeetings}));
app.get('/api/v1/tips',(_req,res)=>res.json({updatedAt:new Date().toISOString(),tips:demoTips,prototype:true,backtested:false}));
app.get('/api/v1/races/:meetingId/:raceNo',(req,res)=>{const meeting=demoMeetings.find(m=>m.id===req.params.meetingId.toUpperCase());if(!meeting)return res.status(404).json({error:'Meeting not found'});const rated=rateField(demoField);res.json({meeting,raceNo:Number(req.params.raceNo),...rated,analysis:buildSelectionSummary(rated.runners)});});
app.post('/api/v1/rating',(req,res)=>res.json({...scoreRunner(req.body),label:'prototype-rating'}));
app.post('/api/v1/rating/field',(req,res)=>{const runners=Array.isArray(req.body?.runners)?req.body.runners:[];if(!runners.length)return res.status(400).json({error:'runners array is required'});const rated=rateField(runners);res.json({...rated,analysis:buildSelectionSummary(rated.runners)});});
app.get('/api/v1/rating/config',(_req,res)=>res.json({weights:prototypeWeights,prototype:true,backtested:false}));
app.get('/api/v1/provider/status',(_req,res)=>res.json({provider:'PuntersEdge',configured:providerConfigured(),keyExposed:false}));
app.get('/api/v1/provider/next-to-go',async(_req,res)=>{try{res.json(await getNextToGo());}catch(error){if(error.code==='PROVIDER_NOT_CONFIGURED')return res.status(503).json({connected:false,message:error.message,demo:homePayload()});console.error('Provider request failed',error.message);res.status(502).json({connected:false,error:'Provider request failed'});}});
app.get('/api/v1/provider/normalized/next-to-go',async(_req,res)=>{try{res.json({provider:'PuntersEdge',normalized:true,data:await getNormalizedNextToGo()});}catch(error){if(error.code==='PROVIDER_NOT_CONFIGURED')return res.status(503).json({connected:false,message:error.message});console.error('Provider normalization failed',error.message);res.status(502).json({connected:false,error:'Provider request failed'});}});
app.get('/api/v1/results',async(_req,res)=>{if(!pool)return res.json([]);const {rows}=await pool.query('SELECT * FROM raceedge_tip_results ORDER BY created_at DESC LIMIT 100');res.json(rows);});
app.post('/api/v1/results',async(req,res)=>{if(!pool)return res.status(503).json({error:'Database not configured'});const {meeting,raceNo,runner,score,price,resultPosition}=req.body;if(!meeting||!Number.isInteger(Number(raceNo))||!runner)return res.status(400).json({error:'meeting, raceNo and runner are required'});const {rows}=await pool.query('INSERT INTO raceedge_tip_results(meeting,race_no,runner,score,price,result_position) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[meeting,Number(raceNo),runner,score??null,price??null,resultPosition??null]);res.status(201).json(rows[0]);});
app.get('/api/v1/performance',async(_req,res)=>{if(!pool)return res.json({tips:0,wins:0,strikeRate:null,roi:null});const {rows}=await pool.query(`SELECT COUNT(*)::int tips, COUNT(*) FILTER (WHERE result_position=1)::int wins FROM raceedge_tip_results`);const r=rows[0];res.json({tips:r.tips,wins:r.wins,strikeRate:r.tips?Number(((r.wins/r.tips)*100).toFixed(1)):null,roi:null,note:'ROI requires settled price/stake history.'});});
app.get('/api/v1/admin/tips',async(_req,res)=>{if(!pool)return res.json([]);const {rows}=await pool.query('SELECT * FROM raceedge_published_tips ORDER BY created_at DESC LIMIT 200');res.json(rows);});
app.post('/api/v1/admin/tips',async(req,res)=>{if(!pool)return res.status(503).json({error:'Database not configured'});const {meeting,raceNo,runner,runnerNo,rating,price,label,published=false}=req.body;if(!meeting||!raceNo||!runner)return res.status(400).json({error:'meeting, raceNo and runner are required'});const {rows}=await pool.query('INSERT INTO raceedge_published_tips(meeting,race_no,runner,runner_no,rating,price,label,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[meeting,Number(raceNo),runner,runnerNo??null,rating??null,price??null,label??null,Boolean(published)]);res.status(201).json(rows[0]);});
app.patch('/api/v1/admin/tips/:id/publish',async(req,res)=>{if(!pool)return res.status(503).json({error:'Database not configured'});const {rows}=await pool.query('UPDATE raceedge_published_tips SET published=$1 WHERE id=$2 RETURNING *',[Boolean(req.body?.published),req.params.id]);if(!rows[0])return res.status(404).json({error:'Tip not found'});res.json(rows[0]);});
app.use(express.static('public'));
initDb().then(()=>app.listen(port,'0.0.0.0',()=>console.log(`RaceEdge listening on ${port}`))).catch(error=>{console.error(error);process.exit(1);});
