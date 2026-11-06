# Surface: app shell + demand list (Operate)

Scope: the Demandas window (desktop) and the claude.ai page (web): login/registration screens and the workspace (sidebar views, capture bar, in-progress cards, demand list, detail panel). Visitor mode: Operate.

Job: capture a demand in under five seconds from the keyboard; know what to do next at a glance (overdue, due today, in progress, waiting on someone).

## Direction contract

THESIS: User-pinned redesign (replaces the kitchen-ticket world, which the user found too generic): clean, minimalist, beautiful icons, rounded cards with soft (not coarse) corners. The interface recedes; content and state carry the screen.

OWN-WORLD: Neutrals tinted toward the pine-teal accent (not stock zinc), groups as single rounded containers with hairline dividers, white surfaces with 1px hairlines, soft two-layer shadows, radii 8/10/14/18px. One accent (teal) for primary actions, selection, focus and in-progress; red/amber/blue/green only for overdue, due-today/high, waiting and done. Figtree for all text with tabular numerals. Lucide icons at 1.6 stroke.

STORY: Ctrl+Shift+Espaço (desktop) or N (web), type one line with inline tokens, Enter; the card arrives in its group. Today answers what next.

FIRST VIEWPORT: Left sidebar on the ground (views with count badges, projects). Top: capture field with a plus glyph and live token chips. Main: rounded panel with "Em andamento" cards in a row, then Atrasadas / Vencem hoje / Urgentes, each a single rounded container with hairline-divided rows; Today fits a 1280x820 window without scrolling. Right: detail panel as a floating rounded card.

ADAPTATION (cited): at ≤980px the project list moves into a Projetos popover on the icon rail. Today shows Em andamento, Atrasadas, Vencem hoje and Urgentes, then a link to the rest of the queue (principle 3: Today answers "what next" without scrolling; the full queue is the Fila view).

FORM: user-pinned direction (clean, minimalist, beautiful icons, soft rounded panels); the brief beats the roll, roll recorded for provenance: seed:63428686fb818150. Signature: completing fills the round checkbox with the accent and the card slides out (260ms); new cards arrive with a soft accent ring (320ms).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
