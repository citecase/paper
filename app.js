// State Management
let state = {
  title: '',
  author: '',
  source: '',
  date: '',
  image: '',
  bodyHtml: '',
  excerpt: '',
  
  // Customization Options
  theme: 'theme-vintage',
  columns: 'cols-3',
  fontSize: 100,
  lineHeight: 'lh-normal',
  mastheadTitle: 'THE DAILY CHRONICLE',
  mastheadFont: 'font-blackletter',
  mastheadMotto: 'All the news fit to print. Vol. I No. 1',
  location: 'METROPOLIS',
  price: '$0.25',
  weather: 'Sunny, 72°F',
  inkDensity: 100
};

// DOM Elements Cache
const DOM = {
  landingScreen: document.getElementById('landing-screen'),
  loadingScreen: document.getElementById('loading-screen'),
  workspaceScreen: document.getElementById('workspace-screen'),
  loadingStatus: document.getElementById('loading-status'),
  
  // Paper display elements
  paper: document.getElementById('newspaper-paper'),
  displayTitle: document.getElementById('paper-display-title'),
  displayMotto: document.getElementById('paper-display-motto'),
  displayDate: document.getElementById('paper-display-date'),
  displayWeather: document.getElementById('paper-display-weather'),
  displayLocation: document.getElementById('paper-display-location'),
  displayPrice: document.getElementById('paper-display-price'),
  
  displayHeadline: document.getElementById('paper-display-headline'),
  displayExcerpt: document.getElementById('paper-display-excerpt'),
  displayAuthor: document.getElementById('paper-display-author'),
  displaySource: document.getElementById('paper-display-source'),
  displayImage: document.getElementById('paper-display-image'),
  heroFigure: document.getElementById('paper-hero-figure'),
  displayBody: document.getElementById('paper-display-body'),
  
  // Controls inputs
  cfgTitle: document.getElementById('cfg-masthead-title'),
  cfgFont: document.getElementById('cfg-masthead-font'),
  cfgMotto: document.getElementById('cfg-masthead-motto'),
  cfgColumns: document.getElementById('cfg-columns'),
  cfgFontSize: document.getElementById('cfg-font-size'),
  fontSizeVal: document.getElementById('font-size-val'),
  cfgLineHeight: document.getElementById('cfg-line-height'),
  cfgInkDensity: document.getElementById('cfg-ink-density'),
  inkDensityVal: document.getElementById('ink-density-val'),
  cfgLocation: document.getElementById('cfg-location'),
  cfgPrice: document.getElementById('cfg-price'),
  cfgWeather: document.getElementById('cfg-weather'),
  
  // Modal Edit inputs
  editModal: document.getElementById('edit-modal'),
  editForm: document.getElementById('edit-form'),
  editHeadline: document.getElementById('edit-headline'),
  editSubhead: document.getElementById('edit-subhead'),
  editAuthor: document.getElementById('edit-author'),
  editSource: document.getElementById('edit-source'),
  editImage: document.getElementById('edit-image'),
  editBody: document.getElementById('edit-body')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupInteractiveEditing();
});

// ==========================================================================
// NAVIGATION & SCREENS
// ==========================================================================

function switchLandingTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  if (tabName === 'url') {
    document.querySelector('.tab-btn[onclick*="url"]').classList.add('active');
    document.getElementById('tab-url').classList.add('active');
  } else {
    document.querySelector('.tab-btn[onclick*="manual"]').classList.add('active');
    document.getElementById('tab-manual').classList.add('active');
  }
}

function showLanding() {
  DOM.workspaceScreen.classList.remove('active');
  DOM.loadingScreen.classList.remove('active');
  DOM.landingScreen.classList.add('active');
}

function showLoading(statusMessages, callback) {
  DOM.landingScreen.classList.remove('active');
  DOM.workspaceScreen.classList.remove('active');
  DOM.loadingScreen.classList.add('active');
  
  let currentMsgIndex = 0;
  DOM.loadingStatus.textContent = statusMessages[0];
  
  const interval = setInterval(() => {
    currentMsgIndex++;
    if (currentMsgIndex < statusMessages.length) {
      DOM.loadingStatus.textContent = statusMessages[currentMsgIndex];
    } else {
      clearInterval(interval);
      callback();
    }
  }, 1000);
}

function showWorkspace() {
  DOM.landingScreen.classList.remove('active');
  DOM.loadingScreen.classList.remove('active');
  DOM.workspaceScreen.classList.add('active');
  
  // Update control inputs to match current state
  DOM.cfgTitle.value = state.mastheadTitle;
  DOM.cfgMotto.value = state.mastheadMotto;
  DOM.cfgLocation.value = state.location;
  DOM.cfgPrice.value = state.price;
  DOM.cfgWeather.value = state.weather;
  DOM.cfgColumns.value = state.columns;
  DOM.cfgFontSize.value = state.fontSize;
  DOM.fontSizeVal.textContent = state.fontSize + '%';
  DOM.cfgLineHeight.value = state.lineHeight;
  DOM.cfgFont.value = state.mastheadFont;
  DOM.cfgInkDensity.value = state.inkDensity;
  DOM.inkDensityVal.textContent = state.inkDensity + '%';
  
  renderPaper();
}

