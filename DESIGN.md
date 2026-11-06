---
name: Demandas
description: A kitchen ticket rail for one person's work demands. Steel shell, thermal-paper tickets, and fire for whatever is burning.
colors:
  steel-ground: "#e4e7ea"
  steel-side: "#d3d8dd"
  steel-raised: "#dce0e4"
  steel-line: "#bcc3ca"
  steel-ink: "#24282d"
  steel-ink-2: "#50575f"
  rail-hi: "#f6f8fa"
  rail-mid: "#aab2ba"
  paper: "#fbfbf8"
  paper-sunk: "#f1f2ee"
  paper-edge: "#d6d9d4"
  ink: "#17191c"
  ink-2: "#474d55"
  ink-3: "#646b73"
  fire: "#c42119"
  fire-soft: "#fbe2df"
  fire-ink: "#9b140d"
  heat: "#8a4f00"
  heat-soft: "#ffe7bf"
  wait: "#2c5a92"
  wait-soft: "#e0eaf6"
  done: "#2b7246"
  done-soft: "#ddefe3"
  select-bg: "#ffd27a"
  steel-ground-dark: "#1a1d20"
  steel-side-dark: "#111315"
  steel-raised-dark: "#212529"
  steel-line-dark: "#30363c"
  steel-ink-dark: "#e2e5e9"
  steel-ink-2-dark: "#9ea6af"
  rail-hi-dark: "#6e7780"
  rail-mid-dark: "#3c434a"
  paper-dark: "#2c2b29"
  paper-sunk-dark: "#252422"
  paper-edge-dark: "#3d3c39"
  ink-dark: "#eef0f2"
  ink-2-dark: "#b7bec6"
  ink-3-dark: "#939ba4"
  fire-dark: "#ff6b5e"
  fire-soft-dark: "#4a201c"
  fire-ink-dark: "#ff8a7f"
  heat-dark: "#f2b14e"
  heat-soft-dark: "#3f2f19"
  wait-dark: "#8fb6ec"
  wait-soft-dark: "#1e2b3c"
  done-dark: "#72cf95"
  done-soft-dark: "#1c3325"
  select-bg-dark: "#7a5a1c"
typography:
  display:
    fontFamily: "Archivo, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 680
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Archivo, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 640
    lineHeight: 1.35
    letterSpacing: "-0.012em"
  ticket-title:
    fontFamily: "Archivo, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Archivo, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "\"kern\""
  group-label:
    fontFamily: "Archivo, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 620
  label:
    fontFamily: "Archivo, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 560
  number:
    fontFamily: "JetBrains Mono, Cascadia Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\""
  number-strong:
    fontFamily: "JetBrains Mono, Cascadia Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\""
  keycap:
    fontFamily: "JetBrains Mono, Cascadia Mono, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1
rounded:
  ticket: "3px"
  control: "6px"
  inset: "4px"
  pill: "13px"
  round: "50%"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  2xl: "22px"
  3xl: "26px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "color-mix(in srgb, #17191c 86%, #c42119)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.fire-ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.fire-soft}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
  capture-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "40px"
  search-field:
    backgroundColor: "color-mix(in srgb, #24282d 6%, transparent)"
    textColor: "{colors.steel-ink}"
    rounded: "{rounded.control}"
    height: "36px"
    width: "220px"
  ticket-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ticket}"
    padding: "6px 14px 6px 8px"
    height: "48px"
  ticket-row-done:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink-3}"
  rail-ticket:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.ticket-title}"
    rounded: "{rounded.ticket}"
    padding: "20px 14px 18px"
    width: "228px"
  tag:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.inset}"
    padding: "0 7px"
    height: "22px"
  tag-fire:
    backgroundColor: "{colors.fire-soft}"
    textColor: "{colors.fire-ink}"
  tag-heat:
    backgroundColor: "{colors.heat-soft}"
    textColor: "{colors.heat}"
  tag-wait:
    backgroundColor: "{colors.wait-soft}"
    textColor: "{colors.wait}"
  tag-done:
    backgroundColor: "{colors.done-soft}"
    textColor: "{colors.done}"
  chip-filter:
    backgroundColor: "{colors.steel-raised}"
    textColor: "{colors.steel-ink}"
    rounded: "{rounded.pill}"
    padding: "0 6px 0 10px"
    height: "26px"
  nav-view:
    backgroundColor: "transparent"
    textColor: "{colors.steel-ink-2}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "36px"
  nav-view-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  segmented:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "2px"
    height: "30px"
  segmented-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.inset}"
  detail-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ticket}"
    width: "380px"
  auth-ticket:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ticket}"
    padding: "34px 32px 28px"
    width: "400px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "6px 6px 6px 14px"
    height: "40px"
  toast-error:
    backgroundColor: "{colors.fire-ink}"
    textColor: "#ffffff"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "26px 28px 24px"
    width: "440px"
  keycap:
    backgroundColor: "{colors.steel-raised}"
    textColor: "{colors.steel-ink-2}"
    typography: "{typography.keycap}"
    rounded: "{rounded.inset}"
    padding: "3px 5px"
