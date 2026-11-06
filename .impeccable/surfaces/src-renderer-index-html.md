---
version: 1
slug: "src-renderer-index-html"
primary_target: "src/renderer/index.html"
related_targets: []
---

# Surface: app shell + demand rail (Operate)

Scope: the Electron window of Demandas: login/registration screens and the main workspace (sidebar views, capture bar, demand rail/list, detail panel). Visitor mode: Operate.

Job: capture a demand in under five seconds from the keyboard; know what to do next at a glance (overdue, due today, in progress, waiting on someone).

## Direction contract

THESIS: Demands arrive like orders at a kitchen pass. Each one prints as a numbered ticket with its age running, hangs on the rail while in progress, and gets torn off when done. Refuses the grey checklist with one accent.

OWN-WORLD: Brushed-steel cool grey shell (rail, sidebar), thermal-paper off-white tickets, near-black receipt ink, one fire red for urgent/overdue, heat-lamp amber for due today/aging. Archivo (self-hosted grotesk, replacing Inter after the detector flagged it as overused) for UI, JetBrains Mono only for ticket numbers, times and counts (measurement). Dark theme: blackened steel shell, tickets dim paper.

STORY: The user hits Ctrl+Shift+Espaço, types one line with inline tokens (!urgente @pessoa #projeto amanhã), presses Enter, and the ticket prints onto the queue. Today view tells them what to fire next.

FIRST VIEWPORT: Left sidebar (240px) with views and mono counts. Top: capture bar as the printer slot with live token chips. Main: "Na mesa" rail, a horizontal row of in-progress tickets clipped to a steel bar; below, sections Atrasadas / Vence hoje / Fila as dense ticket rows. Right: detail panel opens on selection.

ADAPTATION (cited): Today shows Na mesa, Atrasadas, Vencem hoje and Urgentes (urgent with no due date), then a link to the rest of the queue. Product reason: principle 3, Today answers "what next" without scrolling; the full queue is the Fila view (Ctrl+2), so repeating it on Today would bury the urgent rows.

FORM: candidate 1 (kitchen ticket rail), Impeccable's pick over assigned 7. seed:8936c6b75477f432. Signature move: done tears the ticket off the rail (perforation edge, 220ms tear-up). Raise from Labanotation: age shown as honest elapsed time on every ticket. Raise from acetate manual: view counts proportional, always visible.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