// ==========================================================================
// FORM SUBMISSIONS & API
// ==========================================================================

async function handleUrlSubmit(event) {
  event.preventDefault();
  const url = document.getElementById('article-url').value.trim();
  if (!url) return;
  
  const loadingSteps = [
    "Establishing link to archives...",
    "Spinning the printing presses...",
    "Etching the lead type...",
    "Inking the rollers...",
    "Drafting column structures..."
  ];
  
  showLoading(loadingSteps, async () => {
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred.');
      }
      
      // Load scraped data into state
      state.title = data.title;
      state.author = data.author;
      state.source = data.siteName;
      state.date = data.publishedTime;
      state.image = data.image || '';
      state.bodyHtml = data.content;
      state.excerpt = data.excerpt || '';
      
      // Reset custom header to default title
      state.mastheadTitle = "THE DAILY CHRONICLE";
      
      showWorkspace();
    } catch (err) {
      alert(`Scraping failed: ${err.message}\n\nPlease try copying and pasting the text via the "Write From Scratch" tab.`);
      showLanding();
    }
  });
}

function handleManualSubmit(event) {
  event.preventDefault();
  
  state.title = document.getElementById('manual-title').value.trim();
  state.author = document.getElementById('manual-author').value.trim() || 'Staff Correspondent';
  state.source = document.getElementById('manual-site').value.trim() || 'The Daily Press';
  state.date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  state.image = document.getElementById('manual-image').value.trim();
  
  const rawText = document.getElementById('manual-content').value.trim();
  // Simple paragraph formatting
  state.bodyHtml = rawText
    .split(/\n\s*\n/)
    .map(p => `<p>${escapeHTML(p)}</p>`)
    .join('');
    
  state.excerpt = rawText.substring(0, 150) + '...';
  state.mastheadTitle = "THE DAILY PRESS";
  
  const loadingSteps = [
    "Setting margins...",
    "Arranging columns...",
    "Applying hot-metal ink..."
  ];
  
  showLoading(loadingSteps, () => {
    showWorkspace();
  });
}

function loadExample(url) {
  document.getElementById('article-url').value = url;
  // Trigger form submit
  document.getElementById('url-form').dispatchEvent(new Event('submit'));
}

// ==========================================================================
// RENDER & CONTROLS INTERACTIVE UPDATE
// ==========================================================================

function updateLayout() {
  state.mastheadTitle = DOM.cfgTitle.value;
  state.mastheadFont = DOM.cfgFont.value;
  state.mastheadMotto = DOM.cfgMotto.value;
  state.columns = DOM.cfgColumns.value;
  state.fontSize = parseInt(DOM.cfgFontSize.value);
  DOM.fontSizeVal.textContent = state.fontSize + '%';
  state.lineHeight = DOM.cfgLineHeight.value;
  state.inkDensity = parseInt(DOM.cfgInkDensity.value);
  DOM.inkDensityVal.textContent = state.inkDensity + '%';
  state.location = DOM.cfgLocation.value;
  state.price = DOM.cfgPrice.value;
  state.weather = DOM.cfgWeather.value;
  
  renderPaper();
}

