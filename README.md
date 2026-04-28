# Gantt — local first

Editor de cartas Gantt simple y rápido, sin login, sin backend.
Todo vive en `localStorage`. Pensado para deploy en Vercel.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- Zustand con persist → `localStorage`
- `html-to-image` + `jspdf` para exportar
- `date-fns` para fechas
- `lucide-react` para íconos

## Funcionalidades

- **Tareas**: nombre, fechas inicio/fin, progreso %, color, notas
- **Grupos / subtareas**: indentar/outdentar, colapsar
- **Hitos**: tareas con misma fecha de inicio y fin se renderizan como diamante
- **Dependencias**: arrastrá desde el círculo de una barra hasta otra (estilo MS Project / monday). Click en la flecha para borrar.
- **Drag & drop** sobre las barras: mover entera, agarrar los bordes para redimensionar
- **Zoom de tiempo**: días / semanas / meses
- **Zoom de tipografía**: 80%–150%
- **Reiniciar proyecto** desde una nueva fecha (botón con confirmación)
- **Export** a PNG y PDF (snapshot del contenido completo, no solo lo visible)
- **Backup**: import / export JSON

## Atajos / interacciones

| Acción | Cómo |
| --- | --- |
| Editar tarea | doble click sobre la barra o sobre la fila |
| Mover tarea en el tiempo | arrastrar la barra |
| Redimensionar | arrastrar los bordes (aparecen al hacer hover) |
| Crear dependencia | hover sobre una barra → arrastrar desde el círculo a otra barra |
| Borrar dependencia | click en la flecha |
| Cancelar dependencia en curso | tecla `Esc` |
| Reordenar filas | flechas ↑↓ que aparecen al hacer hover en la fila o desde el diálogo |

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Deploy a Vercel

### Opción rápida (CLI)

```bash
npm i -g vercel
vercel
# seguir el prompt; luego:
vercel --prod
```

### Opción dashboard

1. Subí el repo a GitHub / GitLab / Bitbucket.
2. En [vercel.com/new](https://vercel.com/new) → "Import" el repo.
3. Vercel detecta Next.js solo. Click en **Deploy**.

No hay variables de entorno ni configuración adicional.

## Datos

- Todo se guarda en `localStorage` bajo la clave `gantt-app-v1`.
- Si se borran cookies / site data, se pierde todo.
- Para backup: usa el botón ⬇ Export JSON. Para restaurar: ⬆ Import JSON.

## Licencia

MIT
