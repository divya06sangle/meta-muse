/**
 * Muse AdForge – AI Project Advertising & Sales Studio
 * Client Application Controller
 * Handles project ingestion, Meta Muse Spark reasoning orchestration,
 * multi-channel ad rendering, 30-second teleprompter pacing, and export pipeline.
 */

// Preset Company Samples for 1-Click Evaluation
const COMPANY_SAMPLES = {
  devpulse: {
    name: 'DevPulse Cloud',
    audience: 'DevOps Engineers, Cloud Architects, VPs of Infrastructure',
    description: 'Autonomous cloud infrastructure debugger that detects performance regressions, rightsizes Kubernetes workloads, and slashes cloud spend by up to 40%.',
    features: 'Real-time eBPF kernel telemetry, automated pod rightsizing, predictive spot instance bidding, zero-downtime rollback safety',
    technology: 'Next.js 15, Rust, eBPF, Kubernetes Operator, Meta Muse Spark, ClickHouse, OpenTelemetry',
    pricing: '14-day free trial, $49/node/month Pro, Custom Enterprise with 99.99% SLA',
    tone: 'High-Growth Tech',
    cta: 'Start 14-Day Free Trial'
  },
  novapay: {
    name: 'NovaPay Global',
    audience: 'FinTech Founders, Global E-Commerce Directors, CFOs',
    description: 'Borderless multi-currency payments API with instant local currency settlement across 140 countries and zero foreign exchange markup.',
    features: 'Unified REST & GraphQL API, automated FX hedging, instant payouts via local rail networks, PCI-DSS Level 1 compliance',
    technology: 'Go, PostgreSQL, Redis, Meta Muse Spark, Distributed Ledger Rail, ISO 20022 compliant message bus',
    pricing: '0.8% + $0.20 per transaction, volume discounts starting at $50k/mo, dedicated treasury desk',
    tone: 'Executive Enterprise',
    cta: 'Open Global Developer Account'
  },
  vitascan: {
    name: 'VitaScan AI',
    audience: 'Hospital Radiology Directors, Clinical Imaging Specialists, Chief Medical Officers',
    description: 'FDA-cleared computer vision platform that pre-screens chest CT scans in 14 seconds to detect occult pulmonary embolisms and pneumothorax.',
    features: 'Sub-millimeter anomaly detection, DICOM PACS bi-directional sync, zero latency hospital LAN deployment, auditable confidence heatmaps',
    technology: 'Python, PyTorch, TensorRT, Meta Muse Spark, DICOMweb, HIPAA compliant zero-egress enclave',
    pricing: 'Annual hospital license based on bed capacity, 60-day IRB clinical pilot program',
    tone: 'Disruptive Innovator',
    cta: 'Request 60-Day Clinical Pilot'
  }
};

class MuseAdForgeStudio {
  constructor() {
    this.isStreaming = false;
    this.startTime = 0;
    this.firstTokenTime = 0;
    this.tokenCount = 0;
    this.reasoningTokenCount = 0;
    this.contemplationTimer = null;
    this.currentCampaign = null;

    // Teleprompter State
    this.teleprompterInterval = null;
    this.teleprompterSeconds = 30;
    this.teleprompterActive = false;

    // Mode: 'sim' (Demo / Simulation) vs 'live' (Live Meta Model API)
    this.activeMode = localStorage.getItem('adforge_mode') || 'sim';

    // Campaigns History
    this.history = JSON.parse(localStorage.getItem('adforge_campaigns') || '[]');

    this.initElements();
    this.initEventListeners();
    this.loadSavedSettings();
    this.updateModeUI();
    this.checkBackendStatus();
    this.updateSavedCountBadge();
  }