function setTheme(themeName) {
  // Update state
  state.theme = themeName;
  
  // Update visual selection
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.theme-btn.${themeName}`).classList.add('active');
  
  renderPaper();
}

function renderPaper() {
  // 1. Set broadsheet container classes
  DOM.paper.className = `broadsheet ${state.theme} ${state.columns} ${state.mastheadFont} ${state.lineHeight}`;
  
  // 2. Adjust font size and ink opacity
  DOM.paper.style.fontSize = `${state.fontSize}%`;
  DOM.paper.style.setProperty('--ink-opacity', state.inkDensity / 100);
  
  // 3. Inject masthead text
  DOM.displayTitle.innerHTML = escapeHTML(state.mastheadTitle);
  DOM.displayMotto.innerHTML = escapeHTML(state.mastheadMotto);
  DOM.displayDate.innerHTML = state.date;
  DOM.displayLocation.innerHTML = escapeHTML(state.location);
  DOM.displayPrice.innerHTML = escapeHTML(state.price);
  DOM.displayWeather.innerHTML = escapeHTML(state.weather);
  
  // 4. Inject article details
  DOM.displayHeadline.innerHTML = escapeHTML(state.title);
  DOM.displayExcerpt.innerHTML = escapeHTML(state.excerpt);
  DOM.displayAuthor.innerHTML = escapeHTML(state.author);
  DOM.displaySource.innerHTML = escapeHTML(state.source);
  
  // Handle Hero Image display
  if (state.image) {
    DOM.displayImage.src = state.image;
    DOM.heroFigure.style.display = 'block';
  } else {
    DOM.heroFigure.style.display = 'none';
  }
  
  // 5. Inject body HTML
  DOM.displayBody.innerHTML = state.bodyHtml;
  
  // Re-setup live edit listener inside the DOM
  attachContentEditableSync();
}

// Enable direct double click or direct edit update back into state
function setupInteractiveEditing() {
  // Listen for focusout or blur on contenteditable components inside the broadsheet
  const syncElements = [
    { el: DOM.displayTitle, key: 'mastheadTitle' },
    { el: DOM.displayMotto, key: 'mastheadMotto' },
    { el: DOM.displayWeather, key: 'weather' },
    { el: DOM.displayHeadline, key: 'title' },
    { el: DOM.displayExcerpt, key: 'excerpt' },
    { el: DOM.displayAuthor, key: 'author' },
    { el: DOM.displaySource, key: 'source' },
    { el: DOM.displayLocation, key: 'location' },
    { el: DOM.displayPrice, key: 'price' }
  ];
  
  syncElements.forEach(item => {
    item.el.addEventListener('blur', () => {
      state[item.key] = item.el.textContent.trim();
      // Sync control panel input values back
      if (item.key === 'mastheadTitle') DOM.cfgTitle.value = state.mastheadTitle;
      if (item.key === 'mastheadMotto') DOM.cfgMotto.value = state.mastheadMotto;
      if (item.key === 'weather') DOM.cfgWeather.value = state.weather;
      if (item.key === 'location') DOM.cfgLocation.value = state.location;
      if (item.key === 'price') DOM.cfgPrice.value = state.price;
    });
  });
}

function attachContentEditableSync() {
  // Sync the article body contenteditable text directly back to state.bodyHtml on blur
  DOM.displayBody.addEventListener('blur', () => {
    state.bodyHtml = DOM.displayBody.innerHTML;
  }, { once: true }); // Prevent stacked listeners
}

// ==========================================================================
// MODAL RICH EDIT DIALOG
// ==========================================================================

function openEditModal() {
  DOM.editHeadline.value = state.title;
  DOM.editSubhead.value = state.excerpt;
  DOM.editAuthor.value = state.author;
  DOM.editSource.value = state.source;
  DOM.editImage.value = state.image;
  DOM.editBody.value = state.bodyHtml;
  
  DOM.editModal.showModal();
}

function closeEditModal() {
  DOM.editModal.close();
}

function handleEditModalSubmit(event) {
  event.preventDefault();
  
  state.title = DOM.editHeadline.value.trim();
  state.excerpt = DOM.editSubhead.value.trim();
  state.author = DOM.editAuthor.value.trim();
  state.source = DOM.editSource.value.trim();
  state.image = DOM.editImage.value.trim();
  state.bodyHtml = DOM.editBody.value.trim();
  
  renderPaper();
  closeEditModal();
}

// ==========================================================================
// UTILITIES
// ==========================================================================

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// High Quality PNG Export
function downloadPNG() {
  const loadingSteps = [
    "Preheating printing plates...",
    "Aligning ink rollers...",
    "Tracing typography vectors...",
    "Exporting high-quality PNG..."
  ];

  // Overlay loading screen without hiding the workspace (so html2canvas can read it in the DOM tree)
  DOM.loadingScreen.classList.add('active');
  DOM.loadingStatus.textContent = loadingSteps[0];
  
  let stepIndex = 0;
  const interval = setInterval(() => {
    stepIndex++;
    if (stepIndex < loadingSteps.length) {
      DOM.loadingStatus.textContent = loadingSteps[stepIndex];
    } else {
      clearInterval(interval);
      
      const paperElement = document.getElementById('newspaper-paper');
      
      // Configure html2canvas options
      const options = {
        scale: 2.5, // 2.5x resolution for ultra crisp details
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // Keep transparent canvas backdrop to highlight paper color
        logging: false,
        onclone: (clonedDoc) => {
          // Enforce visible states in the cloned document
          const clonedPaper = clonedDoc.getElementById('newspaper-paper');
          if (clonedPaper) {
            clonedPaper.style.boxShadow = 'none';
            clonedPaper.style.transform = 'none';
            clonedPaper.style.margin = '0';
            clonedPaper.style.width = '980px'; // Enforce full broadsheet width for export
          }
        }
      };

      html2canvas(paperElement, options)
        .then(canvas => {
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png');
          
          // Trigger browser download link
          const link = document.createElement('a');
          const sanitizedTitle = state.title ? state.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'newspaper';
          const filename = `${sanitizedTitle}_editorial.png`;
          link.download = filename;
          link.href = dataUrl;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Hide loading overlay
          DOM.loadingScreen.classList.remove('active');
        })
        .catch(error => {
          console.error('PNG export failed:', error);
          alert('Failed to export PNG image: ' + error.message);
          DOM.loadingScreen.classList.remove('active');
        });
    }
  }, 800);
}
