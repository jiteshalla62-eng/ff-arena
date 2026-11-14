'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
type Tournament = {id:string; title:string; mode:string; map_name:string; entry_fee:number; prize_pool:number; starts_at:string; slots_total:number; slots_filled:number; description:string|null};
type Registration = {id:string; status:string; tournament_id:string; tournaments?:{title:string}|null};
export default function Home() {
  const router = useRouter();
 const [user,setUser]=useState<any>(null), [tournaments,setTournaments]=useState<Tournament[]>([]), [mine,setMine]=useState<Registration[]>([]), [email,setEmail]=useState(''), [password,setPassword]=useState(''), [name,setName]=useState(''), [uid,setUid]=useState(''), [selected,setSelected]=useState(''), [team,setTeam]=useState(''), [mode,setMode]=useState('Squad'), [loading,setLoading]=useState(false), [notice,setNotice]=useState('');
 const db=supabase;
 async function refresh(){const s=db(); const {data:{user:u}}=await s.auth.getUser(); setUser(u); const {data}=await s.from('tournaments').select('*').eq('is_published',true).order('starts_at'); setTournaments((data||[]) as Tournament[]); if(u){const {data:r}=await s.from('registrations').select('id,status,tournament_id,tournaments(title)').eq('player_id',u.id).order('created_at',{ascending:false}); setMine((r||[]) as any);}}
 useEffect(()=>{refresh().catch(e=>setNotice(e.message)); const s=db(); const {data:{subscription}}=s.auth.onAuthStateChange(()=>refresh()); return ()=>subscription.unsubscribe();},[]);
 async function auth(kind:'signup'|'signin'){setLoading(true);setNotice(''); try{const s=db(); const res=kind==='signup'?await s.auth.signUp({email,password,options:{data:{display_name:name}}}):await s.auth.signInWithPassword({email,password}); if(res.error)throw res.error; if(kind==='signup'&&!res.data.session)setNotice('Check your email to confirm your account, then log in.'); else setNotice('You are signed in.'); router.push('/payment-info');}catch(e:any){setNotice(e.message||'Could not authenticate.');}finally{setLoading(false);}}
 async function googleSignIn() {
  setLoading(true);
  setNotice('');

  const { error } = await db().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    setNotice(error.message);
    setLoading(false);
  }
}
 async function register(){if(!user){setNotice('Create an account or log in first.');return;} if(!selected||!name.trim()||!uid.trim()){setNotice('Enter your player name, UID and tournament.');return;} setLoading(true);setNotice('');try{const s=db();const {error}=await s.from('registrations').insert({player_id:user.id,tournament_id:selected,player_name:name.trim(),game_uid:uid.trim(),team_name:team.trim()||null,mode});if(error)throw error;setNotice('Registration submitted successfully.');await refresh();}catch(e:any){
  if(e?.code === '23505'){
    setNotice('You have already registered for this tournament.');
  } else {
    setNotice(e?.message || 'Registration failed.');
  }
}finally{setLoading(false);}}
 return <main><nav className="nav"><a className="brand" href="#top"><span className="flame">◆</span> FF <b>ARENA</b></a><div className="navlinks"><a href="#matches">Tournaments</a><a href="#register">Register</a><a href="#account">My account</a></div><span className="live">● REGISTRATION LIVE</span></nav>
 <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow">FREE FIRE • COMPETITIVE SERIES</p><h1>DROP IN.<br/><em>FIGHT HARD.</em><br/>CLAIM GLORY.</h1><p className="sub">Find your squad. Enter the arena. Make every match count.</p><a className="cta" href="#matches">EXPLORE TOURNAMENTS <span>↗</span></a><div className="hero-stats"><div><b>FAIR PLAY</b><small>Verified entries</small></div><div><b>SECURE ROOMS</b><small>Approved players only</small></div><div><b>LIVE RESULTS</b><small>Match updates</small></div></div></div><div className="hero-art"><div className="ring r1"/><div className="ring r2"/><div className="art-label">THE BATTLE<br/><strong>STARTS HERE</strong></div><div className="art-bottom">FF ARENA <span>/// 01</span></div></div></section>
 <section className="section" id="matches"><div className="section-head"><div><p className="eyebrow">CHOOSE YOUR BATTLE</p><h2>UPCOMING <em>TOURNAMENTS</em></h2></div><span className="muted">OPEN FOR REGISTRATION</span></div><div className="cards">{tournaments.length?tournaments.map(t=><article className="match" key={t.id}><div className="match-top"><span className="tag">{t.mode}</span><span className="open">● OPEN</span></div><h3>{t.title}</h3><p className="muted">{t.map_name} · {new Date(t.starts_at).toLocaleString()}</p>{t.description&&<p>{t.description}</p>}<div className="match-numbers"><div><small>ENTRY</small><b>₹{t.entry_fee}</b></div><div><small>PRIZE POOL</small><b className="orange">₹{t.prize_pool}</b></div><div><small>SLOTS</small><b>{t.slots_filled}/{t.slots_total}</b></div></div><button className="outline" onClick={()=>{setSelected(t.id);document.getElementById('register')?.scrollIntoView({behavior:'smooth'});}}>REGISTER FOR MATCH ↗</button></article>):<div className="empty">No tournaments published yet. The host can add tournaments from the Supabase dashboard; they will appear here.</div>}</div></section>
 <section className="section register-section" id="register"><div className="section-head"><div><p className="eyebrow">SECURE YOUR SLOT</p><h2>PLAYER <em>REGISTRATION</em></h2></div></div><div className="form-grid"><div className="panel"><h3>PLAYER DETAILS</h3><label>In-game / player name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your player name"/></label><label>Free Fire UID<input value={uid} onChange={e=>setUid(e.target.value)} placeholder="Your game UID"/></label><label>Team name (optional)<input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Your squad name"/></label><label>Tournament<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select a tournament</option>{tournaments.map(t=><option key={t.id} value={t.id}>{t.title} — ₹{t.entry_fee}</option>)}</select></label><label>Mode<select value={mode} onChange={e=>setMode(e.target.value)}><option>Solo</option><option>Duo</option><option>Squad</option></select></label><button className="cta full" disabled={loading||!user} onClick={register}>{user?'SUBMIT REGISTRATION':'LOG IN TO REGISTER'} ↗</button>
