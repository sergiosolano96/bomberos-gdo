-- ============================================================
-- ESQUEMA SUPABASE — Agenda Capacitaciones Bomberos GdO
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Tabla de jornadas (fecha -> zona, cupo)
create table if not exists jornadas (
  fecha   date not null,
  zona    text not null,
  cupo    int  not null default 4,
  estado  text not null default 'abierta',
  primary key (fecha)
);

-- Tabla de sesiones confirmadas
create table if not exists sesiones (
  muni    text primary key,           -- 1 sesión por cuerpo (bloqueo natural)
  fecha   date not null,
  ini     text not null,              -- 'HH:MM'
  ts      timestamptz not null default now()
);

-- Config (PIN del coordinador, etc.)
create table if not exists config (
  clave   text primary key,
  valor   text
);
insert into config (clave, valor) values ('pin', 'GDO2026')
  on conflict (clave) do nothing;

-- ============================================================
-- Row Level Security: permitir lectura/escritura anónima
-- (la app es pública; la protección es lógica, no por auth)
-- ============================================================
alter table jornadas enable row level security;
alter table sesiones enable row level security;
alter table config   enable row level security;

-- Lectura pública
create policy "lectura_jornadas" on jornadas for select using (true);
create policy "lectura_sesiones" on sesiones for select using (true);
create policy "lectura_config"   on config   for select using (true);

-- Escritura pública en sesiones (reservar / cancelar)
create policy "insert_sesiones" on sesiones for insert with check (true);
create policy "delete_sesiones" on sesiones for delete using (true);

-- Escritura en jornadas (solo la usa el coordinador desde la app;
-- si quieres blindarla, quita estas 2 políticas y publica jornadas por SQL)
create policy "insert_jornadas" on jornadas for insert with check (true);
create policy "update_jornadas" on jornadas for update using (true);
create policy "delete_jornadas" on jornadas for delete using (true);

-- ============================================================
-- RPC ATÓMICA: reservar con validación de cupo en el servidor
-- Evita la condición de carrera (dos cuerpos, mismo último cupo)
-- ============================================================
create or replace function reservar_sesion(
  p_muni text, p_zona text, p_fecha date, p_ini text
) returns json
language plpgsql
as $$
declare
  v_cupo int;
  v_estado text;
  v_ocupados int;
begin
  -- ¿ya tiene sesión este cuerpo?
  if exists (select 1 from sesiones where muni = p_muni) then
    return json_build_object('ok', false, 'msg', 'Este cuerpo ya tiene sesión agendada.');
  end if;

  -- bloquea la fila de la jornada para lectura consistente
  select cupo, estado into v_cupo, v_estado
  from jornadas where fecha = p_fecha for update;

  if not found or v_estado <> 'abierta' then
    return json_build_object('ok', false, 'msg', 'Esa fecha no está abierta.');
  end if;

  select count(*) into v_ocupados from sesiones where fecha = p_fecha;
  if v_ocupados >= v_cupo then
    return json_build_object('ok', false, 'msg', 'Cupo de la jornada agotado.');
  end if;

  insert into sesiones (muni, fecha, ini) values (p_muni, p_fecha, p_ini);
  return json_build_object('ok', true, 'msg', 'Confirmado');
end;
$$;

-- ============================================================
-- V2 — Campañas, histórico, reagendamiento y asistencia
-- (instalaciones existentes: ejecutar migracion_v2.sql)
-- ============================================================

create table if not exists campanas (
  id         bigserial primary key,
  nombre     text not null,
  creada_en  timestamptz not null default now(),
  cerrada_en timestamptz
);
alter table campanas enable row level security;
create policy "lectura_campanas" on campanas for select using (true);
create policy "insert_campanas"  on campanas for insert with check (true);
create policy "update_campanas"  on campanas for update using (true);

create table if not exists historico (
  id           bigserial primary key,
  campana      text,
  muni         text not null,
  fecha        date not null,
  ini          text not null,
  asistio      boolean,
  archivado_en timestamptz not null default now()
);
alter table historico enable row level security;
create policy "lectura_historico" on historico for select using (true);

alter table sesiones add column if not exists asistio boolean;
create policy "update_sesiones" on sesiones for update using (true);

create or replace function cerrar_campana() returns json
language plpgsql
as $$
declare
  v_nombre text;
  v_n int;
begin
  select nombre into v_nombre
  from campanas where cerrada_en is null
  order by creada_en desc limit 1;

  insert into historico (campana, muni, fecha, ini, asistio)
    select coalesce(v_nombre, 'sin nombre'), muni, fecha, ini, asistio
    from sesiones;
  get diagnostics v_n = row_count;

  delete from sesiones;
  delete from jornadas;
  update campanas set cerrada_en = now() where cerrada_en is null;

  return json_build_object('ok', true, 'archivadas', v_n);
end;
$$;

create or replace function reagendar_sesion(
  p_muni text, p_fecha date, p_ini text
) returns json
language plpgsql
as $$
declare
  v_cupo int;
  v_estado text;
  v_ocupados int;
begin
  if not exists (select 1 from sesiones where muni = p_muni) then
    return json_build_object('ok', false, 'msg', 'Este cuerpo no tiene sesión para reagendar.');
  end if;

  select cupo, estado into v_cupo, v_estado
  from jornadas where fecha = p_fecha for update;

  if not found or v_estado <> 'abierta' then
    return json_build_object('ok', false, 'msg', 'Esa fecha no está abierta.');
  end if;

  select count(*) into v_ocupados
  from sesiones where fecha = p_fecha and muni <> p_muni;
  if v_ocupados >= v_cupo then
    return json_build_object('ok', false, 'msg', 'Cupo de la jornada agotado.');
  end if;

  update sesiones set fecha = p_fecha, ini = p_ini, ts = now()
  where muni = p_muni;
  return json_build_object('ok', true, 'msg', 'Reagendado');
end;
$$;