---

# Design System: Demandas

## Overview

**Creative North Star: "The Kitchen Pass"**

Demands arrive like orders at a kitchen pass. Each one prints as a numbered ticket on thermal paper with its age running, hangs on a steel rail while it is being worked, and gets torn off when done. The application shell is the kitchen's brushed steel: a cool grey ground and a darker sidebar that never carry content of their own. Everything that *is* a demand, or is written onto one, is paper: off-white, near-black receipt ink, a 3px corner, a faint ticket shadow.

The density is that of an expediter's station: 48px rows, 6px between them, every row readable at a glance from the sequence number, title, due tag and elapsed age. Colour is rationed by heat. Fire red means urgent or overdue, heat-lamp amber means due today or aging, and everything else stays ink on paper or ink on steel. Numbers that measure something (ticket numbers, ages, counts, dates, keycaps) are set in JetBrains Mono; everything a person reads as language is Archivo.

The dark theme is the same kitchen after hours: blackened steel shell, tickets as dim warm paper (#2c2b29), inks lifted, fire and heat brightened so they still read as alarms.

**Key Characteristics:**
- Two materials, steel and paper, each with its own ink set.
- Numbered tickets with perforated (scalloped) edges where paper is torn from the printer.
- A steel rail that holds in-progress tickets; done tears the ticket off.
- Heat-coded colour: fire for burning, heat for warming, nothing else shouts.
- Monospaced measurement, grotesk language.
- Keyboard-first: keycaps are first-class, visible elements.

## Colors

A cool steel neutral family, a warm off-white paper family, and four status hues used only as small fills and text, never as surfaces.

### Primary
- **Receipt Ink** (ink): the primary action colour. Fills the primary button and the toast, draws focus outlines and selected-ticket outlines on paper. In dark mode it inverts to near-white so the primary button becomes a light slip on dim paper.
- **Fire Red** (fire, with fire-soft fill and fire-ink text): urgent and overdue only. Urgent priority marks, overdue group titles and ages, the "Hoje" count when something is burning, the capture-bar slot and text caret on focus, invalid fields, destructive hovers.

### Secondary
- **Heat-Lamp Amber** (heat, with heat-soft fill): due today, high priority, and aging tickets. The warning before fire.

### Tertiary
- **Pass Blue** (wait, wait-soft): "Aguardando", waiting on someone else. Tag fill and segmented-control selection only.
- **Cleared Green** (done, done-soft): finished work and the tick hover. Tag fill, tick, password-strength full.

### Neutral
- **Brushed Steel Ground** (steel-ground): the main board background.
- **Sidebar Steel** (steel-side): the sidebar and the top of the auth gradient.
- **Raised Steel** (steel-raised): keycaps and filter chips sitting on steel.
- **Steel Seam** (steel-line): sidebar border, chip and keycap strokes, empty-rail dashed outline, scrollbar thumbs.
- **Steel Ink / Steel Ink 2** (steel-ink, steel-ink-2): headings, nav labels and counts that sit directly on steel.
- **Rail Steel** (rail-mid, with rail-hi highlight): the rail bar itself.
- **Thermal Paper** (paper): every ticket, input, panel, menu, sheet and the active nav item.
- **Sunk Paper** (paper-sunk): neutral tags, done rows, segmented-control track, ghost hovers.
- **Paper Edge** (paper-edge): ticket borders and the dashed tear lines inside tickets.
- **Ink 2 / Ink 3** (ink-2, ink-3): secondary and tertiary text on paper; ink-3 also draws idle ticks and normal-priority marks.
- **Selection Amber** (select-bg): text selection highlight, a heat-lamp yellow.

### Named Rules
**The Two Inks Rule.** Paper carries receipt ink (ink, ink-2, ink-3); steel carries steel ink (steel-ink, steel-ink-2). A control that changes material changes ink with it: the search field is steel at rest and becomes paper with receipt ink on focus.

**The Heat Rule.** Fire marks what is burning (urgent, overdue), heat marks what is warming (due today, high priority, aging). Neither is ever a decorative accent, a brand colour, or a large surface; they appear as small marks, text, and soft tag fills.

**The Status Fill Rule.** Wait blue and done green appear only as tag fills, segmented selections and tick states. They never colour a ticket, a row, or a section.

## Typography

**Display Font:** Archivo (self-hosted variable, 100–900), with Segoe UI Variable Text, Segoe UI, system-ui fallback
**Body Font:** Archivo
**Label/Mono Font:** JetBrains Mono (self-hosted 400/500/600), with Cascadia Mono, Consolas fallback

**Character:** A sturdy, slightly condensed grotesk for language, a clean mono for anything that measures. The pairing reads like a printed kitchen ticket: words in the house face, numbers in the printer's face.

### Hierarchy
- **Display** (680, 22px, 1.2, -0.025em): the board heading ("Hoje", "Fila"), on steel.
- **Headline** (650, 21px, 1.25, -0.02em): auth ticket headings; sheet headings use the same voice at 18px.
- **Title** (640, 17px, 1.35, -0.012em): the editable demand title in the detail panel.
- **Ticket Title** (600, 14px, 1.35): rail ticket titles, clamped to three lines. Row titles use 540 at body size, single line with ellipsis.
- **Body** (400, 14px, 1.45): default UI text. Capture input is 14.5px.
- **Group Label** (620, 13px): section titles on the board ("Na mesa", "Atrasadas"), coloured fire or heat when the section is.
- **Label** (560, 12.5px): field labels, small buttons, chips. Hints and meta are 12px in ink-3.
- **Number** (JetBrains Mono 500, 12px, tabular): ages, counts, dates, the board date, ticket heads. **Number Strong** (600) for sequence numbers ("Nº 0031", "0033").
- **Keycap** (JetBrains Mono 500, 11px): keyboard shortcuts.

Archivo uses intermediate variable weights (520, 540, 560, 620, 640, 650, 680) rather than stepping 400/600/700; keep to the observed steps.

### Named Rules
**The Measurement Is Mono Rule.** Ticket numbers, elapsed ages, counts, dates, times and keycaps are JetBrains Mono with tabular figures. Words, including status and priority names, are never mono.

**The Honest Age Rule.** Every open ticket shows its elapsed age (5h, 1d, 40min) right-aligned in mono; it warms to heat and then fire as it ages.

## Layout

A fixed three-zone desktop workspace. The sidebar (236px) holds views with mono counts and a proportional share bar under each, then project filters, then the account. The main column has a 56px top bar (capture bar flexing, search 220px, right padding reserving 150px for the window controls), a capture preview strip that expands to 30px while typing, then the board. The detail panel (380px) docks to the right as a paper sheet with 8px/16px gutters when a ticket is selected.

The board is a single column padded 8px 24px 64px 20px. Today stacks the "Na mesa" rail (30px below it), then grouped sections 26px apart. Rows sit 6px apart; rail tickets 12px apart in a horizontally scrolling, snap-aligned track.

Spacing is a tight, mostly even rhythm: 2, 4, 6, 10, 14, 18, 22, 26px. Control heights are 30 (inset buttons, ticks), 36 (buttons, nav, search), 40 (capture, inputs, block buttons), 48 (rows).

Responsive: under 1180px the detail panel narrows to 340px. Under 980px the sidebar collapses to a 64px icon rail with counts beneath icons, project filters hide, search collapses to a 44px icon that expands to 200px on focus, and the detail panel floats over the board. Row tags drop by container width: project tags hide under 760px, all tags under 680px.

## Elevation & Depth

Depth is paper weight on steel. Steel is flat and shadowless; every paper surface carries a faint ticket shadow, and paper lifts further only when it is picked up (hover), floats (menus, toasts, sheets, detail panel), or is the one paper sheet on the login screen. Dark mode deepens the same two shadows.

### Shadow Vocabulary
- **Ticket** (`box-shadow: 0 1px 0 rgb(20 24 28 / 0.04), 0 2px 6px -2px rgb(20 24 28 / 0.14)`): resting paper: rows, rail tickets, capture bar, active nav item, segmented selection.
- **Lift** (`box-shadow: 0 2px 0 rgb(20 24 28 / 0.05), 0 10px 24px -10px rgb(20 24 28 / 0.32)`): hovered rows and rail tickets, detail panel, auth ticket, menus, toasts, sheets.
- **Rail bar** (`box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.25)`): the steel rail only, with a 1px rail-hi top highlight.

### Named Rules
**The Paper Weight Rule.** Only paper casts shadows, and only the two paper shadows exist. Hover lifts paper from Ticket to Lift; it never changes the paper colour.

## Shapes

Paper is nearly square (3px); controls are gently rounded (6px); things inside controls are 4px; filter chips are full pills (13px); avatars and ticks are circles. Paper edges that came off the printer are perforated: a 10px-pitch scallop of 3.5px half-circles cut by a CSS mask along the top (detail panel, auth ticket) or bottom (rail tickets). Inside a ticket, sections are separated by 1px dashed paper-edge tear lines (ticket head, detail head, detail meta, auth head). Priority marks are 8px squares with a 2px corner: filled fire, heat, or ink-3, or an outlined square for low.

## Components

### Buttons
Compact, inky, decisive.
- **Shape:** gently rounded (6px), 36px high, 14px side padding, weight 560, icon gap 8px.
- **Primary:** receipt ink fill with paper text. Hover mixes 14% fire into the ink. Disabled at 55% opacity.
- **Ghost:** transparent with a paper-edge stroke and ink-2 text; hover fills sunk paper.
- **Danger:** transparent, fire-ink text, a 35% fire stroke; hover fills fire-soft.
- **Press:** every button sinks 1px on active (120ms). Block buttons are 40px and full width. In-ticket buttons are 28px high, 12.5px text.
- **Icon button:** 30px square, ink-3 icon, sunk-paper hover; danger variant hovers to fire-soft.

### Chips
- **Tags:** 22px, 4px corner, 12px/500 text with a 12px Lucide icon, sunk-paper fill. Status variants use fire, heat, wait or done soft fills with matching text and icon.
- **Filter chip:** steel-raised pill (13px radius) with a steel-line stroke and a round clear button; it sits on steel, so it uses steel ink.

### Inputs / Fields
- **Style:** paper fill, paper-edge stroke, 6px corner, 40px (36px inside the detail panel), 12px padding. Labels sit above at 12.5px/560 in ink-2 with a 6px gap.
- **Focus:** stroke turns ink plus a 3px ink halo at 12%. No coloured focus.
- **Error:** fire stroke; form errors are a fire-soft banner with fire-ink text and an alert icon.
- **Password strength:** four 3px bars filling fire, heat, then done.

### Navigation
Sidebar views are 36px rows on steel: 18px icon, label, right-aligned mono count. Hover tints steel by 7% ink. The current view becomes a paper slip (paper fill, ticket shadow, receipt ink), so selection reads as "this ticket is pulled". A 2px share bar under each label shows that view's count proportionally; the Today bar turns fire when something is overdue or urgent. Project filters are 30px rows with a hash icon and mono count; pressed state is a 12% steel tint.

### Capture Bar (signature)
The printer slot. A paper field 40px high with the ticket shadow, a 12px ink-3 slot mark at its left edge, and an "Enter" keycap that fades in on focus. On focus the stroke becomes ink with the 3px halo, the slot mark widens to 16px and turns fire, and a preview strip below unfolds (160ms) to show parsed inline tokens (`!urgente`, `@pessoa`, `#projeto`, dates) as live tags in their heat colours.

### Ticket Rows
Dense paper strips, 48px minimum, 6px apart, 3px corner. Grid: a 30px round tick, a 58px sequence column (priority square plus mono number, fire when urgent), the title and tags, the due tag, and the mono age right-aligned. Hover lifts to the Lift shadow (160ms); selection is a 2px ink outline offset 1px. Done rows sink to paper-sunk with an ink-3 struck-through title.

### Rail Tickets (signature)
The "Na mesa" rail is a 12px steel bar (rail-mid with a rail-hi top edge and a soft drop) that overhangs the board by 8px each side; tickets hang from it in a horizontal snap-scrolling track. Each rail ticket is a 228px paper slip with a perforated bottom edge: a mono head ("Nº 0031" left in ink 600, age right in ink-3) over a dashed tear line, a three-line title, tags, and in-ticket Concluir (primary) and pause (ghost) buttons. Hover swings the ticket from its top edge (rotate -0.6deg, down 1px) and lifts it; selection is a 2px ink outline. An empty rail is a 112px dashed steel-line outline with a keycap hint.

### Segmented Controls
Status and priority pickers in the detail panel: a sunk-paper track with a paper-edge stroke and 2px inner padding; 30px segments, 4px corners, 12.5px/540 ink-2. The selected segment becomes a raised paper slip (paper fill, ticket shadow) whose text takes the option's heat or status colour (fire-ink for urgent, heat for high, wait, done).

### Detail Panel
A tall paper sheet (380px) perforated along its top edge, with the Lift shadow. The head is mono ("Nº 0033 · chegou há 9d") over a dashed tear line, with a "salvo" mono flash and icon buttons for delete and close. The body stacks the editable title, segmented controls, a two-column date/requester grid, project, notes (160px textarea), a full-width Concluir or Reabrir action, and a dashed-rule meta block of mono timestamps.

### Auth Ticket
Login, registration, recovery and reset are a single 400px paper ticket, perforated along the top, lifted, centred on a steel gradient (steel-side fading to steel-ground by 38%). The head carries the brand mark, name and a mono timestamp stamp over a dashed tear line. The recovery code is set in 17px/600 mono with 0.04em tracking in a sunk-paper box with a dashed ink-3 border.

### Toasts
Dark receipt slips: ink fill, paper text, 6px corner, Lift shadow, bottom-centred. They lead with the mono ticket number ("Nº 0033 anotada") and offer a translucent paper-tinted Desfazer button with its mono shortcut. Errors use fire-ink. Enter with the 180ms pop, leave with a 160ms fade and 6px drop.

### Sheets
Modal dialogs are 440px paper with a 6px corner, paper-edge stroke and Lift shadow over a 42% near-black backdrop; 18px/650 heading, 13.5px ink-2 lede, right-aligned actions. The shortcuts sheet is a two-column list of labels and sunk-paper keycaps.

### Keycaps
Mono 11px/500, 1px stroke with a 2px bottom stroke so the key reads as pressed-in plastic, 4px corner. On steel they use steel-raised and steel-line; on paper, sunk paper and paper-edge.

### Motion
One easing for everything: `cubic-bezier(0.16, 1, 0.3, 1)`. State transitions run 150ms (colour, border, focus halo), 160ms (row lift, preview strip, menu out), 180–200ms (toasts, sheets, rail ticket swing, slot width), 240ms (nav share bars). The **print** (280ms) reveals a new ticket top-down with a clip-path wipe and a 6px drop. The **tear** (260ms) rises 3px with a slight counter-rotation, then pulls 22px up, rotates -3deg, blurs 1px and fades. Reduced motion collapses all of it to 1ms.

## Do's and Don'ts

### Do:
- **Do** put every demand, field and floating surface on paper (paper fill, paper-edge stroke, 3px or 6px corner, ticket shadow) and leave the shell as flat steel.
- **Do** switch ink with material: receipt ink on paper, steel ink on steel, including focus outlines.
- **Do** set ticket numbers, ages, counts, dates and keycaps in JetBrains Mono with tabular figures, and prefix ticket numbers "Nº" on tickets, toasts and the detail head.
- **Do** separate sections inside a ticket with a 1px dashed paper-edge tear line, and perforate the edge a ticket was torn from.
- **Do** mark completion with the tear (260ms) and creation with the print (280ms), both on the shared ease-out curve.
- **Do** colour urgency by heat: fire for urgent and overdue, heat for due today, high priority and aging.
- **Do** show the keyboard shortcut as a keycap wherever an action has one.

### Don't:
- **Don't** use fire or heat as a brand accent, button fill or large surface; they are alarms.
- **Don't** colour a ticket or row background by status; status lives in tags, marks, ages and group titles.
- **Don't** add shadows to steel or invent a third paper shadow; paper is Ticket at rest and Lift when picked up.
- **Don't** set words (status names, labels, headings) in mono, or numbers that measure in Archivo.
- **Don't** round a ticket (row, rail ticket, detail panel, auth ticket) beyond 3px; the near-square corner is part of the material. Fields, menus, sheets and toasts take 6px.
