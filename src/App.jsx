import React, { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Users, AlertTriangle, CheckCircle2, Clock, Route, Download, Lock, RefreshCw, X } from "lucide-react";
import { supabase } from "./supabase.js";
import { RAW, ZONAS, ORDEN_ZONAS, MATRIZ, M } from "./data.js";

/* Parámetros */
const DUR = 90, VENT_INI = "06:00", VENT_FIN = "21:00", PASO = 30;

const toMin = t => { const [h,m] = String(t).split(":").map(Number); return h*60+m; };
const toHHMM = m => String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const viaje = (a,b) => a===b ? 0 : ((MATRIZ[a] && MATRIZ[a][b]!=null) ? MATRIZ[a][b] : 30);
const hoyISO = () => new Date().toISOString().slice(0,10);

/* Motor de factibilidad */
function sesionesDia(ses, fecha) {
  return ses.filter(s => s.fecha === fecha)
    .map(s => ({ muni:s.muni, ei:toMin(s.ini), ef:toMin(s.ini)+DUR }))
    .sort((a,b) => a.ei-b.ei);
}
function factible(ses, muni, fecha, start) {
  const end = start + DUR;
  if (start < toMin(VENT_INI) || end > toMin(VENT_FIN)) return false;
  const all = [...sesionesDia(ses, fecha), { muni, ei:start, ef:end }].sort((a,b) => a.ei-b.ei);
  for (let i=1; i<all.length; i++) {
    if (all[i].ei < all[i-1].ef) return false;
    if (all[i].ei - all[i-1].ef < viaje(all[i-1].muni, all[i].muni)) return false;
  }
  return true;
}
function slots(ses, muni, fecha) {
  const out = [];
  for (let t = toMin(VENT_INI); t <= toMin(VENT_FIN)-DUR; t += PASO)
    if (factible(ses, muni, fecha, t)) out.push(toHHMM(t));
  return out;
}
function rutaDia(ses, fecha) {
  const l = sesionesDia(ses, fecha);
  if (!l.length) return { ruta:"—", viaje:0, carga:0, n:0 };
  let tv = 0;
  for (let i=1; i<l.length; i++) tv += viaje(l[i-1].muni, l[i].muni);
  const ocupado = l.length*DUR + tv;
  const ventana = toMin(VENT_FIN) - toMin(VENT_INI);
  return { ruta: l.map(x => `${M[x.muni].muni} ${toHHMM(x.ei)}`).join("  →  "), viaje: tv, carga: Math.round(ocupado/ventana*100), n: l.length };
}

/* UI tokens */
const C = { bg:"#0f141a", card:"#1e2732", panel:"#161d26", line:"#2b3644", ink:"#e8edf3",
  muted:"#93a1b2", accent:"#ffc21f", ok:"#3ecf8e", bad:"#ef5350", warn:"#ff9f43", blue:"#4aa3ff" };
const mono = "ui-monospace, Consolas, monospace";
const Chip = ({ sel, onClick, children, sub }) => (
  <button onClick={onClick} style={{ fontFamily:mono, fontSize:13, padding:"8px 11px", borderRadius:8, cursor:"pointer", border:`1px solid ${sel?C.accent:C.line}`, background:sel?C.accent:C.panel, color:sel?"#141414":C.ink, lineHeight:1.3, textAlign:"left" }}>{children}{sub && <div style={{ fontSize:10.5, color:sel?"#4a3c00":C.muted }}>{sub}</div>}</button>
);
const Msg = ({ tipo, children }) => {
  const m = { ok:["#12251b","#1f5a3d",C.ok], bad:["#2a1616","#5a2020","#ff9a97"], info:["#101d2b","#24405c",C.blue] }[tipo];
  return <div style={{ padding:"10px 12px", borderRadius:8, fontSize:13, marginTop:10, background:m[0], border:`1px solid ${m[1]}`, color:m[2] }}>{children}</div>;
};
const Card = ({ title, icon, children, style }) => (
  <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:12, padding:16, ...style }}>
    {title && <h2 style={{ margin:"0 0 12px", fontSize:12, textTransform:"uppercase", letterSpacing:1, color:C.accent, display:"flex", alignItems:"center", gap:7 }}>{icon}{title}</h2>}
    {children}
  </div>
);
const Tag = ({ c, children }) => (<span style={{ display:"inline-block", fontFamily:mono, fontSize:10.5, padding:"2px 7px", borderRadius:20, border:`1px solid ${c}55`, color:c, margin:"2px 3px 0 0", whiteSpace:"nowrap" }}>{children}</span>);
const btn = { display:"inline-flex", alignItems:"center", gap:6, cursor:"pointer", borderRadius:7, fontWeight:600, fontSize:12.5, padding:"7px 12px", background:C.panel, color:C.ink, border:`1px solid ${C.line}` };
const lbl = { display:"block", fontSize:12, color:C.muted, marginBottom:5, textTransform:"uppercase" };
const inp = { background:C.panel, border:`1px solid ${C.line}`, color:C.ink, padding:"9px 10px", borderRadius:8, fontSize:14 };
const th = { textAlign:"left", padding:"7px 9px", borderBottom:`1px solid ${C.line}`, color:C.muted, fontSize:10.5, textTransform:"uppercase", letterSpacing:.5 };
const td = { padding:"7px 9px", borderBottom:`1px solid ${C.line}`, verticalAlign:"top" };

