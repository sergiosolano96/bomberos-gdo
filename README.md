# Agenda Capacitaciones Bomberos GdO — Web App

App web para autoagendamiento de capacitaciones de 46 cuerpos de bomberos (Valle + Norte del Cauca),
acotada por 8 zonas geográficas, con tiempos de viaje reales de Google Maps y estado compartido en vivo.

**Sin login para los bomberos.** Enlace limpio tipo `https://tu-proyecto.pages.dev`.

Stack: React + Vite (frontend estático) · Supabase (Postgres) · Cloudflare Pages (hosting).

---

## Requisitos
- Node.js 18+ y Git instalados
- Cuenta gratis en [Supabase](https://supabase.com) y [Cloudflare](https://dash.cloudflare.com)
- Cuenta en GitHub (para el deploy automático)

---

## PASO 1 — Base de datos (Supabase)

1. Crea proyecto en [supabase.com](https://supabase.com) → **New project**. Guarda la contraseña de la BD.
2. Espera a que termine de aprovisionar (~2 min).
3. Menú **SQL Editor → New query** → pega TODO el contenido de `supabase_schema.sql` → **Run**.
   - Crea tablas `jornadas`, `sesiones`, `config`, `campanas`, `historico`, las políticas de acceso
     y las funciones atómicas `reservar_sesion`, `reagendar_sesion` y `cerrar_campana`.
   - **¿Base de datos ya creada con una versión anterior?** Ejecuta solo `migracion_v2.sql` (es
     idempotente) para agregar campañas, histórico, reagendamiento y asistencia.
4. Menú **Project Settings → API** → copia dos valores:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public key** → `eyJhbGci...`

> La `anon key` es pública por diseño (va en el frontend). La protección está en las políticas RLS del SQL,
> no en ocultar la key. Nunca uses la `service_role` key aquí.

---

## PASO 2 — Probar localmente

```bash
npm install
cp .env.example .env.local
# edita .env.local y pega tu URL y anon key
npm run dev
```

Abre `http://localhost:5173`. Ve a **Coordinador** (PIN `GDO2026`) → **Publicar campaña**.
Prueba una reserva. Debe aparecer en Supabase (tabla `sesiones`).

Cambia el PIN en Supabase → tabla `config` → fila `pin`.

---

## PASO 3 — Subir a GitHub

```bash
git init
git add .
git commit -m "Agenda bomberos GdO"
# crea un repo vacío en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/bomberos-gdo.git
git branch -M main
git push -u origin main
```

`.env.local` NO se sube (está en `.gitignore`). Las claves se configuran en Cloudflare (paso 4).

---

## PASO 4 — Desplegar en Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Selecciona tu repo `bomberos-gdo`.
3. Configuración de build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Environment variables** (Settings → sección Variables) → agrega las dos:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
5. **Save and Deploy**.

Al terminar tendrás una URL: `https://bomberos-gdo.pages.dev`.
**Esa es la que envías a los 46 cuerpos.** Abren, eligen municipio, agendan. Sin login.

Cada `git push` a `main` redespliega automáticamente. Sin "publicar versiones" manual.

---

## Operación

- **Publicar campaña:** pestaña Coordinador → fecha de inicio + cupo/día → Publicar.
- **Control en vivo:** cobertura por zona, quién falta, alerta `SIN CUPO SUFICIENTE`, carga y ruta de cada día.
- **Calendar:** botón "Exportar .ics" → importas el archivo a Google Calendar.
- **Cancelar/cerrar:** desde el panel; libera cupo al instante.

---

## Notas técnicas

- **Anti doble-reserva:** la función `reservar_sesion` valida el cupo dentro de una transacción con
  `SELECT ... FOR UPDATE`; dos cuerpos no pueden tomar el mismo último cupo. Además el front revalida
  el desplazamiento contra el estado fresco antes de escribir.
- **Bloqueo por zona:** un cuerpo solo ve jornadas de su zona; el desplazamiento intradía se valida
  contra la matriz real de Maps embebida en `src/data.js`.
- **Supabase free se pausa tras 7 días de inactividad.** Durante la campaña no aplica. Si queda inactiva
  entre campañas, reactívala desde el dashboard (1 clic). Alternativa sin pausa: migrar a Neon.
- **Costo:** $0. Cloudflare Pages (ancho de banda ilimitado, sin tarjeta) + Supabase free.

---

## Estructura

```
bomberos-gdo/
├── index.html
├── package.json
├── vite.config.js
├── supabase_schema.sql      ← ejecutar en Supabase una vez
├── .env.example             ← plantilla de variables
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx              ← UI + lógica
    ├── data.js             ← 46 cuerpos + matriz Maps
    └── supabase.js         ← cliente
```
