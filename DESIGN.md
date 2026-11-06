---
name: Lumo
description: A personal, local-first, keyboard-first demand log. Clean, quiet surfaces where content and state carry the screen.
colors:
  accent: "#17806f"
  accent-strong: "#106456"
  accent-soft: "#e0f1ed"
  on-accent: "#ffffff"
  bg: "#eef2f0"
  panel: "#f7f9f8"
  surface: "#ffffff"
  surface-2: "#edf1ef"
  line: "#e1e7e4"
  line-strong: "#cfd8d4"
  text: "#13201c"
  text-2: "#475651"
  text-3: "#66756f"
  danger: "#d4483f"
  danger-text: "#b0322a"
  danger-soft: "#fbebe9"
  warn: "#df9a33"
  warn-text: "#8f560c"
  warn-soft: "#fbf1e0"
  info: "#4b6ac4"
  info-text: "#3a54a2"
  info-soft: "#ecf0fb"
  success: "#2f9862"
  success-text: "#1e7247"
  success-soft: "#e4f3ea"
  dark-accent: "#35b39e"
  dark-accent-strong: "#67d2bf"
  dark-accent-soft: "#10302a"
  dark-on-accent: "#052019"
  dark-bg: "#0d1211"
  dark-panel: "#121817"
  dark-surface: "#18201e"
  dark-surface-2: "#1f2826"
  dark-line: "#25302d"
  dark-line-strong: "#33413d"
  dark-text: "#e6eeeb"
  dark-text-2: "#aab8b3"
  dark-text-3: "#86948f"
  dark-danger: "#f2655c"
  dark-danger-text: "#ff8a82"
  dark-danger-soft: "#3a1714"
  dark-warn: "#eeb04f"
  dark-warn-text: "#f1b75c"
  dark-warn-soft: "#35270f"
  dark-info: "#85a0f0"
  dark-info-text: "#a2b7f6"
  dark-info-soft: "#19223d"
  dark-success: "#4cc187"
  dark-success-text: "#63d29b"
  dark-success-soft: "#12301f"
  brand-amber: "#ffd36e"
  brand-teal-light: "#1f9a86"
typography:
  headline:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  headline-sm:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  title:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.015em"
    fontFeature: "tnum"
  wordmark:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 720
    lineHeight: 1
    letterSpacing: "-0.035em"
  item:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 550
    lineHeight: 1.4
    fontFeature: "tnum"
  body:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  control:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.5
    fontFeature: "tnum"
  meta:
    fontFamily: "Figtree, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.5
    fontFeature: "tnum"
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  group: "22px"
  board-x: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-2}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger-text}"
    rounded: "{rounded.md}"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  capture-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    height: "42px"
  search-field:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.md}"
    height: "38px"
    width: "220px"
  theme-toggle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.md}"
    size: "38px"
  view-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "38px"
  view-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  count-badge:
    textColor: "{colors.text-3}"
    typography: "{typography.meta}"
    rounded: "10px"
    height: "20px"
  count-badge-hot:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-text}"
  tag:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
    rounded: "12px"
    padding: "0 9px"
    height: "24px"
  tag-fire:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-text}"
  tag-heat:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.warn-text}"
  tag-wait:
    backgroundColor: "{colors.info-soft}"
    textColor: "{colors.info-text}"
  tag-done:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-text}"
  filter-chip:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-strong}"
    rounded: "14px"
    height: "28px"
  progress-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "13px 14px 14px"
  rows-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  row:
    backgroundColor: "transparent"
    typography: "{typography.item}"
    padding: "5px 16px 5px 12px"
    height: "44px"
  row-selected:
    backgroundColor: "{colors.accent-soft}"
  checkbox:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    size: "18px"
  checkbox-checked:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  board-panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.xl}"
    padding: "8px 28px 64px"
  detail-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    width: "384px"
  segmented:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.md}"
    padding: "3px"
  ai-pill:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-strong}"
    typography: "{typography.label}"
    rounded: "13px"
    padding: "0 10px"
    height: "26px"
  ai-box:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  ai-box-quiet:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
  menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "6px"
  menu-item:
    rounded: "{rounded.sm}"
    padding: "0 14px 0 10px"
    height: "36px"
  toast:
    backgroundColor: "{colors.text}"
    textColor: "{colors.bg}"
    rounded: "{rounded.lg}"
    padding: "6px 6px 6px 16px"
  toast-error:
    backgroundColor: "{colors.danger-text}"
    textColor: "#ffffff"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "28px 28px 24px"
    width: "440px"
  auth-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "32px 32px 28px"
    width: "400px"
  avatar:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-strong}"
    rounded: "{rounded.pill}"
    size: "28px"
