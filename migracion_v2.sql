-- ============================================================
-- MIGRACIÓN V2 — Campañas, histórico, reagendamiento y asistencia
-- Ejecutar UNA VEZ en: Supabase → SQL Editor → New query → Run
-- (Es idempotente: correrla dos veces no daña nada.)
-- ============================================================

-- 1) Entidad campaña: la activa es la que tiene cerrada_en NULL
create table if not exists campanas (
  id         bigserial primary key,
  nombre     text not null,
  creada_en  timestamptz not null default now(),
  cerrada_en timestamptz
);
alter table campanas enable row level security;
drop policy if exists "lectura_campanas" on campanas;
drop policy if exists "insert_campanas"  on campanas;
drop policy if exists "update_campanas"  on campanas;
create policy "lectura_campanas" on campanas for select using (true);
create policy "insert_campanas"  on campanas for insert with check (true);
create policy "update_campanas"  on campanas for update using (true);

-- 2) Histórico: sesiones archivadas de campañas cerradas
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
drop policy if exists "lectura_historico" on historico;
create policy "lectura_historico" on historico for select using (true);

-- 3) Registro de asistencia sobre las sesiones vigentes
alter table sesiones add column if not exists asistio boolean;
drop policy if exists "update_sesiones" on sesiones;
create policy "update_sesiones" on sesiones for update using (true);

-- 4) RPC: cerrar campaña — archiva sesiones, limpia jornadas,
--    marca la campaña como cerrada. Todo en una transacción.
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

-- 5) RPC: reagendar — mueve la sesión existente de un cuerpo a otra
--    fecha/hora validando cupo en el servidor (sin contar su propio
--    cupo actual). Si la validación falla, la sesión original queda intacta.
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
