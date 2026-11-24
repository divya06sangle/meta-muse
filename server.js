const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple .env parser without external dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/(^["']|["']$)/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT || '3000', 10);
const META_BASE_URL = process.env.META_BASE_URL || 'https://api.meta.ai/v1';

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const SUPPORTED_MODELS = [
  {
    id: 'muse-spark-1.3',
    name: 'Muse Spark 1.3 (Flagship)',
    context: '1M Tokens',
    badge: 'Latest',
    description: 'Natively multimodal reasoning model with deep agentic planning and Contemplation Mode.'
  },
  {
    id: 'muse-spark-1.1',
    name: 'Muse Spark 1.1',
    context: '256k Tokens',
    badge: 'Fast',
    description: 'Optimized for high-speed multi-agent orchestration and coding workflows.'
  },
  {
    id: 'muse-spark',
    name: 'Muse Spark (Base)',
    context: '128k Tokens',
    badge: 'Standard',
    description: 'Foundational superintelligence reasoning model for general tasks.'
  },
  {
    id: 'muse-image',
    name: 'Muse Image Gen',
    context: 'Multimodal',
    badge: 'Visual',
    description: 'Specialized for instruction-based image creation and visual transformations.'
  }
];

// Helper to send JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-meta-api-key'
  });
  res.end(JSON.stringify(data));
}

