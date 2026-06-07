# SevaMitra - 5-Minute Demo Script for Hackathon Judges

## Prerequisites
- API server running on http://localhost:4000
- Web application running on http://localhost:3000
- Demo reset endpoint: `GET/POST http://localhost:4000/api/demo/reset`

## Demo Setup (1 minute)

### 1. Reset Demo Data
```bash
curl -X POST http://localhost:4000/api/demo/reset
```

This will:
- Clear all assignments and incidents
- Create 1 active severity-4 incident at "Triveni Sangam" zone
- Set 2 zones to 85% capacity (amber warning)
- Create 3 pending assignments

### 2. Open Applications
- Open http://localhost:3000/dashboard in browser
- Open http://localhost:4000/api/health in another tab to confirm API is running

---

## Demo Script (5 minutes)

### Minute 1: Introduction & Dashboard Overview (1:00)

**Speaker Notes:**
"Welcome to SevaMitra - a real-time volunteer management system for Mahakumbh, designed to handle over 10,000 volunteers across 20+ zones."

**Actions:**
- Show the Operations Dashboard at http://localhost:3000/dashboard
- Highlight the dark theme with orange/saffron branding
- Point out the live indicator (pulsing orange dot)

**Key Features to Show:**
1. **Top Metrics Bar** (4 cards)
   - Total Active Volunteers
   - Zones at >80% capacity (should show 2 after reset)
   - Open Incidents (should show 1 severity-4 incident)
   - Pending Assignments (should show 3)

---

### Minute 2: Zone Status Monitoring (1:00)

**Speaker Notes:**
"Our system provides real-time zone capacity monitoring with color-coded alerts."

**Actions:**
- Scroll to "Zone Status Overview" section
- Show the grid of zone cards
- Point out the 2 zones at 85% capacity (amber/red indicators)
- Hover over a zone to show the capacity bar animation

**Key Features to Show:**
1. **Zone Cards** displaying:
   - Zone name and type (GHAT, GATE, MEDICAL)
   - Current load vs max capacity
   - Color-coded indicators (green <50%, amber 50-80%, red >80%)
   - Priority level (HIGH/MEDIUM/LOW)

2. **Zone Capacity Chart** (Recharts bar chart)
   - Visual comparison of current load vs max capacity
   - Orange bars for current, saffron for max capacity

---

### Minute 3: Incident Management (1:00)

**Speaker Notes:**
"When incidents occur, our system enables rapid response with one-click volunteer deployment."

**Actions:**
- Scroll to "Active Incidents" section
- Show the severity-4 incident at Triveni Sangam
- Click "Deploy Volunteers" button
- Watch the activity feed update in real-time

**Key Features to Show:**
1. **Incident List** with:
   - Severity badges (CRITICAL/HIGH/MEDIUM/LOW)
   - Incident type and description
   - One-click "Deploy Volunteers" button

2. **Live Activity Feed** (right sidebar)
   - Real-time updates via Socket.io
   - Color-coded by type (warning=orange, success=green, info=blue)
   - Timestamps for each activity

---

### Minute 4: Smart Volunteer Allocation (1:00)

**Speaker Notes:**
"Our AI-powered allocation system matches volunteers to tasks based on skills, availability, and distance."

**Actions:**
- Scroll to "Quick Volunteer Allocation" section
- Select a task from dropdown (e.g., "Route Guidance - Task 1")
- Click "Find Best Volunteers" button
- Show top 5 recommendations with score breakdown

**Key Features to Show:**
1. **Task Selection** dropdown
2. **Volunteer Recommendations** showing:
   - Volunteer name and overall score
   - Skill match percentage
   - Availability percentage
   - Distance in km

---

### Minute 5: Mobile Volunteer App (1:00)

**Speaker Notes:**
"Volunteers can access their assignments and report incidents through our mobile-optimized PWA."

**Actions:**
- Open http://localhost:3000/volunteer in mobile view (or use browser DevTools mobile mode)
- Show the login page with phone number input
- Enter phone: `6223617590` (from demo data)
- Enter any 6-digit OTP (mock authentication)
- Navigate to Home page to show current assignment
- Navigate to Report page to show incident reporting form
- Navigate to Profile page to show volunteer stats

**Key Features to Show:**
1. **Login Page** - Phone number + mock OTP
2. **Home Page** - Current assignment, next shift, check-in/out
3. **Report Page** - Severity selector (1-5), zone dropdown, description
4. **Profile Page** - Skills, reliability score, completed shifts
5. **Bottom Navigation** - Easy mobile navigation
6. **PWA Support** - Installable as mobile app

---

## Demo Reset Command

If you need to reset the demo data at any point:
```bash
curl -X POST http://localhost:4000/api/demo/reset
```

Expected response:
```json
{
  "success": true,
  "message": "Demo reset complete",
  "data": {
    "incidentsCreated": 1,
    "zonesUpdated": 2,
    "assignmentsCreated": 3
  }
}
```

---

## Technical Highlights to Mention

1. **Real-time Updates** - Socket.io for instant dashboard updates
2. **Scalability** - Designed for 10,000+ volunteers across 20+ zones
3. **Mobile-First** - PWA with large touch targets and offline support
4. **Smart Allocation** - AI-powered volunteer matching
5. **Color-Coded Alerts** - Visual priority system for quick decision-making
6. **One-Click Actions** - Deploy volunteers, check-in/out with single tap

---

## Troubleshooting

### Dashboard not loading?
- Check API health: `curl http://localhost:4000/api/health`
- Restart API server: `cd apps/api && npm run dev`
- Restart web server: `cd apps/web && npm run dev`

### Demo reset not working?
- Check API is running on port 4000
- Verify database connection
- Check console for errors

### Mobile app not authenticating?
- Use phone number from demo data: `6223617590`
- Any 6-digit OTP works (mock authentication)
- Check localStorage for volunteerId

---

## Demo Data After Reset

- **1 Active Incident**: Severity-4 at Triveni Sangam
- **2 Zones at 85% Capacity**: Amber warning level
- **3 Pending Assignments**: Ready for volunteer allocation
- **10,000+ Volunteers**: In database (from seed data)
- **20+ Zones**: Various types (GHAT, GATE, MEDICAL, etc.)

---

## End of Demo

**Closing Statement:**
"SevaMitra ensures efficient volunteer management during mass events like Mahakumbh, enabling real-time coordination, rapid incident response, and smart resource allocation. Thank you for your time!"