<p className="hint">
  Registration requests are subject to host approval.
</p>
</div>

  
 <div className="panel account" id="account"><h3>PLAYER ACCOUNT</h3>{user?<><p className="muted">Signed in as</p><b>{user.email}</b><button className="outline full" onClick={async()=>{await db().auth.signOut();router.push('/payment-info');}}>SIGN OUT</button><h3 className="spaced">MY REGISTRATIONS</h3>{mine.length?mine.map(r=><div className="reg-row" key={r.id}><span>{(r as any).tournaments?.title||'Tournament'}</span><b className={'status '+r.status}>{r.status.replace('_',' ')}</b></div>):<p className="muted">Your registrations will appear here.</p>}</>:<><p className="muted">Create an account or sign in to register and view your room details when approved.</p><label>Display name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label><div className="button-row">
  <button className="cta" disabled={loading||!email||password.length<8} onClick={()=>auth('signup')}>CREATE ACCOUNT</button>
  <button className="outline" disabled={loading||!email||password.length<8} onClick={()=>auth('signin')}>LOG IN</button>
</div>

<button
  className="outline full"
  disabled={loading}
  onClick={googleSignIn}
>
  CONTINUE WITH GOOGLE
</button></>}</div></div>{notice&&<div className="notice">{notice}</div>}</section>
 <footer><a className="brand" href="#top">◆ FF <b>ARENA</b></a><span>Community tournament platform · Play fair. Respect every player.</span><span>Not affiliated with Garena.</span></footer></main>
}