export default function App() {
  const [jornadas, setJornadas] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [pinDB, setPinDB] = useState("GDO2026");
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState("reservar");
  const [msg, setMsg] = useState(null);
  const [muni, setMuni] = useState("");
  const [fecha, setFecha] = useState("");
  const [ini, setIni] = useState("");
  const [pin, setPin] = useState("");
  const [auth, setAuth] = useState(false);
  const [fInicio, setFInicio] = useState(hoyISO());
  const [cupo, setCupo] = useState(4);

  const cargar = async () => {
    try {
      const [j, s, c] = await Promise.all([
        supabase.from("jornadas").select("*"),
        supabase.from("sesiones").select("*"),
        supabase.from("config").select("*").eq("clave","pin").maybeSingle(),
      ]);
      setJornadas((j.data || []).map(x => ({ ...x, fecha: String(x.fecha).slice(0,10) })));
      setSesiones((s.data || []).map(x => ({ ...x, fecha: String(x.fecha).slice(0,10) })));
      if (c.data && c.data.valor) setPinDB(c.data.valor);
    } catch (e) {
      setMsg({ t:"bad", m:"Error de conexión con la base de datos. Revise su internet." });
    }
    setCargando(false);
  };
  useEffect(() => { cargar(); const t = setInterval(cargar, 20000); return () => clearInterval(t); }, []);

  const munisOrd = useMemo(() => RAW.map(r => ({ id:r[0], muni:r[1], zona:r[5] })).sort((a,b) => a.muni.localeCompare(b.muni)), []);
  const yaAgendado = muni ? sesiones.find(s => s.muni === muni) : null;

  const fechasDisp = useMemo(() => {
    if (!muni || yaAgendado) return [];
    const z = M[muni].zona, h = hoyISO();
    return jornadas
      .filter(j => j.zona === z && j.estado === "abierta" && j.fecha >= h)
      .map(j => ({ ...j, libres: j.cupo - sesiones.filter(s => s.fecha === j.fecha).length }))
      .filter(j => j.libres > 0)
      .sort((a,b) => a.fecha.localeCompare(b.fecha));
  }, [jornadas, sesiones, muni, yaAgendado]);

  const horas = useMemo(() => {
    if (!muni || !fecha) return [];
    const j = jornadas.find(x => x.fecha === fecha);
    if (!j || sesiones.filter(s => s.fecha === fecha).length >= j.cupo) return [];
    return slots(sesiones, muni, fecha);
  }, [jornadas, sesiones, muni, fecha]);

  /* Reservar vía RPC atómica (valida cupo en el servidor) + revalida desplazamiento local */
  const reservar = async () => {
    if (!muni || !fecha || !ini) { setMsg({ t:"bad", m:"Complete los tres pasos." }); return; }
    // Refresca estado antes de validar desplazamiento
    const { data: sFresh } = await supabase.from("sesiones").select("*");
    const ses = (sFresh || []).map(x => ({ ...x, fecha: String(x.fecha).slice(0,10) }));
    if (!factible(ses, muni, fecha, toMin(ini))) {
      setSesiones(ses); setIni(""); setMsg({ t:"bad", m:"Ese horario ya no es viable (otro cuerpo reservó). Elija otro." });
      return;
    }
    const { data, error } = await supabase.rpc("reservar_sesion", {
      p_muni: muni, p_zona: M[muni].zona, p_fecha: fecha, p_ini: ini,
    });
    if (error) { setMsg({ t:"bad", m:"Error al reservar: " + error.message }); return; }
    if (data && data.ok) {
      setMsg({ t:"ok", m:`Confirmado · ${M[muni].muni} · ${fecha} · ${ini}–${toHHMM(toMin(ini)+DUR)}` });
      setMuni(""); setFecha(""); setIni("");
    } else {
      setMsg({ t:"bad", m:(data && data.msg) || "No se pudo reservar." });
    }
    cargar();
  };

  /* Coordinador */
  const publicar = async () => {
    const out = [];
    let d = new Date(fInicio + "T12:00:00");
    ORDEN_ZONAS.forEach(z => {
      const n = RAW.filter(r => r[5] === z).length;
      for (let i = 0; i < Math.ceil(n/cupo); i++) {
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate()+1);
        out.push({ fecha: d.toISOString().slice(0,10), zona: z, cupo: Number(cupo), estado: "abierta" });
        d.setDate(d.getDate()+1);
      }
    });
    await supabase.from("jornadas").delete().neq("fecha", "1900-01-01");
    const { error } = await supabase.from("jornadas").insert(out);
    if (error) setMsg({ t:"bad", m:"Error: " + error.message });
    else setMsg({ t:"ok", m:`${out.length} jornadas publicadas desde ${fInicio}.` });
    cargar();
  };
  const toggleJornada = async (f, estadoActual) => {
    await supabase.from("jornadas").update({ estado: estadoActual === "abierta" ? "cerrada" : "abierta" }).eq("fecha", f);
    cargar();
  };
  const cancelar = async (mid) => {
    await supabase.from("sesiones").delete().eq("muni", mid);
    setMsg({ t:"ok", m:`Cancelada ${M[mid].muni}. Cupo liberado.` });
    cargar();
  };

  const descargarICS = () => {
    const ev = sesiones.map(s => {
      const d = s.fecha.replace(/-/g,""), a = s.ini.replace(":",""), b = toHHMM(toMin(s.ini)+DUR).replace(":","");
      const m = M[s.muni];
      return ["BEGIN:VEVENT", `UID:${s.muni}-${d}@bomberos`,
        `DTSTART;TZID=America/Bogota:${d}T${a}00`, `DTEND;TZID=America/Bogota:${d}T${b}00`,
        `SUMMARY:Capacitación gas natural — ${m.muni}`, `LOCATION:${m.cuerpo}`,
        `DESCRIPTION:${m.cmd} · ${m.email} · ${ZONAS[m.zona]}`, "END:VEVENT"].join("\r\n");
    });
    const cal = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SmartWorkIA//Bomberos//ES",...ev,"END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([cal], { type:"text/calendar" }));
    a.download = "agenda_bomberos.ics"; a.click();
  };

  const cobertura = useMemo(() => {
    const ag = {}; sesiones.forEach(s => ag[s.muni] = 1);
    return ORDEN_ZONAS.map(z => {
      const en = RAW.filter(r => r[5] === z);
      const faltan = en.filter(r => !ag[r[0]]);
      const libres = jornadas.filter(j => j.zona === z && j.estado === "abierta" && j.fecha >= hoyISO())
        .reduce((a,j) => a + Math.max(0, j.cupo - sesiones.filter(s => s.fecha === j.fecha).length), 0);
      return { z, total: en.length, ok: en.length - faltan.length, faltan, libres, riesgo: faltan.length > libres };
    });
  }, [jornadas, sesiones]);

  if (cargando) return <div style={{ background:C.bg, color:C.muted, padding:40, fontFamily:"Segoe UI, system-ui, sans-serif" }}>Cargando agenda…</div>;

  const agendados = sesiones.length, pct = Math.round(agendados/46*100);

  return (
    <div style={{ background:C.bg, color:C.ink, minHeight:"100vh", fontFamily:"Segoe UI, system-ui, Arial, sans-serif", fontSize:15 }}>
      <header style={{ background:"#0c1117", borderBottom:`2px solid ${C.accent}`, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:18 }}>Agenda de Capacitaciones — Emergencias en Red de Gas Natural</h1>
          <div style={{ color:C.muted, fontSize:12, fontFamily:mono, marginTop:3 }}>Cuerpos de Bomberos · Valle del Cauca + Norte del Cauca · 90 min · 06:00–21:00</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["reservar","coordinador"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:"8px 14px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:`1px solid ${tab===t?C.accent:C.line}`, background: tab===t?C.accent:C.panel, color: tab===t?"#141414":C.ink }}>{t === "reservar" ? "Reservar" : "Coordinador"}</button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth:1120, margin:"0 auto", padding:16, display:"grid", gap:16 }}>
        {msg && <Msg tipo={msg.t}>{msg.m}</Msg>}

        {tab === "reservar" && (
          <>
            <Msg tipo="info">Las fechas se publican <b>por zona</b> para optimizar los desplazamientos del equipo instructor. Al elegir su municipio verá solo las jornadas de su zona y los horarios que el itinerario del día permite. El estado es <b>compartido en vivo</b>: si otro cuerpo toma un cupo, desaparece de su pantalla.</Msg>
            <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit, minmax(330px, 1fr))" }}>
              <Card title="Reservar sesión" icon={<Calendar size={14} />}>
                <label style={{ display:"block", fontSize:12, color:C.muted, margin:"4px 0 5px", textTransform:"uppercase" }}>1 · Cuerpo de bomberos</label>
                <select value={muni} onChange={e => { setMuni(e.target.value); setFecha(""); setIni(""); setMsg(null); }} style={{ width:"100%", background:C.panel, border:`1px solid ${C.line}`, color:C.ink, padding:"9px 10px", borderRadius:8, fontSize:14 }}>
                  <option value="">— Seleccione —</option>
                  {munisOrd.map(m => <option key={m.id} value={m.id}>{m.muni}</option>)}
                </select>
                {muni && <div style={{ marginTop:7, display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.blue, fontFamily:mono }}><MapPin size={13} /> {ZONAS[M[muni].zona]}</div>}

                <label style={{ display:"block", fontSize:12, color:C.muted, margin:"14px 0 5px", textTransform:"uppercase" }}>2 · Jornada disponible en su zona</label>
                {!muni ? <span style={{ color:C.muted, fontFamily:mono, fontSize:12 }}>Elija su municipio…</span>
                  : yaAgendado ? <Msg tipo="ok">Ya tiene sesión: {yaAgendado.fecha} a las {yaAgendado.ini}.</Msg>
                  : !fechasDisp.length ? <Msg tipo="bad">No hay jornadas abiertas para su zona. Contacte al coordinador.</Msg>
                  : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{fechasDisp.map(f => <Chip key={f.fecha} sel={fecha===f.fecha} sub={`${f.libres} cupo(s)`} onClick={() => { setFecha(f.fecha); setIni(""); setMsg(null); }}>{f.fecha}</Chip>)}</div>}

                <label style={{ display:"block", fontSize:12, color:C.muted, margin:"14px 0 5px", textTransform:"uppercase" }}>3 · Hora de inicio</label>
                {!fecha ? <span style={{ color:C.muted, fontFamily:mono, fontSize:12 }}>Elija una jornada…</span>
                  : !horas.length ? <Msg tipo="bad">Sin horarios factibles ese día. Elija otra jornada.</Msg>
                  : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{horas.map(h => <Chip key={h} sel={ini===h} onClick={() => setIni(h)}>{h}</Chip>)}</div>}

                {ini && <Msg tipo="info">Sesión {ini} → {toHHMM(toMin(ini)+DUR)} ({DUR} min).</Msg>}
                <button onClick={reservar} disabled={!muni || !fecha || !ini} style={{ width:"100%", marginTop:14, padding:"11px 14px", borderRadius:8, border:"none", fontWeight:700, fontSize:14, cursor: (!muni||!fecha||!ini)?"not-allowed":"pointer", background:C.ok, color:"#08130c", opacity:(!muni||!fecha||!ini)?0.45:1 }}>Confirmar reserva</button>
              </Card>

              <Card title="Sesiones confirmadas" icon={<CheckCircle2 size={14} />}>
                <div style={{ maxHeight:430, overflow:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead><tr>{["Fecha","Municipio","Horario"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {sesiones.length === 0 ? <tr><td colSpan={3} style={{ padding:10, color:C.muted }}>Aún sin sesiones.</td></tr>
                        : [...sesiones].sort((a,b) => (a.fecha+a.ini).localeCompare(b.fecha+b.ini)).map(s => (
                          <tr key={s.muni}><td style={{ ...td, fontFamily:mono }}>{s.fecha}</td><td style={td}>{M[s.muni].muni}</td><td style={{ ...td, fontFamily:mono }}>{s.ini}–{toHHMM(toMin(s.ini)+DUR)}</td></tr>))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}

        {tab === "coordinador" && !auth && (
          <Card title="Acceso restringido" icon={<Lock size={14} />} style={{ maxWidth:400 }}>
            <p style={{ color:C.muted, fontSize:13, marginTop:0 }}>PIN de coordinador.</p>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && (pin === pinDB ? setAuth(true) : setMsg({ t:"bad", m:"PIN incorrecto." }))} style={{ width:"100%", ...inp, fontFamily:mono }} />
            <button onClick={() => pin === pinDB ? setAuth(true) : setMsg({ t:"bad", m:"PIN incorrecto." })} style={{ width:"100%", marginTop:10, padding:"10px", borderRadius:8, border:"none", background:C.accent, color:"#141414", fontWeight:700, cursor:"pointer" }}>Entrar</button>
          </Card>
        )}

        {tab === "coordinador" && auth && (
          <>
            <Card title="Estado de la campaña" icon={<Users size={14} />}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px,1fr))", gap:12 }}>
                {[["agendados", agendados, C.ok], ["pendientes", 46-agendados, agendados===46?C.ok:C.bad], ["cobertura", pct+"%", C.accent], ["jornadas", jornadas.length, C.ink]].map(([l,v,c]) => (
                  <div key={l} style={{ background:C.panel, border:`1px solid ${C.line}`, borderRadius:10, padding:12 }}><b style={{ display:"block", fontFamily:mono, fontSize:26, color:c, lineHeight:1.1 }}>{v}</b><small style={{ color:C.muted, fontSize:11, textTransform:"uppercase" }}>{l}</small></div>))}
              </div>
              <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
                <button onClick={cargar} style={btn}><RefreshCw size={13} /> Actualizar</button>
                <button onClick={descargarICS} disabled={!sesiones.length} style={{ ...btn, opacity: sesiones.length?1:.4 }}><Download size={13} /> Exportar .ics → Google Calendar</button>
              </div>
            </Card>

            <Card title="Publicar jornadas por zona" icon={<Route size={14} />}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                <div><label style={lbl}>Fecha de inicio</label><input type="date" value={fInicio} onChange={e => setFInicio(e.target.value)} style={inp} /></div>
                <div><label style={lbl}>Cupo por día</label><input type="number" min={1} max={7} value={cupo} onChange={e => setCupo(e.target.value)} style={{ ...inp, width:90, fontFamily:mono }} /></div>
                <button onClick={publicar} style={{ ...btn, background:C.accent, color:"#141414", borderColor:C.accent, fontWeight:700 }}>Publicar campaña</button>
              </div>
              <p style={{ color:C.muted, fontSize:12, marginBottom:0 }}>Recorre las zonas sur → norte en días hábiles. Con cupo {cupo}: <b style={{ fontFamily:mono, color:C.ink }}>{ORDEN_ZONAS.reduce((a,z) => a + Math.ceil(RAW.filter(r => r[5]===z).length/cupo), 0)} jornadas</b> para los 46 cuerpos. <span style={{ color:C.warn }}>Republicar reemplaza las jornadas existentes.</span></p>
            </Card>

            <Card title="Cobertura por zona — quién falta" icon={<AlertTriangle size={14} />}>
              {cobertura.map(z => (
                <div key={z.z} style={{ padding:"9px 0", borderBottom:`1px solid ${C.line}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <b>{ZONAS[z.z]}</b><span style={{ fontFamily:mono, color:C.muted, fontSize:12 }}>{z.ok}/{z.total}</span>
                    {z.faltan.length === 0 ? <Tag c={C.ok}>completa</Tag> : z.riesgo ? <Tag c={C.bad}>SIN CUPO SUFICIENTE · {z.libres} libres / {z.faltan.length} faltan</Tag> : <Tag c={C.warn}>{z.faltan.length} pendiente(s) · {z.libres} cupo(s)</Tag>}
                  </div>
                  {z.faltan.length > 0 && <div style={{ fontSize:11.5, color:C.muted, marginTop:3, lineHeight:1.5 }}>Falta: {z.faltan.map(f => f[1]).join(" · ")}</div>}
                </div>))}
            </Card>

            <Card title="Jornadas — ocupación y ruta operativa" icon={<Clock size={14} />}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Fecha","Zona","Ocup.","Carga","Viaje","Ruta / alertas","Acción"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {jornadas.length === 0 ? <tr><td colSpan={7} style={{ padding:10, color:C.muted }}>Sin jornadas. Publique la campaña.</td></tr>
                      : [...jornadas].sort((a,b) => a.fecha.localeCompare(b.fecha)).map(j => {
                        const r = rutaDia(sesiones, j.fecha);
                        const pasada = j.fecha < hoyISO();
                        const al = [];
                        if (r.n === 0 && !pasada && j.estado === "abierta") al.push(["vacía", C.bad]);
                        if (r.n > 0 && r.n < j.cupo && !pasada) al.push(["cupo libre", C.warn]);
                        if (r.carga > 100) al.push(["SOBRECARGA", C.bad]);
                        const cc = r.carga > 100 ? C.bad : r.carga > 85 ? C.warn : C.ok;
                        return (
                          <tr key={j.fecha} style={{ opacity: pasada ? .42 : 1 }}>
                            <td style={{ ...td, fontFamily:mono }}>{j.fecha}</td><td style={td}>{ZONAS[j.zona]}</td>
                            <td style={{ ...td, fontFamily:mono }}>{r.n}/{j.cupo}</td>
                            <td style={{ ...td, fontFamily:mono }}>{r.carga}%<div style={{ height:6, background:"#0c1117", borderRadius:4, marginTop:4, minWidth:64, overflow:"hidden" }}><i style={{ display:"block", height:"100%", width:Math.min(r.carga,100)+"%", background:cc }} /></div></td>
                            <td style={{ ...td, fontFamily:mono }}>{r.viaje}′</td>
                            <td style={td}><div style={{ color:C.muted, fontSize:11.5, fontFamily:mono }}>{r.ruta}</div>{al.map(([t,c]) => <Tag key={t} c={c}>{t}</Tag>)}</td>
                            <td style={td}><button onClick={() => toggleJornada(j.fecha, j.estado)} style={{ ...btn, padding:"5px 9px", fontSize:12 }}>{j.estado === "abierta" ? "cerrar" : "abrir"}</button></td>
                          </tr>);
                      })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Sesiones confirmadas" icon={<CheckCircle2 size={14} />}>
              <div style={{ overflowX:"auto", maxHeight:360 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Fecha","Municipio","Comandante","Horario",""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {sesiones.length === 0 ? <tr><td colSpan={5} style={{ padding:10, color:C.muted }}>Aún sin sesiones.</td></tr>
                      : [...sesiones].sort((a,b) => (a.fecha+a.ini).localeCompare(b.fecha+b.ini)).map(s => (
                        <tr key={s.muni}>
                          <td style={{ ...td, fontFamily:mono }}>{s.fecha}</td><td style={td}>{M[s.muni].muni}</td>
                          <td style={{ ...td, color:C.muted, fontSize:12 }}>{M[s.muni].cmd}</td>
                          <td style={{ ...td, fontFamily:mono }}>{s.ini}–{toHHMM(toMin(s.ini)+DUR)}</td>
                          <td style={td}><button onClick={() => cancelar(s.muni)} style={{ ...btn, padding:"5px 9px", fontSize:12, color:"#ff9a97" }}><X size={11} /> cancelar</button></td>
                        </tr>))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        <div style={{ color:C.muted, fontSize:11, textAlign:"center", padding:14, lineHeight:1.7 }}>
          SmartWorkIA · Base de datos en vivo (Supabase) · Tiempos de viaje: Google Maps (conducción real).
        </div>
      </div>
    </div>
  );
}
