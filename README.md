# 🌟 Muse AdForge – AI Project Advertising & Sales Studio
**Powered by Meta Muse & Muse Spark Reasoning Architecture**

**Muse AdForge** is a full-featured enterprise advertising and sales generation studio built on the **Meta Muse** reasoning model family (`muse-spark-1.3`, `muse-spark-1.1`).

Instead of a generic chatbot, Muse AdForge operates as a real company marketing workspace: companies input their core project parameters, and Meta Muse Spark autonomously synthesizes a cohesive, high-converting multi-channel go-to-market campaign.

---

## ⚡ What Does Muse AdForge Generate?

When you enter your project details (**Name**, **Description**, **Features**, **Technology Stack**, **Target Customers**, and **Pricing**), Muse AdForge generates:

1. **📊 Marketing Strategy & Positioning:**
   - Executive Positioning Statement & Core Value Proposition (CVP).
   - Target ICP Persona segmentation and psychological purchase triggers.
   - Omni-Channel Go-To-Market Blueprint (LinkedIn, Instagram, Web, Sales).
   - Pricing funnel dynamics and target KPI conversion milestones.

2. **📸 Instagram Advertisement:**
   - Creative Visual Concept direction for graphic/video production.
   - High-contrast Dark Mode Carousel / Reel phone mockup preview.
   - High-converting caption copy with benefit bullets and emojis.
   - Targeted hashtag cloud with one-click copy.
   - Primary Call-to-Action (CTA) link.

3. **💼 LinkedIn Advertisement:**
   - High-credibility B2B sponsored thought-leadership post.
   - Realistic LinkedIn desktop card preview with engagement counters.
   - Problem-solution narrative with engineering ROI proof points.
   - Embedded link card with custom domain, headline, and "Learn More" trigger.

4. **🌐 Website Promotional Copy:**
   - Interactive Website Hero Mockup with custom browser address bar.
   - Eye-catching H1 Headline, Subhead, Primary CTA, and Secondary CTA buttons.
   - 3 Value Pillar Feature Cards (Precision Automation, Engineered for Scale, Unbeatable Economics).
   - Enterprise trust badges and conversion proof statements.

5. **🎙️ 30-Second Sales Pitch:**
   - Spoken elevator pitch formatted by timed intervals:
     - `[0:00 - 0:07]` **The Hook:** Eye-opening statistic or provocative question.
     - `[0:08 - 0:17]` **The Problem & Solution:** Direct pain point and product answer.
     - `[0:18 - 0:24]` **The Tech Moat:** Architectural advantage and pricing predictability.
     - `[0:25 - 0:30]` **The Frictionless Close:** Direct call-to-action and meeting ask.
   - **Interactive Teleprompter & Pacing Coach:**
     - 30-second live countdown clock.
     - Dynamic progress bar with interval markers.
     - Real-time beat illumination highlighting active sentences during pitch delivery.
     - Pacing coach metrics (~140 wpm cadence, delivery tone guidance).

---

## 🔄 Dual Execution Modes (Live Muse vs Demo Simulation)

Muse AdForge provides transparent mode controls:

- **🟢 Demo / Simulation Mode:**
  - Zero token cost, runs offline or without an API key.
  - Generates realistic, tailored multi-channel campaigns using deterministic Muse Spark reasoning logic.
  - Includes real-time simulated Contemplation Traces (chain-of-thought steps).
- **⚡ Live Meta Muse Mode:**
  - Directly streams live inference from Meta's official Model API (`https://api.meta.ai/v1/chat/completions`) using Server-Sent Events (SSE).
  - Configurable in the **API Config** modal (set key in browser `localStorage` or `.env`).

---

## 🛠️ Actions & Capabilities

- **🔄 Regenerate Entire Campaign:** Fresh synthesis of all 5 assets with one click.
- **🔄 Per-Asset Regeneration:** Regenerate only the Instagram Ad, LinkedIn Ad, Website Copy, Strategy, or Sales Pitch independently.
- **📋 One-Click Copy:** Copy individual sections or the entire consolidated dossier to clipboard.
- **💾 Multi-Format Export:**
  - Markdown (`.md`)
  - Standalone HTML presentation (`.html`)
  - Structured JSON package (`.json`)
- **📂 Saved Campaigns History:** Persisted in `localStorage` for fast reloading and comparative review.
- **⚡ 1-Click Company Samples:** Instantly prefill real company examples:
  - **DevPulse Cloud** (Autonomous Kubernetes Optimization)
  - **NovaPay Global** (Borderless Multi-Currency FinTech API)
  - **VitaScan AI** (Clinical Radiology Computer Vision)

---

## 🚀 Getting Started

### 1. Start the Server
```bash
npm start
```
The studio will run at `http://localhost:3000`.

### 2. Configure Live Meta API (Optional)
Click **"API Config"** in the top navigation bar to supply your Meta Developer key, or configure `.env`:
```env
META_API_KEY=your_meta_api_key_here
META_BASE_URL=https://api.meta.ai/v1
PORT=3000
```
If no key is supplied, **Demo / Simulation Mode** is enabled automatically with full functionality.

---

## 📁 Project Architecture

```
meta-muse-tester/
├── public/
│   ├── index.html        # Modern enterprise dashboard with 4-step workflow
│   ├── styles.css        # Premium glassmorphic dark design system
│   └── app.js            # Frontend SSE client, teleprompter engine & state store
├── server.js             # Native Node.js HTTP & SSE proxy with AdForge campaign synthesis
├── test_muse.py          # Python CLI testbench
├── package.json          # Metadata & startup scripts
└── README.md             # Documentation
```


## Responsive Design

The UI is fully responsive and works on phones, tablets, laptops and large desktops (no logic or feature changes).

| Screen | What changes |
|---|---|
| Large screens (1600px+) | Wider content container |
| Laptop / tablet landscape (≤1100px) | Header wraps, mode switch moves to its own row |
| Tablet (≤900px) | Single-column forms, stacked hero card, stacked Instagram preview |
| Large phone (≤768px) | Swipeable step bar, 16px inputs (no iOS zoom), stacked teleprompter controls |
| Phone (≤600px) | Icon-only header buttons, full-width action buttons, bottom-sheet settings modal, full-screen history drawer |
| Small phone (≤400px) | Tighter typography and single-column action buttons |

Also included: safe-area support for notched phones, 44px touch targets on touch devices, landscape-phone handling, reduced-motion support and a responsive exported HTML report.
