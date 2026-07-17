# Instructivo — Filosofía y condiciones de operación del Agendador

**Agenda de Capacitaciones — Emergencias en Red de Gas Natural**
Cuerpos de Bomberos · Valle del Cauca + Norte del Cauca

Este documento explica **cómo piensa la aplicación**: qué principios guiaron su diseño, qué
parámetros tiene fijos, qué reglas aplica al reservar y qué debe saber quien la opere.

---

## 1. El problema que resuelve

Un equipo instructor debe capacitar a **46 cuerpos de bomberos** repartidos en dos departamentos.
Coordinar 46 agendas por teléfono o WhatsApp produce colisiones, dobles reservas y rutas de viaje
imposibles (por ejemplo, una sesión en Buenaventura a las 8:00 y otra en La Cumbre a las 9:30, cuando
entre ambas hay más de 2 horas de carretera).

La aplicación invierte el modelo: **cada cuerpo se agenda a sí mismo**, pero solo puede elegir entre
opciones que la logística del instructor realmente permite. La libertad del usuario está acotada por
las restricciones físicas del recorrido.

---

## 2. Principios de diseño (la filosofía)

1. **Cero fricción para el bombero.** No hay registro, ni usuario, ni contraseña. Se abre el enlace,
   se elige el municipio y se reserva en tres pasos. La identificación es la selección del propio
   cuerpo; el sistema opera bajo un modelo de confianza (son 46 instituciones conocidas, no público
   anónimo de internet).

2. **El sistema solo ofrece lo posible.** El usuario nunca ve una opción inválida. Si una fecha no
   corresponde a su zona, no aparece. Si un horario haría imposible que el instructor llegue desde la
   sesión anterior, no aparece. Así no hay que "rechazar" reservas: lo que se puede elegir, se puede
   cumplir.

3. **Estado compartido en vivo.** Todos ven la misma agenda, alimentada por una base de datos
   central. La pantalla se refresca sola cada 20 segundos: si otro cuerpo toma un cupo, esa opción
   desaparece de las demás pantallas.

4. **Una sesión por cuerpo por campaña.** Cada cuerpo tiene derecho a exactamente una sesión en la
   campaña activa. Es una regla estructural de la base de datos (el municipio es la llave primaria),
   no un simple aviso: es imposible duplicarse. Sí puede **reagendar** su sesión mientras haya cupo.

5. **La geografía manda.** Los desplazamientos son la restricción más cara de la operación, por eso
   la campaña se organiza **por zonas** y los tiempos de viaje usados son **reales** (minutos de
   conducción tomados de Google Maps), no estimaciones genéricas.

---

## 3. Organización territorial

Los 46 cuerpos están agrupados en **8 zonas geográficas**:

| Zona | Nombre | Municipios |
|------|--------|-----------|
| Z1 | Corredor Pacífico | Buenaventura, Dagua, Borrero Ayerbe, La Cumbre |
| Z2 | Cali metropolitana | Cali, Yumbo, Jamundí |
| Z3 | Norte del Cauca | Puerto Tejada, Villa Rica, Guachené, Padilla, Caloto, Santander de Quilichao, Corinto, Miranda |
| Z4 | Sur-oriente Valle | Candelaria, Palmira, Pradera, Florida, El Cerrito |
| Z5 | Centro | Buga, Guacarí, Ginebra, Yotoco, Vijes, Restrepo, Calima (El Darién) |
| Z6 | Centro-norte | Tuluá, Andalucía, Bugalagrande, San Pedro, Riofrío, Trujillo |
| Z7 | Norte | Zarzal, Roldanillo, La Unión, La Victoria, Bolívar, El Dovio, Toro |
| Z8 | Norte extremo | Cartago, Obando, Alcalá, Ansermanuevo, Sevilla, Caicedonia |

**Regla central: cada jornada (día) pertenece a una sola zona.** El instructor nunca cruza de zona
dentro de un mismo día. Un cuerpo solo ve las fechas asignadas a su zona.