// Serve static assets from public folder
function serveStatic(req, res, pathname) {
  let safePath = pathname === '/' ? '/index.html' : pathname;
  safePath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, 'public', safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Helper: Extract project parameters from AdForge payload or prompt text
function extractProjectDetails(prompt, body) {
  if (body.projectDetails && typeof body.projectDetails === 'object') {
    const p = body.projectDetails;
    return {
      name: p.name || 'NovaPulse AI',
      description: p.description || 'Autonomous cloud architecture optimization platform that continuously analyzes infrastructure and slashes cloud spend by 40%.',
      features: p.features || 'Real-time telemetry, automated pod rightsizing, predictive spot instance bidding, zero-downtime rollouts',
      technology: p.technology || 'Next.js 15, Rust, Kubernetes Operator, Meta Muse Spark, ClickHouse',
      audience: p.audience || 'DevOps Engineers, Cloud Architects, Engineering VPs, High-growth Tech Startups',
      pricing: p.pricing || 'Free 14-day trial, $49/node/mo for Pro, Custom Enterprise with SLA guarantees',
      tone: p.tone || 'High-Growth Tech, Authoritative, High-Energy',
      cta: p.cta || 'Start 14-Day Free Trial'
    };
  }

  const nameMatch = prompt.match(/(?:Project(?:\s+Name)?|Product(?:\s+Name)?)\s*:\s*([^\n\r]+)/i);
  const descMatch = prompt.match(/(?:Description|Summary)\s*:\s*([^\n\r]+)/i);
  const featuresMatch = prompt.match(/(?:Key\s+)?Features\s*:\s*([^\n\r]+)/i);
  const techMatch = prompt.match(/(?:Technology(?:\s+Stack)?|Tech\s+Stack)\s*:\s*([^\n\r]+)/i);
  const audienceMatch = prompt.match(/(?:Target\s+(?:Customers|Audience)|Customers|Audience|ICP)\s*:\s*([^\n\r]+)/i);
  const pricingMatch = prompt.match(/(?:Pricing|Business\s+Model|Price)\s*:\s*([^\n\r]+)/i);
  const toneMatch = prompt.match(/(?:Tone|Voice|Style)\s*:\s*([^\n\r]+)/i);
  const ctaMatch = prompt.match(/(?:Primary\s+CTA|Call\s+To\s+Action|Goal)\s*:\s*([^\n\r]+)/i);

  return {
    name: (nameMatch && nameMatch[1].trim()) || 'NovaPulse AI',
    description: (descMatch && descMatch[1].trim()) || 'Autonomous cloud architecture optimization platform that continuously analyzes infrastructure and slashes cloud spend by 40%.',
    features: (featuresMatch && featuresMatch[1].trim()) || 'Real-time telemetry, automated pod rightsizing, predictive spot instance bidding, zero-downtime rollouts',
    technology: (techMatch && techMatch[1].trim()) || 'Next.js 15, Rust, Kubernetes Operator, Meta Muse Spark, ClickHouse',
    audience: (audienceMatch && audienceMatch[1].trim()) || 'DevOps Engineers, Cloud Architects, Engineering VPs, High-growth Tech Startups',
    pricing: (pricingMatch && pricingMatch[1].trim()) || 'Free 14-day trial, $49/node/mo for Pro, Custom Enterprise with SLA guarantees',
    tone: (toneMatch && toneMatch[1].trim()) || 'High-Growth Tech, Authoritative, High-Energy',
    cta: (ctaMatch && ctaMatch[1].trim()) || 'Start 14-Day Free Trial'
  };
}

// Generate complete AdForge Campaign Content
function buildAdForgeContent(proj, regSection) {
  const strategySection = `## 📊 MARKETING STRATEGY & POSITIONING

### 1. Executive Positioning Statement
For **${proj.audience}** who struggle with operational complexity and runaway resource costs, **${proj.name}** is the definitive next-generation solution that ${proj.description}. Unlike legacy fragmented tools, it delivers an intelligent, autonomous layer built on modern infrastructure.

### 2. Core Value Proposition (CVP)
- **High-Velocity ROI:** Translates complex engineering workflows into immediate, quantifiable efficiency gains.
- **Architectural Moat:** Powered by **${proj.technology}**, ensuring sub-millisecond execution, enterprise-grade reliability, and zero overhead.
- **Frictionless Onboarding:** Transparent pricing at **${proj.pricing}** eliminates corporate purchasing friction.

### 3. Multi-Channel Go-To-Market Blueprint
| Channel | Objective | Key Conversion Hook | Primary Asset |
|---|---|---|---|
| **LinkedIn (B2B)** | Decision-maker resonance | "Stop paying for idle cloud waste" | Thought-Leadership Case Study |
| **Instagram (Social)** | Developer awareness & visual USP | "Watch your infrastructure optimize in real time" | 15s High-Energy Reel & Carousel |
| **Web Landing Page** | Immediate self-serve activation | "Zero code change setup in 90 seconds" | Interactive Hero & Savings Calculator |
| **Direct Sales Pitch** | Enterprise discovery calls | "Cut your bill before your next billing cycle" | 30s High-Impact Verbal Script |

### 4. Target Personas & Conversion Triggers
1. **The Technical Champion (Engineers/Architects):** Wants speed, zero downtime, and clean code. Resonates with **${proj.features}**.
2. **The Economic Buyer (VP/CFO):** Focuses on margin optimization, predictability, and fast payback at **${proj.pricing}**.`;

  const instagramSection = `## 📸 INSTAGRAM ADVERTISEMENT

### Visual Concept Direction
> **Creative Format:** High-contrast Dark Mode Carousel / Reel (Aspect Ratio 1:1 or 4:5).  
> **Visual Assets:** Sleek holographic visualization of **${proj.name}** interface glowing with neon cyan and electric violet accents. A pulsing counter showing efficiency metrics ticking upward, overlaid with modern sans-serif typography.

### Caption Copy
Stop letting outdated tools eat your company's margins and engineering sanity. 🛑⚡

Meet **${proj.name}** — ${proj.description}

Here is why forward-thinking teams are making the switch:
✨ **${proj.features.split(',')[0] || 'Real-time intelligent automation'}**
⚡ **Powered by ${proj.technology.split(',')[0] || 'Next-Gen Architecture'}**
💰 **Clear, transparent model:** ${proj.pricing}
🛡️ Enterprise-grade security and zero-overhead implementation

Tired of duct-taping legacy scripts? Experience modern engineering without the headache. 👇

👉 **Tap the link in bio to ${proj.cta.toLowerCase()}!**

### Hashtag Cloud
#${proj.name.replace(/[^a-zA-Z0-9]/g, '')} #TechInnovation #SaaS #CloudEngineering #DevOps #EngineeringLeadership #ModernStack #AIAutomation #ProductivityBoost #Startups`;

  const linkedinSection = `## 💼 LINKEDIN ADVERTISEMENT

### Post Headline
**Is your engineering team spending 30% of their sprints just keeping infrastructure alive?**

### Post Body
Most tech leaders know the hidden tax of fragmented tooling:
❌ Escalating operational overhead  
❌ Alert fatigue across engineering shifts  
❌ Clunky tools that take months to show measurable value  

We engineered **${proj.name}** to fix this fundamentally.

${proj.description}

Built from the ground up on **${proj.technology}**, **${proj.name}** delivers:
- **${proj.features.split(',')[0] || 'Autonomous real-time visibility'}**
- **${proj.features.split(',')[1] || 'Predictive optimization engine'}**
- **Transparent economics:** ${proj.pricing}

Whether you're managing scaling Kubernetes clusters or optimizing high-throughput data pipelines, your team deserves tooling built for 2026, not 2016.

> *"Within 48 hours of deploying ${proj.name}, our visibility went from reactive fire-fighting to proactive automation."*

### Call To Action
👉 Join hundreds of leading engineering teams.  
🔗 **Click below to ${proj.cta.toLowerCase()} and test it risk-free.**

---
*[Sponsored Link Card: ${proj.name} | Modern Solutions for High-Growth Tech | Learn More]*`;

  const websiteSection = `## 🌐 WEBSITE PROMOTIONAL COPY

### Hero Section
- **Badge:** ⚡ THE NEW STANDARD IN ${proj.name.toUpperCase()}
- **H1 Headline:** The Intelligent Backbone for Modern ${proj.audience.split(',')[0] || 'Engineering Teams'}.
- **Subheadline:** ${proj.description} Built on ${proj.technology} to deliver immediate impact without weeks of integration.
- **Primary CTA Button:** [ ${proj.cta} → ]
- **Secondary CTA Button:** [ Watch 2-Minute Interactive Demo ]
- **Trust Bar:** Trusted by innovative builders at fast-scaling tech companies worldwide.

### Feature Highlight Cards
1. **Pillar 1: Precision Automation**
   *Headline:* ${proj.features.split(',')[0] || 'Real-time telemetry and deep intelligence'}
   *Benefit:* Eliminate manual toil and let your team focus on shipping customer-facing features.
2. **Pillar 2: Engineered for Scale**
   *Headline:* Engineered with ${proj.technology.split(',')[0] || 'Modern High-Throughput Tech'}
   *Benefit:* Guaranteed sub-second response times and rock-solid 99.99% operational uptime.
3. **Pillar 3: Unbeatable Economics**
   *Headline:* Transparent, Predictable ROI
   *Benefit:* Flexible pricing at **${proj.pricing}** with instant self-serve activation.

### Social Proof & Conversion Section
> "Switching to ${proj.name} was the single highest-ROI infrastructure decision we made this quarter."  
> — *Director of Technology, HyperScale Labs*

**Ready to transform your workflow?**  
No credit card required for 14 days. Deploy in under 3 minutes.  
[ ${proj.cta} Now ]`;

  const salesPitchSection = `## 🎙️ 30-SECOND SALES PITCH

### Spoken Script (High-Impact Elevator Pitch)
*(Pacing: ~140 words per minute | Duration: Exactly 30 Seconds | Energy: Confident & Direct)*

\`[00:00 - 00:07] THE HOOK\`  
> "Did you know that over 40% of software engineering spend is lost to tool fragmentation and manual maintenance every single month?"

\`[00:08 - 00:17] THE PROBLEM & SOLUTION\`  
> "That’s exactly why we built **${proj.name}**. It's ${proj.description} Instead of wrestling with complex configurations, your team gets **${proj.features.split(',')[0] || 'autonomous optimization'}** right out of the box."

\`[00:18 - 00:24] THE UNFAIR ADVANTAGE\`  
> "Because we engineered it directly on **${proj.technology.split(',')[0] || 'a modern architecture'}**, you get instant setup and immediate ROI—starting at **${proj.pricing.split(',')[0] || proj.pricing}**."

\`[00:25 - 00:30] THE CALL TO ACTION\`  
> "Let’s spin up a sandbox environment on your stack this afternoon—or visit our site right now to **${proj.cta.toLowerCase()}**. What’s the best email to send your invite to?"

---
### Pitch Coach Delivery Cues
- **Tone:** Authoritative, empathetic, solution-oriented.
- **Emphasis:** Stress the numbers (*40%*, *30 seconds*, *instant setup*).
- **Body Language / Voice:** Pause slightly after the opening question to let the hook land before presenting ${proj.name}.`;

  if (regSection) {
    if (regSection.includes('insta')) return instagramSection;
    if (regSection.includes('link')) return linkedinSection;
    if (regSection.includes('strat')) return strategySection;
    if (regSection.includes('web')) return websiteSection;
    if (regSection.includes('pitch') || regSection.includes('sales')) return salesPitchSection;
  }

  return `${strategySection}

---

${instagramSection}

---

${linkedinSection}

---

${websiteSection}

---

${salesPitchSection}`;
}

// Interactive Simulation Engine for Meta Muse Spark
function simulateMuseStream(res, body) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const prompt = (body.messages && body.messages[body.messages.length - 1]?.content) || '';
  const model = body.model || 'muse-spark-1.3';
  const contemplationEnabled = body.contemplation !== false;

  let contemplationSteps = [
    `Analyzing user instruction with ${model} reasoning engine...`,
    `Deconstructing constraints: evaluating domain principles, logic pathways, and safety bounds.`,
    `Formulating verification graph: exploring 3 potential solution branches to maximize precision.`,
    `Cross-checking edge conditions, computational efficiency, and structural clarity.`,
    `Synthesizing deterministic final response.`
  ];

  let simulatedTools = [];
  let answerContent = '';

  const lowerPrompt = prompt.toLowerCase();
  const isAdForgeCampaign = body.projectDetails || 
    lowerPrompt.includes('adforge') || 
    lowerPrompt.includes('marketing strategy') || 
    lowerPrompt.includes('sales pitch') || 
    lowerPrompt.includes('project details') ||
    lowerPrompt.includes('instagram advertisement') ||
    lowerPrompt.includes('campaign');

  if (isAdForgeCampaign) {
    const proj = extractProjectDetails(prompt, body);
    const regMatch = prompt.match(/regenerate\s+(?:only\s+)?([a-zA-Z0-9_\s-]+)/i) || 
      (body.regenerateSection ? [null, body.regenerateSection] : null);
    const regSection = regMatch ? regMatch[1].trim().toLowerCase() : null;

    simulatedTools.push({
      tool: 'muse_marketing_engine',
      args: { project: proj.name, target_icp: proj.audience, channels: ['instagram', 'linkedin', 'web', 'pitch'] },
      result: { audience_readiness: 'High', hook_retention_score: 97.2, viral_coefficient: 2.4, pricing_fit: proj.pricing }
    });

    contemplationSteps = [
      `Initiating Meta Muse AdForge Reasoning Engine (${model})...`,
      `Deconstructing ${proj.name}: analyzing core USP against customer pain points in ${proj.audience}.`,
      `Auditing technological leverage (${proj.technology}) and economic value capture at ${proj.pricing}.`,
      `Formulating multi-channel GTM matrix: Instagram visual hook, LinkedIn B2B executive resonance, and high-conversion web layout.`,
      `Structuring high-cadence 30-second sales pitch with psychological urgency and zero-friction closing mechanics.`,
      `Synthesizing deterministic, high-conversion enterprise campaign package.`
    ];

    answerContent = buildAdForgeContent(proj, regSection);
  } else if (lowerPrompt.includes('weather') || lowerPrompt.includes('forecast') || lowerPrompt.includes('temperature')) {
    simulatedTools.push({
      tool: 'weather_service_api',
      args: { location: 'San Francisco, CA', units: 'celsius' },
      result: { temperature: 19.5, condition: 'Partly Sunny', humidity: '64%', wind: '12 km/h' }
    });
    contemplationSteps = [
      `User is asking for real-time weather information.`,
      `Muse Agent recognizes requirement for tool execution: invoking [weather_service_api].`,
      `Validating parameters for weather_service_api: location extraction successful.`,
      `Receiving structured tool payload: { temp: 19.5C, condition: 'Partly Sunny' }.`,
      `Formatting empathetic, clear natural language summary with meteorological advisory.`
    ];
    answerContent = `### 🌤️ Weather Forecast for San Francisco, CA\n\nHere is the latest live report fetched via **Muse Agent Tool Pipeline**:\n\n- **Current Temperature:** 19.5°C (67°F)\n- **Conditions:** Partly Sunny with light coastal breeze\n- **Humidity:** 64%\n- **Wind Speed:** 12 km/h WNW\n\n> **Muse Advisory:** Ideal conditions for outdoor activities this afternoon. A light jacket is recommended toward the evening as onshore gusts increase.`;
  } else if (lowerPrompt.includes('code') || lowerPrompt.includes('function') || lowerPrompt.includes('fibonacci') || lowerPrompt.includes('algorithm') || lowerPrompt.includes('python') || lowerPrompt.includes('bug')) {
    simulatedTools.push({
      tool: 'muse_code_ast_validator',
      args: { language: 'python', complexity_check: true },
      result: { syntax_valid: true, time_complexity: 'O(log N) or O(N)', memory_overhead: 'O(1)' }
    });
    contemplationSteps = [
      `Deconstructing algorithm implementation specifications.`,
      `Analyzing time/space trade-offs: standard recursion O(2^n) is suboptimal; evaluating matrix exponentiation vs iterative dynamic programming.`,
      `Invoking [muse_code_ast_validator] for static linting and algorithmic integrity verification.`,
      `Memory footprint verified at O(1) space with iterative memoization.`,
      `Writing idiomatic, typed Python solution with unit tests and edge cases handling (N < 0, N = 0).`
    ];
    answerContent = `### ⚡ Optimized Implementation (Muse Code Harness)\n\nHere is an optimized, memory-efficient solution with full type annotations and edge-case handling:\n\n\`\`\`python\nfrom typing import Generator\n\ndef fibonacci_generator(n: int) -> Generator[int, None, None]:\n    """\n    Generates Fibonacci sequence numbers up to index n using O(1) auxiliary space.\n    Time Complexity: O(n)\n    Space Complexity: O(1)\n    """\n    if n < 0:\n        raise ValueError("Sequence index n must be non-negative.")\n        \n    a, b = 0, 1\n    for _ in range(n + 1):\n        yield a\n        a, b = b, a + b\n\n# Verification test\nif __name__ == "__main__":\n    print("First 10 Fibonacci numbers:", list(fibonacci_generator(9)))\n    # Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\n\`\`\`\n\n#### Key Architectural Insights:\n1. **Zero Heap Allocation Overhead:** Uses generator expressions rather than constructing full arrays in memory.\n2. **Type-Safe:** Includes PEP 484 type hints for IDE autocompletion.\n3. **Verified:** Passes validation via \`muse_code_ast_validator\`.`;
  } else if (lowerPrompt.includes('plan') || lowerPrompt.includes('agent') || lowerPrompt.includes('trip') || lowerPrompt.includes('task') || lowerPrompt.includes('schedule')) {
    simulatedTools.push({
      tool: 'muse_sentinel_scheduler',
      args: { task_decomposition_level: 'deep', conflict_resolution: true },
      result: { steps_planned: 4, conflicts_detected: 0, status: 'approved' }
    });
    contemplationSteps = [
      `Initiating Meta Muse multi-step agentic planning module.`,
      `Target Goal: Formulate an actionable, phased execution roadmap with fallback contingencies.`,
      `Checking Sentinel permission boundaries: scheduling, budget estimation, and itinerary generation approved.`,
      `Optimizing milestone sequence to minimize idle wait times and budget risks.`,
      `Assembling comprehensive agent execution plan.`
    ];
    answerContent = `### 🎯 Meta Muse Autonomous Action Plan\n\nMuse has decomposed your objective into a **4-Phase Autonomous Execution Matrix**:\n\n| Phase | Goal | Actions & Tool Hooks | Est. Duration |\n|---|---|---|---|\n| **1. Ingestion** | Context & Constraint Mapping | Parse user priorities, dates, and budget parameters | 2 mins |\n| **2. Discovery** | Option Generation & Filtering | Call Sentinel service connectors to query verified partners | 5 mins |\n| **3. Risk Audit** | Conflict & Friction Analysis | Check travel buffers, cancellation policies, weather alerts | Instant |\n| **4. Dispatch** | Final Confirmation & Calendar Sync | Generate calendar events, push notifications to user device | Ongoing |\n\n> **Autonomous Monitoring Active:** Muse will track real-time price fluctuations and schedule shifts in the background.`;
  } else {
    answerContent = `### 🤖 Meta Muse Response\n\nHello! I am **Meta Muse** (running **${model}**).\n\nYour query has been processed through the **Muse Superintelligence Reasoning Architecture**.\n\n- **Model Active:** \`${model}\`\n- **Agent Framework:** Meta Superintelligence Labs (MSL)\n- **Context Handling:** Multi-turn conversational memory with deep multi-step planning\n\n**Response to your query:**\n> "${prompt}"\n\nMuse Spark is engineered for complex problem decomposition, tool invocation (via Meta Sentinel), and contemplative chain-of-thought verification. You can test:\n1. **Contemplation Mode** (observing internal thinking traces in real time)\n2. **Tool Execution** (asking about weather, coding tasks, or scheduling)\n3. **Live API Key Integration** (by entering your Meta Developer API Key in the settings modal).`;
  }

  // Stream contemplation steps if enabled
  let delay = 60;
  let timerIndex = 0;

  function sendEvent(type, data) {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  // Initial handshake
  sendEvent('start', { model, status: 'streaming', timestamp: Date.now() });

  function streamContemplation() {
    if (!contemplationEnabled || timerIndex >= contemplationSteps.length) {
      // Contemplation done, stream tools if any
      streamTools();
      return;
    }

    const step = contemplationSteps[timerIndex++];
    sendEvent('contemplation', { text: step + '\n', index: timerIndex });
    setTimeout(streamContemplation, 280);
  }

  function streamTools() {
    if (simulatedTools.length > 0) {
      for (const t of simulatedTools) {
        sendEvent('tool_call', t);
      }
    }
    // Stream answer content word by word
    streamAnswer();
  }

  const words = answerContent.split(' ');
  let wordIdx = 0;

  function streamAnswer() {
    if (wordIdx >= words.length) {
      sendEvent('done', {
        total_tokens: words.length + contemplationSteps.length * 15,
        reasoning_tokens: contemplationSteps.length * 15,
        completion_tokens: words.length,
        duration_ms: (words.length * 25) + 1200
      });
      res.end();
      return;
    }

    const chunk = (wordIdx === 0 ? '' : ' ') + words[wordIdx++];
    sendEvent('chunk', { text: chunk });
    setTimeout(streamAnswer, 22);
  }

  // Start the flow
  setTimeout(streamContemplation, 100);
}

// Live Proxy to Meta Model API (https://api.meta.ai/v1/chat/completions)
async function proxyToMetaAPI(req, res, body, apiKey) {
  const metaUrl = `${META_BASE_URL}/chat/completions`;

  const payload = {
    model: body.model || 'muse-spark-1.3',
    messages: body.messages || [{ role: 'user', content: 'Hello' }],
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
    max_tokens: body.max_tokens || 2048,
    stream: true
  };

  if (body.tools && Array.isArray(body.tools) && body.tools.length > 0) {
    payload.tools = body.tools;
  }

  try {
    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!metaResponse.ok) {
      const errText = await metaResponse.text();
      let parsedErr = { error: errText };
      try { parsedErr = JSON.parse(errText); } catch (_) {}
      sendJSON(res, metaResponse.status, {
        error: `Meta Model API Error (${metaResponse.status}): ${parsedErr.error?.message || errText}`,
        details: parsedErr
      });
      return;
    }

    // Stream SSE directly to browser
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const reader = metaResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      res.write(chunkStr);
    }

    res.end();
  } catch (error) {
    sendJSON(res, 502, {
      error: `Failed to connect to Meta API at ${metaUrl}: ${error.message}`
    });
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-meta-api-key'
    });
    res.end();
    return;
  }

  // API: Status & Configuration Info
  if (pathname === '/api/status' && req.method === 'GET') {
    const hasEnvKey = Boolean(process.env.META_API_KEY && process.env.META_API_KEY !== 'your_meta_api_key_here');
    return sendJSON(res, 200, {
      status: 'online',
      hasServerKey: hasEnvKey,
      baseUrl: META_BASE_URL,
      models: SUPPORTED_MODELS,
      defaultModel: process.env.META_DEFAULT_MODEL || 'muse-spark-1.3',
      serverTime: new Date().toISOString()
    });
  }

  // API: Chat / Completion Endpoint
  if (pathname === '/api/chat' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
      if (bodyData.length > 2 * 1024 * 1024) {
        req.destroy(); // protect against oversized requests
      }
    });

    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyData || '{}');
        const clientKey = req.headers['x-meta-api-key'] || body.apiKey;
        const serverKey = process.env.META_API_KEY && process.env.META_API_KEY !== 'your_meta_api_key_here' ? process.env.META_API_KEY : null;
        const activeKey = clientKey || serverKey;

        // If explicitly simulation mode OR no API key provided, run simulation engine
        if (body.simulationMode || !activeKey) {
          simulateMuseStream(res, body);
        } else {
          await proxyToMetaAPI(req, res, body, activeKey);
        }
      } catch (err) {
        sendJSON(res, 400, { error: 'Invalid JSON payload: ' + err.message });
      }
    });
    return;
  }

  // Fallback: Static Assets
  if (req.method === 'GET') {
    return serveStatic(req, res, pathname);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  🌟 Meta Muse Test Studio is running!`);
  console.log(`  🔗 Local URL: http://localhost:${PORT}`);
  console.log(`  🤖 Active Target: ${META_BASE_URL}`);
  console.log(`  ⚡ Ready for live testing & interactive simulation`);
  console.log(`====================================================`);
});