---

# Design System: Lumo

## Overview

**Creative North Star: "The Quiet Desk"**

Lumo is a clean, minimalist workspace that recedes so the demands and their state carry the screen. A tinted, almost-white ground holds white surfaces drawn with 1px hairlines, softly rounded corners and shallow two-layer shadows. One pine-teal accent marks what the user can act on, what is selected, what has focus and what is in progress; red, amber, blue and green appear only where they mean something (overdue, due today or high, waiting, done). Everything else is a teal-leaning gray.

Density is calm-dense: a 1280x820 window holds the sidebar, the capture field, the in-progress cards and the overdue / due-today / urgent groups without scrolling. Groups are single rounded containers with hairline-divided rows, not stacks of floating cards. Type is Figtree alone, with tabular numerals everywhere so counts, sequence numbers and ages align. Icons are Lucide line icons at a 1.6 stroke, inline SVG in `currentColor`.

Motion is short and purposeful: completing a demand fills the round checkbox with the accent and the row slides out (260ms); a new demand arrives with a soft accent ring (320ms); everything else is a 160-200ms state change on one ease-out curve. Lumo ships a light and a dark theme with an explicit toggle; both are complete token sets.

**Key Characteristics:**
- Tinted neutral ground (pine-teal leaning grays), white surfaces, 1px hairlines.
- One accent: pine teal for action, selection, focus and in-progress.
- Status color reserved for meaning: red overdue/urgent, amber due-today/high, blue waiting, green done.
- Figtree only, tabular numerals on by default.
- Four radii (8/10/14/18px) plus full pills and circles for chips, badges and checkboxes.
- Soft two-layer shadows, hairline first.
- Light and dark themes, user-selectable, following the system until chosen.

## Colors

A cool, teal-tinted neutral field with a single pine-teal voice and four semantic status hues. Every color has a light and a dark value; dark tokens are prefixed `dark-` in the frontmatter and map one-to-one onto the same CSS custom properties (`--accent`, `--bg`, `--danger-soft`...).

### Primary
- **Pine Teal** (`accent`): primary buttons, the focused capture field border and plus glyph, the current view's icon, the round checkbox when checked, the in-progress dot on cards, focus outlines and the 3px focus ring (22% teal). It is also the logo's ground color, so brand and action share one hue.
- **Deep Pine** (`accent-strong`): hover state of primary buttons, accent text on soft teal fills (filter chips, avatar initial, AI pill, token syntax in the capture help).
- **Teal Mist** (`accent-soft`): selected row fill, pressed project filter, avatar disc, AI suggestion box and pill, empty-state icon tile.
- **On Accent** (`on-accent`): text and check marks on Pine Teal. In dark mode this flips to a near-black teal because the dark accent is light.

### Status (meaning only)
- **Overdue Red** (`danger`, `danger-text`, `danger-soft`): overdue groups and due chips, the urgent priority dot, the hot count badge on Hoje, form errors, destructive actions, error toasts.
- **Due-Today Amber** (`warn`, `warn-text`, `warn-soft`): the due-today group, due-today chips, the high priority dot, medium password strength.
- **Waiting Blue** (`info`, `info-text`, `info-soft`): the waiting status chip and the waiting segment in the detail panel. Nothing else.
- **Done Green** (`success`, `success-text`, `success-soft`): done chips and segment, the "salvo" confirmation, strong password strength.