La aplicación tiene embebida una **matriz de tiempos de conducción** entre todos los municipios de
una misma zona (en minutos, tomados de Google Maps en condiciones reales). Ejemplos: Buenaventura →
Dagua 100 min; Cali → Yumbo 35 min; Cartago → Sevilla 100 min. Si un par de municipios no está en la
matriz, el sistema asume 30 minutos por defecto.

---

## 4. Parámetros fijos de la operación

| Parámetro | Valor | Significado |
|-----------|-------|-------------|
| Duración de la sesión | **90 minutos** | Toda capacitación dura lo mismo, sin excepciones |
| Ventana operativa | **06:00 a 21:00** | Ninguna sesión inicia antes de las 06:00 ni termina después de las 21:00 |
| Granularidad de horarios | **cada 30 min** | Las horas de inicio ofrecidas van de media en media hora (06:00, 06:30, 07:00…) |
| Cupo por jornada | **configurable 1–7, por defecto 4** | Máximo de cuerpos que se capacitan en un mismo día |
| Sesiones por cuerpo | **exactamente 1** | Regla estructural, no se puede violar |
| Días de trabajo | **lunes a viernes** | Al publicar la campaña se saltan sábados y domingos automáticamente |

Estos valores están definidos en el código (`src/App.jsx`, constantes `DUR`, `VENT_INI`, `VENT_FIN`,
`PASO`). Cambiarlos requiere editar el código y redesplegar.

---

## 5. Cómo se construye la campaña (lo que hace el coordinador)

El coordinador ingresa a la pestaña **Coordinador** con un PIN (guardado en la base de datos, tabla
`config`; el valor inicial es `GDO2026` y **debe cambiarse** antes de compartir el enlace).

Al **publicar la campaña** define tres cosas: el **nombre de la campaña** (para identificarla en el
histórico), la **fecha de inicio** y el **cupo por día**. Con eso el sistema genera todas las
jornadas automáticamente según estas reglas:

1. Recorre las zonas en un **orden fijo sur → norte**: Z2 → Z4 → Z3 → Z1 → Z5 → Z6 → Z7 → Z8.
   La lógica: empezar por el área metropolitana y el sur, e ir subiendo hacia el norte del Valle para
   que el desplazamiento grueso de la campaña sea un solo barrido geográfico.
2. A cada zona le asigna **días consecutivos hábiles** suficientes para cubrir todos sus cuerpos:
   `días = redondear hacia arriba (cuerpos de la zona ÷ cupo)`. Ejemplo con cupo 4: Z3 tiene 8
   cuerpos → 2 jornadas; Z2 tiene 3 cuerpos → 1 jornada.
3. Con cupo 4, la campaña completa son **14 jornadas** para los 46 cuerpos.

> ⚠️ **Republicar la campaña borra TODAS las jornadas existentes** y las genera de nuevo. Las
> sesiones ya reservadas no se borran, pero pueden quedar apuntando a fechas que ya no existen.
> Publique una sola vez; para ajustes puntuales use abrir/cerrar jornadas.

El coordinador también puede:
- **Cerrar o reabrir una jornada** individual (una jornada cerrada no acepta más reservas, pero las que ya tiene se conservan).
- **Cancelar la sesión de un cuerpo** — el cupo se libera al instante y el cuerpo puede volver a agendarse.
- **Marcar asistencia** de cada sesión (✔ asistió / ✘ no asistió / — sin marcar) desde la tabla de
  sesiones. El indicador "asistieron" del tablero y las exportaciones reflejan la marca.
- **Exportar toda la agenda a un archivo `.ics`** e importarla en Google Calendar (eventos con zona horaria de Bogotá, incluyen comandante, correo y zona de cada cuerpo).
- **Exportar a CSV/Excel** las sesiones de la campaña activa (fecha, municipio, zona, comandante,
  correo, horario y asistencia) o el **histórico completo de campañas cerradas**.