  initElements() {
    // Top Bar & Mode Elements
    this.btnModeSim = document.getElementById('btnModeSim');
    this.btnModeLive = document.getElementById('btnModeLive');
    this.modeBanner = document.getElementById('modeBanner');
    this.bannerBadge = document.getElementById('bannerBadge');
    this.bannerText = document.getElementById('bannerText');
    this.btnBannerAction = document.getElementById('btnBannerAction');
    this.btnSampleSelect = document.getElementById('btnSampleSelect');
    this.sampleDropdownMenu = document.getElementById('sampleDropdownMenu');
    this.btnViewHistory = document.getElementById('btnViewHistory');
    this.savedCountBadge = document.getElementById('savedCountBadge');
    this.btnOpenSettings = document.getElementById('btnOpenSettings');

    // Stepper Nodes
    this.stepperNodes = document.querySelectorAll('.step-node');

    // Form Inputs
    this.inputProjectName = document.getElementById('inputProjectName');
    this.inputAudience = document.getElementById('inputAudience');
    this.inputDescription = document.getElementById('inputDescription');
    this.inputFeatures = document.getElementById('inputFeatures');
    this.inputTechnology = document.getElementById('inputTechnology');
    this.inputPricing = document.getElementById('inputPricing');
    this.selectCampaignTone = document.getElementById('selectCampaignTone');
    this.inputCampaignCta = document.getElementById('inputCampaignCta');
    this.btnQuickFillDevPulse = document.getElementById('btnQuickFillDevPulse');
    this.btnResetProjectForm = document.getElementById('btnResetProjectForm');

    // Generation Controls
    this.modelSelect = document.getElementById('modelSelect');
    this.chkContemplation = document.getElementById('chkContemplation');
    this.btnGenerateCampaign = document.getElementById('btnGenerateCampaign');
    this.generateBtnText = document.getElementById('generateBtnText');
    this.heroStatusBadge = document.getElementById('heroStatusBadge');
    this.heroModeSub = document.getElementById('heroModeSub');
    this.previewProjectName = document.getElementById('previewProjectName');
    this.heroMetaSummary = document.getElementById('heroMetaSummary');

    // Contemplation & Metrics
    this.metricsBar = document.getElementById('metricsBar');
    this.metricStatus = document.getElementById('metricStatus');
    this.metricTtft = document.getElementById('metricTtft');
    this.metricSpeed = document.getElementById('metricSpeed');
    this.metricReasoning = document.getElementById('metricReasoning');
    this.metricTotal = document.getElementById('metricTotal');
    this.contemplationPanel = document.getElementById('contemplationPanel');
    this.contemplationSteps = document.getElementById('contemplationSteps');
    this.contemplationTimerEl = document.getElementById('contemplationTimer');
    this.btnToggleContemplationView = document.getElementById('btnToggleContemplationView');

    // Campaign Viewports & Tabs
    this.campaignPlaceholder = document.getElementById('campaignPlaceholder');
    this.channelTabs = document.querySelectorAll('.channel-tab-btn');
    this.channelPanes = document.querySelectorAll('.channel-tab-pane');
    this.btnRegenerateFullCampaign = document.getElementById('btnRegenerateFullCampaign');
    this.btnCopyEntireCampaign = document.getElementById('btnCopyEntireCampaign');
    this.copyAllBtnText = document.getElementById('copyAllBtnText');
    this.btnDownloadCampaign = document.getElementById('btnDownloadCampaign');
    this.downloadDropdownMenu = document.getElementById('downloadDropdownMenu');
    this.btnDownloadMarkdown = document.getElementById('btnDownloadMarkdown');
    this.btnDownloadHtml = document.getElementById('btnDownloadHtml');
    this.btnDownloadJson = document.getElementById('btnDownloadJson');

    // Asset Views
    this.strategyContentArea = document.getElementById('strategyContentArea');
    this.btnCopyStrategy = document.getElementById('btnCopyStrategy');
    this.btnRegenStrategy = document.getElementById('btnRegenStrategy');

    // Instagram View Elements
    this.igHandle = document.getElementById('igHandle');
    this.igVisualHeadline = document.getElementById('igVisualHeadline');
    this.igVisualSub = document.getElementById('igVisualSub');
    this.igCtaBannerText = document.getElementById('igCtaBannerText');
    this.igCaptionRender = document.getElementById('igCaptionRender');
    this.igCreativeNotes = document.getElementById('igCreativeNotes');
    this.igRawCopy = document.getElementById('igRawCopy');
    this.btnCopyInstagram = document.getElementById('btnCopyInstagram');
    this.btnRegenInstagram = document.getElementById('btnRegenInstagram');

    // LinkedIn View Elements
    this.liCompanyName = document.getElementById('liCompanyName');
    this.liPostBody = document.getElementById('liPostBody');
    this.liThumbTitle = document.getElementById('liThumbTitle');
    this.liLinkDomain = document.getElementById('liLinkDomain');
    this.liLinkHeadline = document.getElementById('liLinkHeadline');
    this.liLinkCtaBtn = document.getElementById('liLinkCtaBtn');
    this.btnCopyLinkedIn = document.getElementById('btnCopyLinkedIn');
    this.btnRegenLinkedIn = document.getElementById('btnRegenLinkedIn');

    // Website View Elements
    this.webBrowserUrl = document.getElementById('webBrowserUrl');
    this.webHeroBadge = document.getElementById('webHeroBadge');
    this.webHeroH1 = document.getElementById('webHeroH1');
    this.webHeroSub = document.getElementById('webHeroSub');
    this.webPrimaryCtaBtn = document.getElementById('webPrimaryCtaBtn');
    this.webFullCopyRender = document.getElementById('webFullCopyRender');
    this.btnCopyWebsite = document.getElementById('btnCopyWebsite');
    this.btnRegenWebsite = document.getElementById('btnRegenWebsite');

    // Sales Pitch & Teleprompter
    this.pitchOverviewRender = document.getElementById('pitchOverviewRender');
    this.btnCopyPitchMini = document.getElementById('btnCopyPitchMini');
    this.btnJumpToTeleprompter = document.getElementById('btnJumpToTeleprompter');
    this.btnCopyPitchScript = document.getElementById('btnCopyPitchScript');
    this.btnRegenPitch = document.getElementById('btnRegenPitch');
    this.clockSeconds = document.getElementById('clockSeconds');
    this.clockStatusText = document.getElementById('clockStatusText');
    this.pitchProgressFill = document.getElementById('pitchProgressFill');
    this.btnStartTeleprompter = document.getElementById('btnStartTeleprompter');
    this.telePlayIcon = document.getElementById('telePlayIcon');
    this.telePlayText = document.getElementById('telePlayText');
    this.btnResetTeleprompter = document.getElementById('btnResetTeleprompter');
    this.teleprompterBeats = document.querySelectorAll('.teleprompter-beat');
    this.speechHook = document.getElementById('speechHook');
    this.speechProblem = document.getElementById('speechProblem');
    this.speechMoat = document.getElementById('speechMoat');
    this.speechCta = document.getElementById('speechCta');
    this.coachDeliveryText = document.getElementById('coachDeliveryText');

    // Full Brief
    this.fullBriefContentArea = document.getElementById('fullBriefContentArea');
    this.btnCopyFullBrief = document.getElementById('btnCopyFullBrief');

    // Settings Modal & History Drawer
    this.settingsModal = document.getElementById('settingsModal');
    this.btnCloseSettings = document.getElementById('btnCloseSettings');
    this.metaApiKeyInput = document.getElementById('metaApiKeyInput');
    this.metaBaseUrlInput = document.getElementById('metaBaseUrlInput');
    this.btnToggleKeyVisibility = document.getElementById('btnToggleKeyVisibility');
    this.radioSimMode = document.getElementById('radioSimMode');
    this.radioLiveMode = document.getElementById('radioLiveMode');
    this.keyStatusText = document.getElementById('keyStatusText');
    this.btnTestKey = document.getElementById('btnTestKey');
    this.btnSaveSettings = document.getElementById('btnSaveSettings');
    this.historyDrawer = document.getElementById('historyDrawer');
    this.btnCloseHistory = document.getElementById('btnCloseHistory');
    this.btnClearHistory = document.getElementById('btnClearHistory');
    this.historyListContainer = document.getElementById('historyListContainer');
    this.toastContainer = document.getElementById('toastContainer');
  }

