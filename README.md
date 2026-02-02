# SmartSignDeck - Digital Signage Platform

SmartSignDeck is an intelligent ad scheduling and display platform built on a strict separation of **Layout** and **Content**.

## 🧠 Core Philosophy (Non-Negotiable)

We follow the **Template + Screen = Final Output** rule. Layout and content are never mixed in the database or the rendering logic.

### 1. Template (Design Layer)
Defines the "Skeletal" structure.
- **Scope**: Resolution, Zones, Positions (X, Y), Sizes (Width, Height).
- **Prohibition**: NO media files, NO text values, NO real content.
- **Storage**: `Template` MongoDB collection as purely structural JSON.

### 2. Screen (Content Layer)
Fills the "Skin" onto the template.
- **Scope**: Image URLs, Video URLs, Text body, Scheduling.
- **Prohibition**: NO positioning logic, NO dimensions.
- **Storage**: `Screen` MongoDB collection linking a `templateId` to a `content` map.

### 3. Screen Player (Playback Engine)
The final renderer.
- Fetches Template JSON + Screen JSON.
- Merges them dynamically.
- Renders using standard HTML5 `<video>`, `<img>`, and `<div>` elements.

## 🏗️ Technical Stack
- **Dashboard**: React (Vite, Tailwind, Shadcn UI)
- **Engine**: Node.js (Express, TypeScript, MongoDB)
- **Editor**: Fabric.js for the Canvas Layout Designer
- **Player**: Light-weight React client for screen-agnostic playback

## 📆 14-Day Roadmap
- **Week 1**: Foundation, Template Editor (Design), and Screen Manager (Content).
- **Week 2**: Playback Engine, Scheduling logic, and handles for fallback/offline states.
