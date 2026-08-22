# Brio OS ⚡

> **Minimalist, zero-latency personal command center and life operating system.**  
> Built with Next.js (App Router), TypeScript, Tailwind CSS, Neon PostgreSQL, Better Auth, and Server Actions.  
> Unifies **Habitica RPG Gamification**, **Brio Finanzas**, **Google Calendar**, **Deep Work Focus Engine**, **Salud & Rendimiento**, **Proyectos & Scratchpad**, y **Rituales AM/PM**.

---

## 🚀 Módulos Principales (Vistas `⌘1` a `⌘6`)

- **`⌘1` ⚡ Tareas & Hábitos (Habitica + Linear Inspector)**:
  - Stream de tareas navegable por Vim (<kbd>j</kbd>/<kbd>k</kbd>, <kbd>Space</kbd>, <kbd>+</kbd>, <kbd>-</kbd>, <kbd>Enter</kbd>).
  - Inspector lateral de notas markdown y subtareas.
  - **Top 3 Must-Win Tasks**: Ribbon de foco del día establecido en el Ritual Matutino.
- **`⌘2` 💰 Brio Finanzas (Neon PostgreSQL)**:
  - **Termómetro del Mes**: Presupuesto mensual vs gasto real acumulado.
  - **Detector de Gastos Hormiga**: Control de presupuesto diario para gustitos y antojos ($150 MXN) con alerta visual.
  - **Bitácora de Transacciones**: Registro de gastos e ingresos, desglose por categorías (`#comida`, `#transporte`) y cuentas (`@nu`, `@bbva`).
  - **Metas de Ahorro**: Fondo de emergencia y metas con aportes rápidos en un clic.
- **`⌘3` 📊 Consistencia & Balance de Vida**:
  - **Heatmap de Hábitos (90 días)**: Gráfico estilo GitHub con niveles de actividad y rachas consecutivas.
  - **Balance de Vida por Tags**: Distribución de tu energía entre salud, trabajo, estudio y finanzas.
- **`⌘4` 📅 Agenda (Google Calendar)**:
  - Sincronización en tiempo real vía dirección secreta iCal para ver reuniones, duración y tiempo restante.
- **`⌘5` 🏋️ Salud & Rendimiento Físico**:
  - **Check-in de Entrenamiento**: 1 clic para registrar sesión (Gym, Cardio, Movilidad, Deportes, Descanso Activo).
  - **Medidor de Hidratación**: Meta diaria de 3L con botones rápidos `+250ml`, `+500ml`, `+1,000ml`.
  - **Suplementos**: Checklist rápido de Creatina, Multivitamínico, Omega 3 y Proteína.
  - **Sueño & Recuperación**: Registro de horas de sueño y calidad del descanso (1 a 5 ⭐).
  - **Importador Samsung Health**: Soporte para importar datos exportados en formato JSON.
- **`⌘6` 💡 Proyectos & Learning Vault**:
  - **Backlog de Proyectos**: Tarjetas con estado (*Idea, En Desarrollo, Pausado, Lanzado*), tags tecnológicos y enlaces.
  - **Tracker de Libros & Cursos**: Porcentaje de avance de lectura, notas clave e incremento rápido de páginas.

---

## ⏱️ Deep Work & Focus Engine (`⌘P`)

- **Flow Timer (25m / 50m / 90m / Sprint)** con **generador nativo de audio ambiental** (Brown Noise, Lluvia, Ruido Blanco, Ondas Alfa) mediante Web Audio API (cero dependencias externas, corre offline).
- **Gamificación RPG**: Al completar una sesión de Deep Work, otorga automáticamente **+EXP y Oro** en Habitica y registra la actividad en Neon DB.

---

## 📝 Scratchpad & Brain Vault (`⌘J`)

- Bloc de notas flotante con Markdown y **autoguardado en tiempo real** en Neon PostgreSQL.
- Botón para **convertir líneas y checklists directamente en tareas de Habitica**.

---

## 🌅 Rituales de Alto Rendimiento

- **Ritual Matutino (`⌘M`)**: Saludo con nivel de RPG, vista previa de reuniones de Google Calendar, selección de las **3 tareas "Must-Win"** y medidor de energía (⚡ 1–5).
- **Cierre Nocturno & Work Shutdown (`⌘E`)**: Auditoría de salud/daño de Habitica (Posada en 1 clic), check-in de gastos, resumen de victorias, 1 agradecimiento, Brain Dump y animación de **"Work Shutdown Complete"** para apagar la mente laboral.

---

## 🪄 Omnibar Híbrido Multimodal (`/` o `⌘F`)

| Input Example | Módulo Destino | Comportamiento |
|---|---|---|
| `-$85.50 Café con pan #antojo @nu // Starbucks` | **Brio Finanzas** | Registra gasto de $85.50 en Neon DB, categoría `#antojo`, cuenta `@nu` y gasto hormiga |
| `+$25000 Pago de nómina #ingreso @bbva` | **Brio Finanzas** | Registra ingreso de $25,000 en Neon DB |
| `* Meditación matutina 15m #salud` | **Habitica** | Crea Daily recurrente |
| `+ Tomar 500ml agua #salud` | **Habitica** | Crea Hábito positivo |
| `- Redes sociales en deep work` | **Habitica** | Crea Hábito negativo |
| `Lanzar v1.0 !urgent #release // Revisar logs` | **Habitica** | Crea To-Do con prioridad 2 y notas |

---

## ⌨️ Atajos de Teclado Globales

- <kbd>⌘1</kbd>: Tareas & Hábitos
- <kbd>⌘2</kbd>: Brio Finanzas
- <kbd>⌘3</kbd>: Consistencia & Balance
- <kbd>⌘4</kbd>: Agenda Google Calendar
- <kbd>⌘5</kbd>: Salud & Entrenamiento
- <kbd>⌘6</kbd>: Proyectos & Lecturas
- <kbd>⌘P</kbd>: Modo Focus Zen & Audio Ambiental
- <kbd>⌘J</kbd>: Scratchpad & Brain Vault
- <kbd>⌘K</kbd>: Paleta de Comandos Global (Raycast style)
- <kbd>⌘M</kbd>: Ritual Matutino
- <kbd>⌘E</kbd>: Cierre Nocturno & Shutdown
- <kbd>⌘F</kbd>: Registrar Movimiento en Brio Finanzas
- <kbd>⌘B</kbd> o <kbd>C</kbd>: Captura por Lotes (Batch Tasks)
- <kbd>/</kbd>: Enfocar Omnibar de captura rápida
- <kbd>j</kbd> / <kbd>k</kbd>: Mover selección en la lista de tareas
- <kbd>Space</kbd> / <kbd>x</kbd>: Completar tarea / daily
- <kbd>+</kbd> / <kbd>-</kbd>: Puntuar hábito
- <kbd>Enter</kbd>: Abrir tarea en el Inspector lateral

---

## 🧪 Pruebas Unitarias & Compilación

```bash
# Ejecutar tests del parser y calendar
npx tsx --test __tests__/parser.test.ts __tests__/calendar.test.ts

# Compilar para producción
npm run build
```