### Ciclo de vida de las campañas

El sistema maneja **una campaña activa a la vez**, pero soporta campañas sucesivas (anuales,
semestrales, por tema) mediante el botón **«Cerrar campaña»**:

1. Al cerrar, todas las sesiones (con su asistencia) se **archivan al histórico** bajo el nombre de
   la campaña, y se limpian las jornadas. Todo ocurre en una sola transacción en el servidor.
2. El sistema queda listo para **publicar la siguiente campaña**: los 46 cuerpos recuperan su derecho
   a una nueva sesión.
3. El histórico nunca se borra desde la app: queda disponible para el CSV de reportes y para
   comparar cobertura entre campañas.

> Orden correcto entre campañas: **Cerrar campaña → Publicar la nueva.** Si se republica sin cerrar,
> se reemplazan las jornadas de la campaña en curso (mismo nombre, misma campaña), no se crea una nueva.

---

## 6. Cómo reserva un cuerpo (y qué valida el sistema)

El flujo del bombero son tres pasos, y en cada uno el sistema filtra lo imposible:

**Paso 1 — Elegir municipio.** La app identifica automáticamente su zona.

**Paso 2 — Elegir fecha.** Solo se muestran jornadas que cumplan TODAS estas condiciones:
- Son de **su zona**.
- Están en estado **"abierta"**.
- Son **hoy o futuras** (nunca fechas pasadas).
- Tienen **cupo libre** (reservas del día < cupo).

**Paso 3 — Elegir hora de inicio.** Aquí opera el **motor de factibilidad**, el corazón de la
aplicación. Para cada media hora entre 06:00 y 19:30 verifica que, insertando esa sesión en el
itinerario del día, el recorrido completo del instructor siga siendo físicamente posible:
- La sesión no se solapa con ninguna otra ya reservada ese día.
- Entre el fin de cada sesión y el inicio de la siguiente hay **al menos el tiempo de conducción
  real** entre esos dos municipios según la matriz de Google Maps.

Ejemplo: si Buenaventura ya reservó 08:00–09:30, Dagua (a 85 min de camino) no verá el horario de
10:00 — el primero factible que le aparecerá será 11:00.

**Reagendamiento por el propio cuerpo.** Un cuerpo que ya tiene sesión puede moverla él mismo con el
botón **«Reagendar sesión»**: ve las jornadas de su zona con cupo (sin contar el suyo propio) y los
horarios factibles. Su cupo actual **solo se libera cuando confirma el nuevo horario** — si se
arrepiente o no hay alternativas, su sesión original queda intacta. La operación es atómica en el
servidor: nunca queda "sin sesión" a mitad de camino.

**Confirmación con doble validación anti-colisión.** Al presionar "Confirmar reserva" ocurren dos
verificaciones, porque entre que el usuario miró la pantalla y presionó el botón, otro cuerpo pudo
reservar:
1. El navegador **recarga el estado fresco** de la base de datos y revalida que el horario elegido
   siga siendo factible en ruta. Si ya no lo es, rechaza y pide elegir otro.
2. La reserva se ejecuta en el **servidor mediante una función atómica** (`reservar_sesion`) que
   bloquea la fila de la jornada, verifica cupo y unicidad dentro de una transacción, y solo entonces
   inserta. **Dos cuerpos no pueden quedarse con el mismo último cupo** ni aunque presionen el botón
   en el mismo segundo: uno recibe confirmación y el otro un mensaje de cupo agotado.

---

## 7. Panel de control del coordinador — cómo leer las alertas

**Cobertura por zona** (quién falta):
- 🟢 `completa` — todos los cuerpos de la zona ya agendaron.
- 🟠 `N pendiente(s) · M cupo(s)` — faltan cuerpos pero los cupos alcanzan.
- 🔴 `SIN CUPO SUFICIENTE` — **la alerta más importante**: faltan más cuerpos que cupos libres
  quedan en esa zona. Los rezagados no cabrán. Acción: reabrir jornadas cerradas de esa zona o
  contactar a los cuerpos faltantes (la lista aparece debajo).