  initEventListeners() {
    // Mode toggles
    this.btnModeSim.addEventListener('click', () => this.switchMode('sim'));
    this.btnModeLive.addEventListener('click', () => this.switchMode('live'));
    this.btnBannerAction.addEventListener('click', () => {
      if (this.activeMode === 'sim') {
        this.openSettingsModal();
      } else {
        this.switchMode('sim');
      }
    });

    // Sample selection
    this.btnSampleSelect.addEventListener('click', e => {
      e.stopPropagation();
      const isVisible = this.sampleDropdownMenu.style.display === 'block';
      this.sampleDropdownMenu.style.display = isVisible ? 'none' : 'block';
    });

    document.querySelectorAll('.dropdown-item[data-sample]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.sample;
        this.loadCompanySample(key);
        this.sampleDropdownMenu.style.display = 'none';
      });
    });

    // Quick fill button in form
    this.btnQuickFillDevPulse.addEventListener('click', () => this.loadCompanySample('devpulse'));
    this.btnResetProjectForm.addEventListener('click', () => this.resetForm());

    // Input changes update the preview card in Step 2
    this.inputProjectName.addEventListener('input', () => this.updateFormPreview());
    this.inputAudience.addEventListener('input', () => this.updateFormPreview());
    this.selectCampaignTone.addEventListener('change', () => this.updateFormPreview());

    // Stepper navigation clicks
    this.stepperNodes.forEach(node => {
      node.addEventListener('click', () => {
        const targetId = node.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          this.setActiveStepNode(node);
        }
      });
    });

    // Primary Generation Launch
    this.btnGenerateCampaign.addEventListener('click', () => this.generateFullCampaign());
    this.btnRegenerateFullCampaign.addEventListener('click', () => this.generateFullCampaign());

    // Asset Regeneration Buttons
    this.btnRegenStrategy.addEventListener('click', () => this.regenerateSpecificAsset('strategy'));
    this.btnRegenInstagram.addEventListener('click', () => this.regenerateSpecificAsset('instagram'));
    this.btnRegenLinkedIn.addEventListener('click', () => this.regenerateSpecificAsset('linkedin'));
    this.btnRegenWebsite.addEventListener('click', () => this.regenerateSpecificAsset('website'));
    this.btnRegenPitch.addEventListener('click', () => this.regenerateSpecificAsset('pitch'));

    // Channel Tab switching
    this.channelTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTabId = tab.dataset.tab;
        this.switchChannelTab(targetTabId);
      });
    });

    // Copy Buttons
    this.btnCopyEntireCampaign.addEventListener('click', () => this.copyCampaignToClipboard());
    this.btnCopyFullBrief.addEventListener('click', () => this.copyCampaignToClipboard());
    this.btnCopyStrategy.addEventListener('click', () => this.copySpecificText(this.strategyContentArea.innerText, 'Marketing Strategy copied!'));
    this.btnCopyInstagram.addEventListener('click', () => this.copySpecificText(this.igRawCopy.innerText, 'Instagram Caption copied!'));
    this.btnCopyLinkedIn.addEventListener('click', () => this.copySpecificText(this.liPostBody.innerText, 'LinkedIn Post copied!'));
    this.btnCopyWebsite.addEventListener('click', () => this.copySpecificText(this.webFullCopyRender.innerText, 'Website Copy copied!'));
    this.btnCopyPitchMini.addEventListener('click', () => this.copyPitchScript());
    this.btnCopyPitchScript.addEventListener('click', () => this.copyPitchScript());

    // Jump to teleprompter
    this.btnJumpToTeleprompter.addEventListener('click', () => {
      document.getElementById('sectionSalesPitch').scrollIntoView({ behavior: 'smooth' });
    });

    // Teleprompter Controls
    this.btnStartTeleprompter.addEventListener('click', () => this.toggleTeleprompter());
    this.btnResetTeleprompter.addEventListener('click', () => this.resetTeleprompter());

    // Download dropdown
    this.btnDownloadCampaign.addEventListener('click', e => {
      e.stopPropagation();
      const isVisible = this.downloadDropdownMenu.style.display === 'block';
      this.downloadDropdownMenu.style.display = isVisible ? 'none' : 'block';
    });

    this.btnDownloadMarkdown.addEventListener('click', () => {
      this.downloadCampaign('markdown');
      this.downloadDropdownMenu.style.display = 'none';
    });
    this.btnDownloadHtml.addEventListener('click', () => {
      this.downloadCampaign('html');
      this.downloadDropdownMenu.style.display = 'none';
    });
    this.btnDownloadJson.addEventListener('click', () => {
      this.downloadCampaign('json');
      this.downloadDropdownMenu.style.display = 'none';
    });

    // Contemplation toggle
    this.btnToggleContemplationView.addEventListener('click', () => {
      const isHidden = this.contemplationSteps.parentElement.style.display === 'none';
      this.contemplationSteps.parentElement.style.display = isHidden ? 'block' : 'none';
      this.btnToggleContemplationView.textContent = isHidden ? '▾' : '▸';
    });

    // History Drawer
    this.btnViewHistory.addEventListener('click', () => this.openHistoryDrawer());
    this.btnCloseHistory.addEventListener('click', () => this.closeHistoryDrawer());
    this.btnClearHistory.addEventListener('click', () => this.clearHistory());

    // Settings Modal
    this.btnOpenSettings.addEventListener('click', () => this.openSettingsModal());
    this.btnCloseSettings.addEventListener('click', () => this.closeSettingsModal());
    this.btnSaveSettings.addEventListener('click', () => this.saveSettings());
    this.btnTestKey.addEventListener('click', () => this.testMetaApiConnection());
    this.btnToggleKeyVisibility.addEventListener('click', () => {
      const isPass = this.metaApiKeyInput.type === 'password';
      this.metaApiKeyInput.type = isPass ? 'text' : 'password';
      this.btnToggleKeyVisibility.textContent = isPass ? '🔒' : '👁️';
    });

    // Close dropdowns & modals on outside click
    document.addEventListener('click', e => {
      if (!this.sampleDropdownMenu.contains(e.target) && e.target !== this.btnSampleSelect) {
        this.sampleDropdownMenu.style.display = 'none';
      }
      if (!this.downloadDropdownMenu.contains(e.target) && !this.btnDownloadCampaign.contains(e.target)) {
        this.downloadDropdownMenu.style.display = 'none';
      }
      if (e.target === this.settingsModal) this.closeSettingsModal();
      if (e.target === this.historyDrawer) this.closeHistoryDrawer();
    });
  }

  // =========================================================================
  // Mode Management: Demo / Simulation Mode vs Live Meta Muse API
  // =========================================================================
  switchMode(newMode) {
    this.activeMode = newMode;
    localStorage.setItem('adforge_mode', newMode);
    this.updateModeUI();
    this.showToast(`Switched to ${newMode === 'sim' ? 'Demo / Simulation Mode' : 'Live Meta Muse Mode'}`);
  }

  updateModeUI() {
    const isSim = this.activeMode === 'sim';

    if (isSim) {
      this.btnModeSim.classList.add('active');
      this.btnModeLive.classList.remove('active');

      this.modeBanner.classList.remove('live-mode');
      this.bannerBadge.className = 'banner-badge sim-badge';
      this.bannerBadge.textContent = 'DEMO / SIMULATION MODE';
      this.bannerText.textContent = 'Running zero-cost interactive simulation with Meta Muse Spark reasoning logic. Ready to synthesize full campaigns without burning API tokens.';
      this.btnBannerAction.textContent = 'Enter Live API Key';

      this.heroModeSub.textContent = 'Simulation Engine Active';
      this.radioSimMode.checked = true;
    } else {
      this.btnModeLive.classList.add('active');
      this.btnModeSim.classList.remove('active');

      this.modeBanner.classList.add('live-mode');
      this.bannerBadge.className = 'banner-badge live-badge';
      this.bannerBadge.textContent = 'LIVE META MUSE API';
      this.bannerText.textContent = 'Connected directly to Meta official Model API (https://api.meta.ai/v1). Real-time streaming from Meta Muse Spark reasoning clusters.';
      this.btnBannerAction.textContent = 'Switch to Simulation';

      this.heroModeSub.textContent = 'Live Meta API Active';
      this.radioLiveMode.checked = true;
    }
  }

  loadSavedSettings() {
    const key = localStorage.getItem('meta_api_key') || '';
    const url = localStorage.getItem('meta_base_url') || 'https://api.meta.ai/v1';
    this.metaApiKeyInput.value = key;
    this.metaBaseUrlInput.value = url;

    if (key && this.activeMode === 'live') {
      this.keyStatusText.textContent = '✓ Meta API Key configured locally';
    }
  }

  saveSettings() {
    const key = this.metaApiKeyInput.value.trim();
    const url = this.metaBaseUrlInput.value.trim() || 'https://api.meta.ai/v1';
    const selectedRadio = document.querySelector('input[name="modalModeRadio"]:checked');
    const selectedMode = selectedRadio ? selectedRadio.value : 'sim';

    localStorage.setItem('meta_api_key', key);
    localStorage.setItem('meta_base_url', url);

    this.activeMode = selectedMode;
    localStorage.setItem('adforge_mode', selectedMode);

    this.updateModeUI();
    this.closeSettingsModal();
    this.showToast('API Configuration saved successfully!');
  }

  async testMetaApiConnection() {
    const key = this.metaApiKeyInput.value.trim();
    if (!key) {
      this.keyStatusText.textContent = '⚠️ Please enter a Meta API key first.';
      this.keyStatusText.style.color = '#f59e0b';
      return;
    }

    this.keyStatusText.textContent = 'Pinging Meta API...';
    this.keyStatusText.style.color = '#38bdf8';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-meta-api-key': key },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Ping' }],
          model: 'muse-spark-1.3',
          max_tokens: 5,
          simulationMode: false
        })
      });

      if (res.ok) {
        this.keyStatusText.textContent = '✓ Successfully connected to Meta Model API!';
        this.keyStatusText.style.color = '#34d399';
      } else {
        const err = await res.json();
        this.keyStatusText.textContent = `❌ ${err.error || 'Connection failed'}`;
        this.keyStatusText.style.color = '#f43f5e';
      }
    } catch (e) {
      this.keyStatusText.textContent = `❌ Network Error: ${e.message}`;
      this.keyStatusText.style.color = '#f43f5e';
    }
  }

  async checkBackendStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        if (data.hasServerKey && !localStorage.getItem('meta_api_key')) {
          this.keyStatusText.textContent = '✓ Server-side Meta API Key detected';
        }
      }
    } catch (_) {}
  }

  // =========================================================================
  // Sample Data & Form Handling
  // =========================================================================
  loadCompanySample(sampleKey) {
    const sample = COMPANY_SAMPLES[sampleKey];
    if (!sample) return;

    this.inputProjectName.value = sample.name;
    this.inputAudience.value = sample.audience;
    this.inputDescription.value = sample.description;
    this.inputFeatures.value = sample.features;
    this.inputTechnology.value = sample.technology;
    this.inputPricing.value = sample.pricing;
    this.selectCampaignTone.value = sample.tone;
    this.inputCampaignCta.value = sample.cta;

    this.updateFormPreview();
    this.showToast(`Loaded "${sample.name}" project details`);
  }

  resetForm() {
    this.inputProjectName.value = '';
    this.inputAudience.value = '';
    this.inputDescription.value = '';
    this.inputFeatures.value = '';
    this.inputTechnology.value = '';
    this.inputPricing.value = '';
    this.inputCampaignCta.value = 'Start 14-Day Free Trial';
    this.updateFormPreview();
    this.showToast('Cleared project form');
  }

  updateFormPreview() {
    const name = this.inputProjectName.value.trim() || 'Your Project';
    const audience = this.inputAudience.value.trim() || 'Target Customers';
    const tone = this.selectCampaignTone.value;

    this.previewProjectName.textContent = name;
    this.heroMetaSummary.textContent = `Targeting ${audience} with ${tone} tone across Instagram, LinkedIn, Web, and Sales Pitch.`;
  }

  getFormData() {
    return {
      name: this.inputProjectName.value.trim() || 'NovaPulse AI',
      audience: this.inputAudience.value.trim() || 'DevOps & Tech Leaders',
      description: this.inputDescription.value.trim() || 'Autonomous cloud architecture optimization platform.',
      features: this.inputFeatures.value.trim() || 'Real-time telemetry, automated pod rightsizing, predictive spot bidding',
      technology: this.inputTechnology.value.trim() || 'Next.js 15, Rust, Kubernetes Operator, Meta Muse Spark',
      pricing: this.inputPricing.value.trim() || 'Free 14-day trial, $49/node/mo for Pro',
      tone: this.selectCampaignTone.value,
      cta: this.inputCampaignCta.value.trim() || 'Start 14-Day Free Trial'
    };
  }

  // =========================================================================
  // Campaign Generation Pipeline (Meta Muse Reasoning)
  // =========================================================================
  async generateFullCampaign() {
    if (this.isStreaming) return;
    const project = this.getFormData();

    this.isStreaming = true;
    this.btnGenerateCampaign.disabled = true;
    this.btnRegenerateFullCampaign.disabled = true;
    this.generateBtnText.textContent = 'Synthesizing Campaign...';
    this.heroStatusBadge.textContent = 'Reasoning Active';
    this.heroStatusBadge.style.color = '#c084fc';
    this.heroStatusBadge.style.background = 'rgba(168, 85, 247, 0.2)';

    // Reset Metrics
    this.startTime = Date.now();
    this.firstTokenTime = 0;
    this.tokenCount = 0;
    this.reasoningTokenCount = 0;
    this.metricStatus.textContent = 'Contemplating...';
    this.metricStatus.className = 'metric-val status-contemplating';
    this.metricTtft.textContent = '-- ms';
    this.metricSpeed.textContent = '-- tok/s';
    this.metricReasoning.textContent = '0';
    this.metricTotal.textContent = '0';

    // Show Contemplation Panel if enabled
    const contemplationWanted = this.chkContemplation.checked;
    if (contemplationWanted) {
      this.contemplationPanel.style.display = 'block';
      this.contemplationSteps.innerHTML = '';
      this.contemplationTimerEl.textContent = '0.0s';
      this.startContemplationTimer();
    } else {
      this.contemplationPanel.style.display = 'none';
    }

    // Prepare Prompt for Meta Muse Spark
    const promptText = `
You are Meta Muse Spark, an advanced reasoning and marketing superintelligence.
Synthesize a complete, enterprise-grade GTM advertising and sales campaign for this project:

[PROJECT DETAILS]
- Project Name: ${project.name}
- Target Customers: ${project.audience}
- Description: ${project.description}
- Key Features: ${project.features}
- Technology Stack: ${project.technology}
- Pricing & Business Model: ${project.pricing}
- Campaign Tone: ${project.tone}
- Primary Call to Action: ${project.cta}

Please generate the campaign with these 5 distinct sections formatted with clean Markdown headers:
## 📊 MARKETING STRATEGY & POSITIONING
## 📸 INSTAGRAM ADVERTISEMENT
## 💼 LINKEDIN ADVERTISEMENT
## 🌐 WEBSITE PROMOTIONAL COPY
## 🎙️ 30-SECOND SALES PITCH
`;

    const payload = {
      model: this.modelSelect.value,
      temperature: 0.5,
      max_tokens: 3000,
      contemplation: contemplationWanted,
      simulationMode: this.activeMode === 'sim',
      apiKey: localStorage.getItem('meta_api_key') || '',
      projectDetails: project,
      messages: [
        {
          role: 'system',
          content: 'You are Meta Muse Spark, an autonomous reasoning agent specializing in high-conversion tech marketing, B2B sales cadence, and social advertising architectures.'
        },
        { role: 'user', content: promptText }
      ]
    };

    let fullMarkdown = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = null;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            if (dataStr === '[DONE]') {
              this.finalizeCampaign(fullMarkdown, project);
              continue;
            }

            try {
              const data = JSON.parse(dataStr);
              this.handleStreamMessage(currentEvent || 'chunk', data, chunk => {
                fullMarkdown += chunk;
                // Live update preview in full brief pane
                this.fullBriefContentArea.innerHTML = parseMarkdown(fullMarkdown);
              });
            } catch (_) {}
          }
        }
      }

      this.finalizeCampaign(fullMarkdown, project);
    } catch (err) {
      this.stopContemplationTimer();
      this.metricStatus.textContent = 'Error';
      this.metricStatus.className = 'metric-val';
      this.metricStatus.style.color = '#f43f5e';
      this.showToast(`Generation Error: ${err.message}`, true);
    } finally {
      this.isStreaming = false;
      this.btnGenerateCampaign.disabled = false;
      this.btnRegenerateFullCampaign.disabled = false;
      this.generateBtnText.textContent = 'Generate Full Campaign';
      this.heroStatusBadge.textContent = 'Completed';
      this.heroStatusBadge.style.color = '#34d399';
      this.heroStatusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
    }
  }

  handleStreamMessage(event, data, onChunk) {
    if (!this.firstTokenTime) {
      this.firstTokenTime = Date.now();
      const ttft = this.firstTokenTime - this.startTime;
      this.metricTtft.textContent = `${ttft} ms`;
    }

    if (event === 'contemplation' || data.type === 'reasoning' || data.reasoning_content) {
      const stepText = data.text || data.reasoning_content || data.content;
      this.addContemplationStep(stepText);
      this.reasoningTokenCount += 12;
      this.metricReasoning.textContent = this.reasoningTokenCount;
      return;
    }

    if (event === 'chunk' || data.text || (data.choices && data.choices[0]?.delta?.content)) {
      this.metricStatus.textContent = 'Synthesizing...';
      this.metricStatus.className = 'metric-val status-streaming';

      const chunk = data.text || data.choices[0]?.delta?.content || '';
      if (chunk) {
        this.tokenCount += 1;
        this.metricTotal.textContent = this.tokenCount + this.reasoningTokenCount;

        const elapsedSec = (Date.now() - this.startTime) / 1000;
        if (elapsedSec > 0.5) {
          const speed = Math.round((this.tokenCount + this.reasoningTokenCount) / elapsedSec);
          this.metricSpeed.textContent = `${speed} tok/s`;
        }

        onChunk(chunk);
      }
      return;
    }

    if (event === 'done') {
      if (data.total_tokens) this.metricTotal.textContent = data.total_tokens;
      if (data.reasoning_tokens) this.metricReasoning.textContent = data.reasoning_tokens;
    }
  }

  addContemplationStep(text) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'thinking-step-item';
    stepDiv.innerHTML = `<span class="step-marker">⚡</span> <span>${escapeHtml(text)}</span>`;
    this.contemplationSteps.appendChild(stepDiv);
    this.contemplationSteps.parentElement.scrollTop = this.contemplationSteps.parentElement.scrollHeight;
  }

  startContemplationTimer() {
    const t0 = Date.now();
    this.contemplationTimer = setInterval(() => {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      this.contemplationTimerEl.textContent = `${elapsed}s`;
    }, 100);
  }

  stopContemplationTimer() {
    if (this.contemplationTimer) {
      clearInterval(this.contemplationTimer);
      this.contemplationTimer = null;
    }
  }

  // =========================================================================
  // Campaign Ingestion & Multi-Channel View Updates
  // =========================================================================
  finalizeCampaign(fullMarkdown, project) {
    this.stopContemplationTimer();
    this.metricStatus.textContent = 'Completed';
    this.metricStatus.className = 'metric-val status-done';

    // Parse the 5 sections from the markdown
    const sections = this.parseSectionsFromMarkdown(fullMarkdown);

    this.currentCampaign = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      project,
      rawMarkdown: fullMarkdown,
      sections
    };

    // Save to history
    this.history.unshift(this.currentCampaign);
    if (this.history.length > 25) this.history.pop();
    localStorage.setItem('adforge_campaigns', JSON.stringify(this.history));
    this.updateSavedCountBadge();

    // Render into UI components
    this.renderCampaignData(this.currentCampaign);

    // Scroll smoothly to Step 3 (Generated Ads)
    const adsSection = document.getElementById('sectionGeneratedAds');
    adsSection.scrollIntoView({ behavior: 'smooth' });

    // Mark stepper node
    const stepNode3 = document.getElementById('stepNode3');
    this.setActiveStepNode(stepNode3);

    this.showToast('Omnichannel campaign generated successfully!');
  }

  parseSectionsFromMarkdown(md) {
    const sections = {
      strategy: '',
      instagram: '',
      linkedin: '',
      website: '',
      pitch: ''
    };

    // Split by Markdown level-2 headers
    const chunks = md.split(/(?=^##\s+)/m);

    for (const chunk of chunks) {
      const lower = chunk.toLowerCase();
      if (lower.includes('strategy') || lower.includes('positioning')) {
        sections.strategy = chunk;
      } else if (lower.includes('instagram')) {
        sections.instagram = chunk;
      } else if (lower.includes('linkedin')) {
        sections.linkedin = chunk;
      } else if (lower.includes('website')) {
        sections.website = chunk;
      } else if (lower.includes('sales pitch') || lower.includes('30-second')) {
        sections.pitch = chunk;
      }
    }

    return sections;
  }

  renderCampaignData(campaign) {
    const { project, sections, rawMarkdown } = campaign;

    // Hide empty placeholder and show panes
    this.campaignPlaceholder.style.display = 'none';

    // 1. Strategy
    this.strategyContentArea.innerHTML = parseMarkdown(sections.strategy || '## 📊 MARKETING STRATEGY\n\nGenerated strategy details are ready.');

    // 2. Instagram
    this.igHandle.textContent = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ai`;
    this.igVisualHeadline.textContent = `Slash Waste with ${project.name}`;
    this.igVisualSub.textContent = project.features.split(',')[0] || 'Next-Gen Architecture';
    this.igCtaBannerText.textContent = project.cta || 'Learn More';
    this.igCaptionRender.innerHTML = parseMarkdown(sections.instagram || '');
    this.igCreativeNotes.innerHTML = parseMarkdown(this.extractCreativeDirection(sections.instagram));
    this.igRawCopy.textContent = sections.instagram;

    // 3. LinkedIn
    this.liCompanyName.textContent = project.name;
    this.liPostBody.innerHTML = parseMarkdown(sections.linkedin || '');
    this.liThumbTitle.textContent = `${project.name} Official Platform`;
    this.liLinkDomain.textContent = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ai`;
    this.liLinkHeadline.textContent = `Modern Solutions for ${project.audience.split(',')[0] || 'Tech Teams'}`;
    this.liLinkCtaBtn.textContent = project.cta || 'Learn More';

    // 4. Website
    this.webBrowserUrl.textContent = `https://${project.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ai`;
    this.webHeroBadge.textContent = `⚡ THE DEFINITIVE SOLUTION FOR ${project.name.toUpperCase()}`;
    this.webHeroH1.textContent = `The Intelligent Backbone for Modern ${project.audience.split(',')[0] || 'Engineering Teams'}.`;
    this.webHeroSub.textContent = project.description;
    this.webPrimaryCtaBtn.textContent = `${project.cta} →`;
    this.webFullCopyRender.innerHTML = parseMarkdown(sections.website || '');

    // 5. Sales Pitch (Teleprompter)
    this.pitchOverviewRender.innerHTML = parseMarkdown(sections.pitch || '');
    this.extractAndRenderTeleprompterBeats(sections.pitch, project);

    // 6. Full Brief
    this.fullBriefContentArea.innerHTML = parseMarkdown(rawMarkdown);

    // Default to active tab (Strategy)
    this.switchChannelTab('tabStrategy');
  }

  extractCreativeDirection(igText) {
    const match = igText.match(/###\s*Visual Concept Direction([\s\S]*?)(?=###\s*Caption|$)/i);
    return match ? match[1].trim() : '> **Visual Format:** High-contrast Dark Mode Carousel (1:1 Aspect Ratio) with electric cyan typography.';
  }

  extractAndRenderTeleprompterBeats(pitchText, project) {
    // Look for Hook, Problem, Moat, CTA in pitchText
    const hookMatch = pitchText.match(/(?:THE HOOK[\s\S]*?>\s*)([^\n\r]+)/i);
    const probMatch = pitchText.match(/(?:THE PROBLEM & SOLUTION[\s\S]*?>\s*)([^\n\r]+)/i);
    const moatMatch = pitchText.match(/(?:THE UNFAIR ADVANTAGE[\s\S]*?>\s*)([^\n\r]+)/i);
    const ctaMatch = pitchText.match(/(?:THE CALL TO ACTION[\s\S]*?>\s*)([^\n\r]+)/i);

    if (hookMatch) this.speechHook.textContent = hookMatch[1].replace(/["']/g, '');
    if (probMatch) this.speechProblem.textContent = probMatch[1].replace(/["']/g, '');
    if (moatMatch) this.speechMoat.textContent = moatMatch[1].replace(/["']/g, '');
    if (ctaMatch) this.speechCta.textContent = ctaMatch[1].replace(/["']/g, '');

    this.coachDeliveryText.textContent = `Deliver with confident, conversational authority. Emphasize the opening statistic and close cleanly on "${project.cta}".`;
  }

  // =========================================================================
  // Individual Section Regeneration
  // =========================================================================
  async regenerateSpecificAsset(sectionKey) {
    if (this.isStreaming) return;
    const project = this.getFormData();

    this.showToast(`Regenerating ${sectionKey} with Meta Muse Spark...`);
    const promptText = `
Regenerate ONLY the ${sectionKey} for ${project.name}.
Target Customers: ${project.audience}
Description: ${project.description}
Features: ${project.features}
Technology: ${project.technology}
Pricing: ${project.pricing}
Tone: ${project.tone}
CTA: ${project.cta}

Format with appropriate Markdown headers for the ${sectionKey} section.
`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelSelect.value,
          messages: [{ role: 'user', content: promptText }],
          simulationMode: this.activeMode === 'sim',
          apiKey: localStorage.getItem('meta_api_key') || '',
          regenerateSection: sectionKey,
          projectDetails: project
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let newSectionContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.replace('data:', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) newSectionContent += data.text;
            } catch (_) {}
          }
        }
      }

      // Update specific section
      if (this.currentCampaign) {
        this.currentCampaign.sections[sectionKey] = newSectionContent;
        this.renderCampaignData(this.currentCampaign);
      }
      this.showToast(`✓ ${sectionKey.toUpperCase()} regenerated successfully!`);
    } catch (e) {
      this.showToast(`Regeneration failed: ${e.message}`, true);
    }
  }

  // =========================================================================
  // Channel Tab Switcher & Navigation
  // =========================================================================
  switchChannelTab(targetTabId) {
    this.channelTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === targetTabId);
    });

    this.channelPanes.forEach(pane => {
      pane.style.display = pane.id === targetTabId ? 'block' : 'none';
    });

    // Keep the active tab visible inside the horizontally scrollable tab bar (mobile)
    const activeBtn = Array.from(this.channelTabs).find(b => b.dataset.tab === targetTabId);
    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  setActiveStepNode(activeNode) {
    this.stepperNodes.forEach(node => {
      node.classList.remove('active');
    });
    activeNode.classList.add('active');

    // Keep the active step visible inside the swipeable stepper strip (mobile)
    if (activeNode.scrollIntoView) {
      activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // =========================================================================
  // 30-Second Sales Pitch Teleprompter Engine
  // =========================================================================
  toggleTeleprompter() {
    if (this.teleprompterActive) {
      this.pauseTeleprompter();
    } else {
      this.startTeleprompter();
    }
  }

  startTeleprompter() {
    this.teleprompterActive = true;
    this.telePlayIcon.textContent = '⏸';
    this.telePlayText.textContent = 'Pause Practice';
    this.clockStatusText.textContent = 'Delivering Live Pitch...';
    this.clockStatusText.style.color = '#38bdf8';

    if (this.teleprompterSeconds <= 0) {
      this.teleprompterSeconds = 30;
    }

    this.teleprompterInterval = setInterval(() => {
      this.teleprompterSeconds--;
      this.clockSeconds.textContent = this.teleprompterSeconds;

      // Update progress bar
      const elapsed = 30 - this.teleprompterSeconds;
      const pct = (elapsed / 30) * 100;
      this.pitchProgressFill.style.width = `${pct}%`;

      // Highlight active beat
      this.updateActiveTeleprompterBeat(elapsed);

      if (this.teleprompterSeconds <= 0) {
        this.finishTeleprompter();
      }
    }, 1000);
  }

  pauseTeleprompter() {
    this.teleprompterActive = false;
    clearInterval(this.teleprompterInterval);
    this.telePlayIcon.textContent = '▶';
    this.telePlayText.textContent = 'Resume Practice';
    this.clockStatusText.textContent = 'Paused';
    this.clockStatusText.style.color = '#f59e0b';
  }

  resetTeleprompter() {
    this.pauseTeleprompter();
    this.teleprompterSeconds = 30;
    this.clockSeconds.textContent = '30';
    this.pitchProgressFill.style.width = '0%';
    this.clockStatusText.textContent = 'Ready for Delivery';
    this.clockStatusText.style.color = '#fff';
    this.telePlayText.textContent = 'Start 30s Practice';
    this.teleprompterBeats.forEach(b => b.classList.remove('current-beat'));
  }

  finishTeleprompter() {
    this.pauseTeleprompter();
    this.clockStatusText.textContent = '🎉 30s Pitch Finished! Perfect cadence.';
    this.clockStatusText.style.color = '#34d399';
    this.telePlayText.textContent = 'Practice Again';
    this.showToast('Great job! 30-second elevator pitch complete.');
  }

  updateActiveTeleprompterBeat(elapsedSeconds) {
    this.teleprompterBeats.forEach(beat => {
      const start = parseInt(beat.dataset.start, 10);
      const end = parseInt(beat.dataset.end, 10);
      if (elapsedSeconds >= start && elapsedSeconds <= end) {
        beat.classList.add('current-beat');
      } else {
        beat.classList.remove('current-beat');
      }
    });
  }

  // =========================================================================
  // Clipboard & Download Utilities
  // =========================================================================
  copyCampaignToClipboard() {
    if (!this.currentCampaign) {
      this.showToast('Please generate a campaign first.', true);
      return;
    }
    navigator.clipboard.writeText(this.currentCampaign.rawMarkdown);
    this.copyAllBtnText.textContent = 'Copied!';
    setTimeout(() => { this.copyAllBtnText.textContent = 'Copy Campaign'; }, 1800);
    this.showToast('✓ Full campaign markdown copied to clipboard!');
  }

  copyPitchScript() {
    const text = `
30-SECOND SALES PITCH:
[0:00 - 0:07 Hook] ${this.speechHook.textContent}
[0:08 - 0:17 Problem & Solution] ${this.speechProblem.textContent}
[0:18 - 0:24 Moat] ${this.speechMoat.textContent}
[0:25 - 0:30 CTA] ${this.speechCta.textContent}
`;
    this.copySpecificText(text.trim(), 'Sales Pitch script copied!');
  }

  copySpecificText(text, msg) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.showToast(msg || 'Copied to clipboard!');
  }

  downloadCampaign(format) {
    if (!this.currentCampaign) {
      this.showToast('Please generate a campaign first.', true);
      return;
    }

    const projName = this.currentCampaign.project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'markdown') {
      content = `# MUSE ADFORGE CAMPAIGN BRIEF: ${this.currentCampaign.project.name}\n\nGenerated on: ${this.currentCampaign.timestamp}\n\n` + this.currentCampaign.rawMarkdown;
      filename = `adforge-${projName}-campaign.md`;
      mimeType = 'text/markdown';
    } else if (format === 'html') {
      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Muse AdForge Campaign - ${this.currentCampaign.project.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 860px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; display: block; overflow-x: auto; }
    body { overflow-wrap: anywhere; }
    @media (max-width: 600px) { body { margin: 20px auto; padding: 0 14px; } }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; }
    blockquote { border-left: 4px solid #0284c7; padding-left: 14px; color: #475569; font-style: italic; }
  </style>
</head>
<body>
  <h1>Muse AdForge Campaign: ${this.currentCampaign.project.name}</h1>
  <p><strong>Generated on:</strong> ${this.currentCampaign.timestamp} | <strong>Engine:</strong> Meta Muse Spark</p>
  <hr>
  ${parseMarkdown(this.currentCampaign.rawMarkdown)}
</body>
</html>`;
      filename = `adforge-${projName}-campaign.html`;
      mimeType = 'text/html';
    } else if (format === 'json') {
      content = JSON.stringify(this.currentCampaign, null, 2);
      filename = `adforge-${projName}-campaign.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded ${filename}`);
  }

  // =========================================================================
  // Saved History Drawer
  // =========================================================================
  openHistoryDrawer() {
    this.renderHistoryList();
    this.historyDrawer.style.display = 'flex';
  }

  closeHistoryDrawer() {
    this.historyDrawer.style.display = 'none';
  }

  renderHistoryList() {
    if (this.history.length === 0) {
      this.historyListContainer.innerHTML = '<p class="empty-history-text">No campaigns saved yet.</p>';
      return;
    }

    this.historyListContainer.innerHTML = this.history.map((item, idx) => `
      <div class="history-item-card" data-idx="${idx}">
        <div class="history-item-top">
          <span class="history-item-name">${escapeHtml(item.project.name)}</span>
          <span class="history-item-time">${new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="history-item-desc">${escapeHtml(item.project.description)}</div>
      </div>
    `).join('');

    this.historyListContainer.querySelectorAll('.history-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const item = this.history[card.dataset.idx];
        if (item) {
          this.currentCampaign = item;
          // Populate form
          this.inputProjectName.value = item.project.name;
          this.inputAudience.value = item.project.audience;
          this.inputDescription.value = item.project.description;
          this.inputFeatures.value = item.project.features;
          this.inputTechnology.value = item.project.technology;
          this.inputPricing.value = item.project.pricing;
          this.selectCampaignTone.value = item.project.tone;
          this.inputCampaignCta.value = item.project.cta;
          this.updateFormPreview();

          // Render campaign
          this.renderCampaignData(item);
          this.closeHistoryDrawer();
          this.showToast(`Restored campaign for ${item.project.name}`);
        }
      });
    });
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('adforge_campaigns');
    this.renderHistoryList();
    this.updateSavedCountBadge();
    this.showToast('Cleared all saved campaigns');
  }

  updateSavedCountBadge() {
    this.savedCountBadge.textContent = this.history.length;
  }

  // =========================================================================
  // Settings Modal Controls
  // =========================================================================
  openSettingsModal() {
    this.loadSavedSettings();
    this.settingsModal.style.display = 'flex';
  }

  closeSettingsModal() {
    this.settingsModal.style.display = 'none';
  }

  // =========================================================================
  // Toast Notifications
  // =========================================================================
  showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) {
      toast.style.borderColor = '#f43f5e';
      toast.innerHTML = `<span>❌</span> <span>${escapeHtml(message)}</span>`;
    } else {
      toast.innerHTML = `<span>✓</span> <span>${escapeHtml(message)}</span>`;
    }

    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }
}

// Utility: HTML Escaping
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Lightweight Markdown Parser
function parseMarkdown(md) {
  if (!md) return '';
  let html = md;

  // Code blocks
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (m, lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, (m, c) => `<code>${escapeHtml(c)}</code>`);

  // Blockquotes
  html = html.replace(/^> (.*)$/gim, '<blockquote>$1</blockquote>');

  // Headings
  html = html.replace(/^### (.*)$/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gim, '<h1>$1</h1>');

  // Bold & Italics
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Tables
  html = html.replace(/(\|.+\|\n)+/g, tableBlock => {
    const rows = tableBlock.trim().split('\n');
    let out = '<table>';
    rows.forEach((row, idx) => {
      if (row.includes('---')) return;
      const cols = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      out += '<tr>';
      cols.forEach(col => {
        out += idx === 0 ? `<th>${col.trim()}</th>` : `<td>${col.trim()}</td>`;
      });
      out += '</tr>';
    });
    out += '</table>';
    return out;
  });

  // Bullet Lists
  html = html.replace(/^- (.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<blockquote') || p.startsWith('<table') || p.startsWith('<ul')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

// Responsive helper: keep CSS offsets in sync with the real (wrapping) header/stepper height
function syncStickyOffsets() {
  const header = document.querySelector('.app-header');
  const stepper = document.querySelector('.workflow-stepper');
  if (!header) return;
  const headerH = header.offsetHeight;
  const stepperSticky = stepper && getComputedStyle(stepper).position === 'sticky';
  const offset = headerH + (stepperSticky ? stepper.offsetHeight : 0);
  const root = document.documentElement.style;
  root.setProperty('--header-h', headerH + 'px');
  root.setProperty('--sticky-offset', offset + 'px');
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.adForge = new MuseAdForgeStudio();

  syncStickyOffsets();
  window.addEventListener('resize', syncStickyOffsets);
  window.addEventListener('orientationchange', () => setTimeout(syncStickyOffsets, 250));
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(syncStickyOffsets);
    const header = document.querySelector('.app-header');
    if (header) ro.observe(header);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncStickyOffsets);

  // Close any open dropdown when tapping anywhere else (touch-friendly)
  document.addEventListener('touchstart', (e) => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu.style.display === 'block' && !menu.parentElement.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
  }, { passive: true });
});
