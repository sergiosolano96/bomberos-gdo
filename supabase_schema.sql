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