**Tabla de jornadas** (ocupación y ruta):
- **Ocup.** — reservas / cupo del día.
- **Carga** — porcentaje de la ventana de 15 horas ocupado por sesiones + viajes. Verde ≤ 85 %,
  naranja hasta 100 %, rojo `SOBRECARGA` si supera el 100 % (el itinerario no cabe en el día — puede
  ocurrir tras cancelaciones y re-reservas cruzadas; revisar la ruta).
- **Viaje** — minutos totales de conducción del instructor ese día.
- **Ruta** — el itinerario del día en orden: `CALI 08:00 → YUMBO 10:00 → …`. Es la hoja de ruta
  operativa del equipo instructor.
- `vacía` — jornada abierta y futura sin ninguna reserva aún.
- `cupo libre` — tiene reservas pero no se llenó.

---

## 8. Modelo de seguridad — qué protege y qué no

- **No hay autenticación para reservar.** Es una decisión deliberada: el objetivo es adopción
  máxima con cero soporte. El riesgo aceptado es que cualquiera con el enlace podría reservar en
  nombre de un cuerpo; se mitiga compartiendo el enlace solo con los 46 comandantes y con la
  capacidad del coordinador de cancelar cualquier sesión.
- **El PIN del coordinador** protege el panel de gestión (publicar, cerrar, cancelar). Se cambia en
  la base de datos (Supabase → tabla `config` → fila `pin`) sin tocar código.
- **La clave pública (anon key) que va en el frontend es pública por diseño.** La protección real
  está en las políticas de la base de datos y en la función atómica del servidor, no en ocultar la
  clave. La clave `service_role` (administrativa) nunca debe usarse en la aplicación.
- **Integridad de datos:** la regla "una sesión por cuerpo" y la validación de cupo se imponen en el
  servidor; ningún navegador malicioso o lento puede saltárselas.

---

## 9. Supuestos y límites conocidos

- **Un solo equipo instructor.** Todo el motor de rutas asume un único recorrido por día. Dos
  equipos en paralelo requerirían cambios de diseño.
- **Una campaña activa a la vez.** Las campañas son sucesivas, no simultáneas; las cerradas viven en
  el histórico (solo lectura desde la app).
- **Los tiempos de viaje son fijos** (cacheados de Google Maps). No consideran tráfico del día,
  derrumbes ni cierres de vía. Son conducción en condiciones normales.
- **Viajes solo intra-zona.** El sistema no valida el desplazamiento entre la última sesión de una
  zona y la primera de la zona siguiente (días distintos, se asume pernocta/traslado nocturno).
- **La base de datos gratuita (Supabase) se pausa tras 7 días sin uso.** Durante una campaña activa
  no aplica; si queda inactiva entre campañas, se reactiva con un clic desde el panel de Supabase.
- **El refresco es cada 20 segundos**, no instantáneo. Las colisiones en esa ventana las resuelve la
  doble validación del punto 6 — el usuario simplemente verá un mensaje pidiéndole elegir otro horario.
- **Costo de operación: $0.** Alojamiento en Cloudflare (ancho de banda ilimitado) + Supabase gratuito.

---

## 10. Resumen en una frase

> La aplicación deja que cada cuerpo elija su propia fecha y hora, pero **solo entre opciones que un
> único instructor, viajando por carretera dentro de una zona por día, puede cumplir físicamente** —
> y garantiza en el servidor que nadie duplique reservas ni tome un cupo ya ocupado.

---

*Documento generado a partir del código fuente (`src/App.jsx`, `src/data.js`, `supabase_schema.sql`).
Si los parámetros del código cambian, actualizar este instructivo.*
