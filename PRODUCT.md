# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Rendered inside an Electron desktop window on Windows. Design language is the app's own, not native Windows controls.)

## Stack

Electron (user's choice), plain HTML/CSS/JS renderer, no framework. Data stored as an AES-256-GCM encrypted JSON file per account in the user's app data folder (chosen over SQLite to avoid native modules on Windows). Packaged for Windows with electron-builder.

## Users

A single technology professional (developer / IT analyst) using their own Windows computer. Throughout the workday, requests arrive from people, chats, meetings and tickets; they need to jot each one down in seconds, then see at a glance what is urgent, due today, overdue or blocked on someone else.

## Product Purpose

Capture daily work demands with zero bureaucracy and keep them visible until done. Success: a new demand is written in under five seconds from the keyboard, and the daily view answers "what do I do next?" without scrolling.

## Positioning

A personal, local-first, keyboard-first demand log, not a team project tool. No boards to configure, no mandatory fields: one line is a valid demand, and details (priority, due date, requester/project, status) are optional and can be typed inline.

## Operating Context

Used all day in a window next to an IDE, terminal, chat and email. Interruptions are constant; capture must not break focus. Data lives only on the machine.

## Capabilities and Constraints

- Local account with username and password: first-run registration, login, logout, change password. Passwords hashed (scrypt), never stored in plain text. Single user expected; additional local accounts are isolated if created.
- Demand fields: title (required), notes, priority (urgente, alta, normal, baixa), due date, requester/project, status (a fazer, fazendo, aguardando, feito).
- Runs fully offline. No cloud sync.
- Interface language: Brazilian Portuguese.

## Brand Commitments

Name: "Lumo" (renamed from the working name "Demandas"; the desktop data folder keeps the old name). Logo: rounded teal square with a white rounded "L" and an amber light dot; wordmark "lumo" in lowercase Figtree. Files: build/icon.svg, build/lumo-logo.png, build/lumo-logo-escuro.png. Note: Proton launched an AI assistant named Lumo in 2025; check trademark before any public distribution.

## Evidence on Hand

None. No sample data, testimonials or assets; do not fabricate.

## Product Principles

1. Capture first, organize later: a title alone is enough.
2. Keyboard before mouse: every frequent action has a shortcut.
3. Today is the default answer: overdue and due-today work surfaces first.
4. Private by default: data never leaves the machine.

## Accessibility & Inclusion

No specific requirement stated; meet WCAG AA contrast and full keyboard operation.