Each status hue has three steps: a saturated dot color, an AA text color, and a soft fill. Text on a soft fill always uses the matching `-text` step.

### Neutral
- **Mist Ground** (`bg`): the window ground behind the sidebar and topbar; the auth screen ground.
- **Pale Panel** (`panel`): the large rounded board panel that holds the day's content.
- **White Surface** (`surface`): cards, row containers, inputs, menus, sheets, the detail panel, the auth card.
- **Soft Fill** (`surface-2`): neutral chips, count badges, segmented control track, skeletons, recovery code well.
- **Hairline** (`line`) and **Strong Hairline** (`line-strong`): 1px borders and row dividers; strong for inputs, the unchecked checkbox ring and scrollbar thumbs.
- **Ink** (`text`), **Slate Ink** (`text-2`), **Quiet Ink** (`text-3`): primary text, secondary text and labels, metadata and icons at rest.
- Hover and press washes are translucent ink (4.5% and 8% in light, 5% and 9% in dark), never a separate gray.

### Brand
- **Lumo Teal** (`accent`) is the logo square; the app icon adds a soft gradient from `brand-teal-light` to `accent-strong`.
- **Light Amber** (`brand-amber`): the logo's light dot only. It is a brand color, not a UI status color; amber in the interface is `warn`.

### Named Rules
**The One Teal Rule.** Pine teal is the only accent. It marks primary action, selection, focus, in-progress and completion; it never decorates a heading, a divider or an empty area.

**The Meaning-Only Rule.** Red, amber, blue and green appear only when a demand is overdue/urgent, due today/high, waiting or done. A status color without a status behind it is a bug.

**The Tinted Neutral Rule.** Every gray leans toward the accent hue (hue around 160). Stock zinc, slate or pure-gray neutrals do not belong in Lumo.

## Typography

**Display Font:** Figtree (with Segoe UI Variable Text, Segoe UI, system-ui)
**Body Font:** Figtree
**Label/Mono Font:** Figtree (keyboard hints, counts, codes and the recovery code are all Figtree)

**Character:** A friendly geometric grotesque used at a narrow weight band (400 to 720) with fine steps (550, 650) instead of size jumps. Headings tighten tracking slightly; small text never goes uppercase. Figtree is bundled as a variable woff2 (weights 300-900, latin and latin-ext) with `font-display: block` so the UI never flashes a fallback.

### Hierarchy
- **Headline** (700, 24px, 1.2, -0.025em): the board title (Hoje, Fila, Aguardando, Feitas), followed by the date in Quiet Ink.
- **Headline Small** (700, 22px, 1.25, -0.02em): the auth card heading. Sheet headings use 700 at 19px.
- **Title** (700, 18px, 1.35, -0.015em): the editable demand title in the detail panel. Empty-state headings use 650 at 17px.
- **Wordmark** (720, 18px, -0.035em): "lumo", lowercase, next to the logo mark.
- **Item** (550-600, 14.5px, 1.4): demand titles in rows and in-progress cards (600 on cards), and the capture input.
- **Body** (400, 14px, 1.5): base text, ledes, notes (1.6 line height in notes and AI text).
- **Control** (600, 13.5px): buttons; menu items and project filters use 500 at the same size.
- **Label** (600, 12.5px): field labels, tags and chips (550), the AI pill, group hints (450).
- **Meta** (600, 12px): sequence numbers, count badges, card headers, section titles such as "Projetos". Group titles sit between label and meta at 650, 13px.

### Named Rules
**The One Family Rule.** Figtree sets everything, including keyboard hints and codes. Hierarchy comes from weight and a 1-2px size step, not from a second family.

