<div align="center">

# SevaMitra

##  Live Demo

**<a href="https://seva-mitra-wheat.vercel.app/">View Live Site</a>**

> **Note:** The site is hosted on a free-tier backend, so the database may take 5–10 seconds to connect on first load. If data doesn't appear immediately, please **reload the page after 5 seconds**.

### Real-time Volunteer Management Platform for Mahakumbh 2025

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Groq LLaMA](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3%2070B-7C3AED)
![Hackathon Rank](https://img.shields.io/badge/Expert%20Hire%20Mahakumbh%20Hackathon-23rd%20Place-FF6B00)

<img src="./Screenshot%202026-07-13%20121659.png" alt="SevaMitra landing hero" width="100%" />

</div>

## About
SevaMitra is a mission-focused command platform that helps coordinators manage volunteer operations during high-density pilgrimage events like Mahakumbh. It brings live zone intelligence, incident workflows, and AI-assisted support into one unified interface.

<img src="./Screenshot%202026-07-13%20121722.png" alt="Landing carousel with sadhu visual" width="100%" />

## ✨ Features

| Feature | What it does |
|---|---|
| 🗺️ **Zone Map** | Interactive Leaflet.js map for Mahakumbh zone-level situational awareness. |
| 📈 **Zone Status** | Real-time zone capacity tracking with severity states: **Low / Medium / High / Critical**. |
| 🚨 **Incident Tracker** | Handles incidents like **Medical Emergency**, **Crowd Surge**, and **Lost Person** with deploy actions. |
| 👥 **Volunteer Directory** | Searchable volunteer roster with skills and reliability scores for smarter assignment. |
| 📡 **Live Feed** | Instant activity stream powered by Socket.io for synchronized operations. |
| 🤖 **SevaSahayak AI** | In-app Groq LLaMA 3.3 70B assistant with bilingual Hindi-English guidance (e.g., *Namaste*, *Kshama karein*, *Dhanyavaad*). |

## 🤖 SevaSahayak — AI in Action
SevaSahayak is an in-app operational assistant that responds to pilgrim and volunteer questions in real time, including crowd-aware route decisions and emergency support guidance.

| Crowd Avoidance Query | Nearest Medical Camp Query |
|---|---|
| <img src="./Screenshot%202026-07-13%20121913.png" alt="SevaSahayak crowd avoidance conversation" width="100%" /><br/><sub>SevaSahayak helps avoid high-density areas and suggests safer alternate routes.</sub> | <img src="./Screenshot%202026-07-13%20121938.png" alt="SevaSahayak nearest medical camp response" width="100%" /><br/><sub>SevaSahayak identifies nearest aid options with quick operational guidance.</sub> |

## 📊 Dashboards

| Zone Status Overview | Mahakumbh Zone Intelligence Map |
|---|---|
| <img src="./Screenshot%202026-07-13%20121736.png" alt="Zone status cards" width="100%" /><br/><sub>Dashboard cards provide immediate capacity risk visibility across zones.</sub> | <img src="./Screenshot%202026-07-13%20121753.png" alt="Interactive Mahakumbh zone map" width="100%" /><br/><sub>Leaflet-based map gives visual operational awareness by zone.</sub> |

## 🚨 Incident Tracker
<img src="./Screenshot%202026-07-13%20121805.png" alt="Incident tracker with active and resolved incidents" width="100%" />

<sub>Monitor and resolve operational incidents with deploy-ready workflows.</sub>

## 👥 Volunteer Directory
<img src="./Screenshot%202026-07-13%20121816.png" alt="Volunteer directory table" width="100%" />

<sub>Prioritize assignments using volunteer skill tags and reliability insights.</sub>

## 🧰 Tech Stack

| Layer | Tech | Purpose |
|---|---|---|
| Frontend | Next.js, React, Tailwind CSS | Responsive command UI and dashboard experience |
| Animations & UX | GSAP, Lenis | Smooth, immersive motion and scroll interactions |
| Mapping | Leaflet.js, React-Leaflet | Zone visualization and geospatial interaction |
| Backend | Node.js, Express | API services, orchestration, and business logic |
| Realtime | Socket.io | Live activity feed and instant state synchronization |
| Database | PostgreSQL, Prisma | Structured operational data and ORM access |
| AI Assistant | Groq API + LLaMA 3.3 70B | SevaSahayak conversational intelligence |

## 🏗️ Architecture

<details>
<summary><strong>Expand architecture flow</strong></summary>

```text
Frontend (Next.js)
  ├─ Live UI updates ↔ Socket.io channel
  ├─ REST requests ───────────▶ Backend (Node/Express)
  │                              ├─ Prisma ORM ─────────▶ PostgreSQL
  │                              └─ AI route ───────────▶ Groq LLaMA 3.3 70B
  └─ Leaflet zone map rendering with backend-fed zone/incident data
```

</details>

## 🚀 Getting Started

```bash
git clone https://github.com/devaskswhy/SevaMitra.git
cd SevaMitra
```

```bash
# Install root dependencies
npm install

# Install app dependencies
cd apps/api && npm install
cd ../web && npm install
cd ../..
```

```bash
# Environment setup
cp .env.example .env
# TODO: Confirm if app-specific .env files are also required in apps/api and apps/web
# TODO: Add Groq API key variable name and setup example
```

```bash
# Optional infra (if using local containers)
docker-compose up -d
```

```bash
# Prisma generation and migrations (from repository root)
npx prisma generate --schema=./prisma/schema.prisma
# TODO: Confirm canonical migration command for first-time setup
```

```bash
# Run backend
cd apps/api
npm run dev
```

```bash
# Run frontend (new terminal)
cd apps/web
npm run dev
```

## 🛣️ Roadmap
- Ongoing migration to stable free-tier hosting stack:
  - **Backend:** Render
  - **Database:** Neon
  - **Realtime/cache:** Upstash
  - **Frontend:** Vercel
- Harden production observability and incident analytics.
- Expand multilingual support and voice-assisted SevaSahayak flows.

---

<div align="center">

![Hackathon](https://img.shields.io/badge/Expert%20Hire%20Mahakumbh%20Hackathon-23rd%20Place-FF6B00)

**Made with 🧡 for Mahakumbh 2025**  
If this project inspires you, please consider giving it a ⭐

</div>