**The Tabular Rule.** `font-variant-numeric: tabular-nums` is set on the document; counts, sequence numbers (#31), ages (5h, 2d) and dates line up in columns.

## Layout

The workspace is a two-column grid: a 248px sidebar on the ground, and a main column with a 60px topbar (capture field, search, theme toggle) above a single rounded board panel. The board panel is inset 8px from the window edge on the right and bottom and scrolls internally with 8px 28px 64px padding. The detail panel opens inside the board panel as a floating 384px card on the right, inset 10px.

Vertical rhythm: groups and the in-progress rail are separated by 22px; a group title sits 10px above its container; the board head sits 20px below the top and 16px above content. In-progress cards flow in a horizontal, snap-scrolling track of 240-280px columns with a 12px gap. Rows are 44px minimum.

In the desktop build the topbar reserves 150px on the right for the Windows title bar controls and the topbar and sidebar header are drag regions.

### Responsive behavior
- **≤1180px:** detail panel narrows to 344px; row gaps tighten to 8px.
- **≤980px:** the sidebar collapses to a 68px icon rail (brand name, view labels, project list and account name hidden; counts sit under the icons). Projects move into a popover opened from a Projetos rail button. Search collapses to a 42px icon field that expands to 200px on focus. The detail panel overlays the board.
- **≤560px:** group hints are hidden.
- **Touch (`hover: none`):** in-progress card actions are always visible and flow in the card instead of appearing on hover.
- **Container queries** on the board (`container-type: inline-size`): under 880px rows drop the project tag; under 700px rows drop all tags, keeping checkbox, priority dot, sequence, title, due chip and age.

## Elevation & Depth

Hybrid, hairline first. Every surface is drawn by a 1px hairline and a tinted value step (ground, panel, surface); shadows are soft, two-layer and shallow, tinted with the ink color in light mode and pure black in dark mode. Lift is reserved for floating things and for hover.

### Shadow Vocabulary
- **Rest** (`--sh-1`: `0 1px 2px rgb(19 32 28 / 0.05)`): cards, row containers, capture field, active view item, theme toggle.
- **Lift** (`--sh-2`: `0 1px 2px rgb(19 32 28 / 0.05), 0 8px 22px -12px rgb(19 32 28 / 0.18)`): in-progress card on hover, the detail panel.
- **Float** (`--sh-3`: `0 2px 6px rgb(19 32 28 / 0.06), 0 20px 50px -18px rgb(19 32 28 / 0.28)`): account menu, projects popover, toasts, sheets, the auth card.
- **Focus Ring** (`--ring`: `0 0 0 3px` of accent at 22%): focused inputs, capture field, search, selected in-progress card. Keyboard focus elsewhere is a 2px accent outline offset 2px.
- Dark mode uses the same three roles with black shadows at 0.3-0.75 alpha.

### Named Rules
**The Hairline-First Rule.** Separate with a 1px hairline and a value step before reaching for shadow. Rows inside a container are divided by hairlines, never by gaps and per-row shadows.

**The Float-Only-When-Floating Rule.** The Float shadow belongs to things above the page (menus, toasts, sheets, the auth card). Content at rest takes Rest; Lift is a response to hover or to the detail panel's open state.

## Shapes

Soft, consistent corners from a four-step scale: 8px (small controls: menu items, icon buttons, card action buttons, the password reveal), 10px (buttons, inputs, view items, segmented control, AI box), 14px (cards, row containers, capture field, menus, toasts, the detail panel), 18px (the board panel, sheets, the auth card). Chips, count badges, filter chips and the AI pill are full pills (half their height: 12, 10, 14, 13px). The checkbox, avatar and priority/in-progress dots are circles. Keyboard hints (6px) and segmented buttons (7px inside a 10px track) are the only off-scale radii, nested inside larger shapes.

Borders are 1px hairlines throughout; the checkbox ring is 1.6px; the empty in-progress state is the only dashed border (1.5px, Strong Hairline). Long chip rows in cards fade out at the right edge with a gradient mask instead of wrapping.

### Named Rules
**The Four Radii Rule.** Corners come from 8/10/14/18px, pills and circles. Nesting steps down: an 18px panel holds 14px containers, which hold 10px and 8px controls.

## Components

### Buttons
- **Shape:** gently rounded (10px), 36px tall, 14px horizontal padding, 600 weight at 13.5px, icon gap 8px.
- **Primary:** Pine Teal fill, On Accent text, a faint teal-tinted 1px shadow. Hover deepens to Deep Pine.
- **Ghost:** White Surface with a hairline border and Slate Ink text; hover moves to Soft Fill and Ink.
- **Danger:** transparent with red text and a hairline border; hover fills Overdue Red soft.
- **Block:** full width, 42px, 14px text (auth forms).
- **Press:** scales to 0.98 (120ms). Disabled primary drops to 50% opacity. Loading shows a 14px spinning ring in `currentColor`.
- **Icon button:** 32px square, 8px radius, Quiet Ink, hover wash; the danger variant hovers red.
- **Link:** unstyled Quiet Ink text, 500 at 13px, hover Deep Pine.

### Theme Toggle
A 38px square White Surface button with a hairline border, 10px radius and Rest shadow, holding an 18px Lucide moon (in light) or sun (in dark). It sits at the right of the topbar and fixed at the top right of the auth screen. Clicking flips the effective theme and stores the choice; hover darkens the icon and border.

Theming is explicit: `:root[data-theme="dark"]` applies the dark set, `:root[data-theme="light"]` pins light, and with no attribute the system preference decides through `prefers-color-scheme`. The choice persists in local storage (`lumo-theme`), is passed to the desktop shell so the native title bar matches, and the toggle repaints when the host page changes `data-theme` (the claude.ai build).

### Sidebar Views and Count Badges
- **View item:** 38px rows with an 18px icon, label (550) and a count, 10px radius, Slate Ink. Hover adds the translucent wash. The current view becomes a White Surface pill with Rest shadow plus a hairline ring, Ink text, and a Pine Teal icon.
- **Views:** Hoje (sun), Fila (list-todo), Aguardando (clock), Feitas (circle-check), shortcuts Ctrl 1-4.
- **Count badge:** 20px pill, 12px/600 Quiet Ink, hidden when empty. On Hoje, when anything is overdue, the badge turns hot: Overdue Red soft fill with red text.
- **Projects:** a "Projetos" section title (12px/600 Quiet Ink, sentence case) above 34px filter items with a hash icon and count; the pressed project fills Teal Mist with Deep Pine text.
- **Account:** a 44px button at the sidebar foot with a 28px Teal Mist avatar initial, the username and a settings icon.

### Capture Field with Live Token Chips
The signature input. A 42px White Surface bar with a hairline border, 14px radius and Rest shadow, led by an 18px plus glyph in Quiet Ink. On focus the border, glyph and ring turn Pine Teal and an "Enter" keyboard hint fades in on the right. Below it, a preview strip opens (to 30px): empty, it lists the inline syntax with tokens in Deep Pine (`!urgente`, `@pessoa`, `#projeto`, dates, `~aguardando`); while typing, each recognized token renders as a live chip using the same tag styles as rows (urgente red, alta amber, aguardando blue, others neutral).

Search sits beside it: a 38px, 220px translucent-wash field with a search icon and a Ctrl F hint that becomes a White Surface with teal border and ring on focus.

### Chips and Tags
- **Tag:** 24px pill, Soft Fill, Slate Ink at 12.5px/550, 13px leading icon in Quiet Ink (user, hash, calendar, hourglass, play), truncated at 170px.
- **Status tags:** fire (red), heat (amber), wait (blue), done (green), each soft fill with its text step; icons take the text color.
- **Filter chip:** 28px Teal Mist pill with Deep Pine text and a round 20px remove button, shown beside the board title.

### In-Progress Cards
White Surface cards (14px radius, hairline, Rest shadow, 13px 14px 14px padding) in a horizontal snap track under "Em andamento". Header: a 7px Pine Teal dot with a 3px Teal Mist halo, the sequence number, and the age on the right. Title: 600 at 14.5px, clamped to two lines. Meta: priority, due and person/project tags in one row that fades out at the right edge.

Hover lifts the card 1px with the Lift shadow (200ms) and reveals the actions in the top right, replacing the age: a 28px primary "Concluir" button with a check-check icon and a 28px square ghost pause button (8px radius). Selected cards take a teal border and the focus ring and keep the actions visible. On touch the actions are always shown. The empty state is a dashed 14px box with a keyboard hint.

### Grouped List Containers and Rows
- **Group title:** 13px/650 Slate Ink with a 20px count pill; overdue groups ("Atrasadas") and urgent groups turn red, due-today ("Vencem hoje") turns amber; an optional right-aligned hint at 12.5px/450.
- **Container:** one White Surface box per group with a hairline border, 14px radius, Rest shadow, clipped corners.
- **Row:** 44px minimum, a grid of checkbox, priority dot plus sequence, title with tags, due chip, and age. Rows are divided by 1px hairlines. Hover adds the wash; selected rows fill Teal Mist with a 2px inset teal bar on the left. Done rows grey out with a strike in Strong Hairline.
- **Priority dot:** 7px circle: urgente red with a soft halo, alta amber with a soft halo, normal Strong Hairline, baixa an empty ring.
- **Age:** right-aligned 12.5px Quiet Ink; stale items become Slate Ink 650.

### Round Checkbox
A 28px hit target holding an 18px circle with a 1.6px Strong Hairline ring on White Surface. Hover turns the ring teal and previews a faint teal check. Checked fills the circle with Pine Teal and shows a white check (2.6 stroke). Completing then plays the finish animation: the row fades and slides 14px right while scaling to 0.985 over 260ms.

### Detail Panel
A floating White Surface card (14px radius, Lift shadow, 384px, inset 10px inside the board panel). Header: sequence number and 32px icon buttons. Body (20px sides, 18px gaps): the editable title (18px/700, transparent until hover wash or focus, focus adds teal border and ring), segmented controls for priority and status (Soft Fill track, 3px padding, selected segment raised to White Surface with Rest shadow and colored by meaning: urgente red, alta amber, fazendo teal, aguardando blue, feito green), a two-column grid of 38px fields (due date with a masked calendar icon that turns teal on hover, requester/project), the notes textarea (150px minimum, 1.6 line height), a hairline-topped meta list, and full-width 40px action buttons.

### AI Writing Suggestion
- **"Melhorar escrita" pill:** a 26px Teal Mist pill with Deep Pine text at 12.5px/600 and a 14px sparkles icon, sitting to the right of the Anotações label. Hover deepens the fill (18% accent mixed in); disabled is 50% opacity.
- **Suggestion box:** below the notes, a 10px-radius Teal Mist box with a 30% teal hairline, 12px 14px padding, popping in over 200ms. Head: sparkles icon and "Sugestão de escrita" in Deep Pine 12.5px/650. Text: 13.5px/1.6 Ink, pre-wrapped. Actions: a 32px primary "Aplicar" and a ghost "Ignorar".
- **Working state:** a 13px spinning ring with "Revisando…" and a "Parar" link.
- **Quiet state:** for "nothing to change" and errors, the box drops to Soft Fill with a hairline and Slate Ink head.
- An opt-in checkbox below the notes controls automatic review.

### Account Menu
A White Surface popover (14px radius, hairline, Float shadow, 6px padding) opening upward from the account button, sized to its content (up to 320px). Items are 36px rows with a 16px Quiet Ink icon, 13.5px/500 label and an optional right-aligned keyboard hint; hover and keyboard focus use the wash. Groups are split by inset hairlines; a small Quiet Ink meta line can head the menu. It pops in over 180ms (fade, 4px rise, 0.98 scale). The narrow-width projects popover uses the same menu shell beside the icon rail.

### Toasts
Bottom-center, inverted: an Ink bar (14px radius, Float shadow) with Ground-colored text at 13.5px/500, up to three stacked. A leading sequence number at 70% opacity, then the message, then 30px action buttons on a translucent ground-tinted fill ("Ver", "Desfazer Ctrl Z"). Error toasts use the red text color as their fill with white text. They pop in over 200ms and leave over 160ms (fade and 6px drop); normal toasts stay 4.5s, errors 6s.

### Sheets
Native dialogs: White Surface, 18px radius, hairline, Float shadow, up to 440px wide, 28px padding, popping in over 200ms over a 35% dark scrim with a 2px blur. Heading 19px/700, lede in Slate Ink, actions right-aligned with 8px gaps. Used for the shortcut list, change password and recovery code.

### Auth Card
A centered White Surface card on the Mist Ground: 400px, 18px radius, Float shadow, 32px 32px 28px padding. It opens with the logo mark and the lowercase wordmark, then a 22px/700 heading, a Slate Ink lede, fields and a block primary button; a small Quiet Ink line below the card states that data stays on the machine. The theme toggle floats at the top right.

- **Inputs:** 40px, White Surface, Strong Hairline border, 10px radius; hover darkens the border, focus turns it teal with the ring; invalid turns it red. Labels 12.5px/600 Slate Ink; hints 12px Quiet Ink.
- **Masked username:** the username field renders typed characters as discs like a password (with slight letter spacing), while the placeholder stays readable. A 30px eye button inside the field reveals or re-masks it, same as the password field.
- **Form error:** an Overdue Red soft banner with red text and a leading alert icon.
- **Password strength:** four 4px segments filling red, amber, then green.
- **Recovery code:** a Soft Fill well, 14px radius, 650 at 17px with 0.08em tracking, select-all.

### Brand
- **Logo mark:** a rounded teal square (corner radius one quarter of its side, 116/464) carrying a thick white rounded "L" (stroke with round caps and joins) and an amber light dot at the top right of the L. The in-app mark (`src/renderer/assets/mark.svg`) is flat Lumo Teal; the app icon (`build/icon.svg`) adds a teal gradient and a soft amber glow behind the dot. Rendered at 22px beside the wordmark.
- **Wordmark:** "lumo", always lowercase, Figtree 720 at 18px with -0.035em tracking, in Ink, 10px from the mark.
- **Lockups:** `build/lumo-logo.png` for light grounds, `build/lumo-logo-escuro.png` for dark grounds.

### Motion
One curve, `cubic-bezier(0.22, 1, 0.36, 1)` (a soft ease-out), for everything.
- **State transitions:** 160ms for color, border and shadow changes; 200ms for card lift, checkbox fill, search width and strength bars; 120ms for button press.
- **Pop in:** 180-200ms fade, 4px rise and 0.98 scale for menus, toasts, sheets and the AI box.
- **Finish (260ms):** completing a row or card fades it and slides it 14px right at 0.985 scale.
- **Arrive (320ms):** a new demand drops in from 6px above at 0.99 scale with the accent focus ring fading out.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, all animations and transitions collapse to 1ms.

## Do's and Don'ts

### Do:
- **Do** use Pine Teal for the one primary action on a surface, the selection, focus and in-progress state, and nothing else.
- **Do** pair every status fill with its own text step (`danger-soft` with `danger-text`, and so on) so chips stay AA in both themes.
- **Do** group lists as one rounded container (14px) with 1px hairline rows.
- **Do** set every value from tokens so both themes stay complete: a new color needs a light and a dark value under `:root` and `[data-theme="dark"]`.
- **Do** use Lucide icons as inline SVG at a 1.6 stroke in `currentColor`, 16px by default, 12-14px inside chips and small buttons, 18px in navigation.
- **Do** keep numbers tabular and keyboard hints visible next to the actions they trigger.
- **Do** honor reduced motion and keep the finish (260ms) and arrive (320ms) moments as the only expressive motion.

### Don't:
- **Don't** use red, amber, blue or green for decoration, categories or emphasis; they mean overdue/urgent, due-today/high, waiting and done.
- **Don't** introduce untinted grays, a second accent, or the logo's amber as a UI color.
- **Don't** add a second typeface or monospace for codes and shortcuts; Figtree sets everything.
- **Don't** use radii outside 8/10/14/18px, pills and circles for new surfaces.
- **Don't** put the Float shadow on content at rest or stack per-row shadows inside a group container.
- **Don't** write the wordmark capitalized or recolor the logo mark.
