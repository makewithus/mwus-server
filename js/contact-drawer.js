/**
 * makewithus® — Interactive Contact & Investor Drawer
 * Native integration matching site animation, typography & behavior.
 */
(function () {
  'use strict';

  // India or International (US / UK / UAE called out); "Other" reveals a free-text country input
  const countryField = (id) => `
              <select id="${id}" class="cd-select" required>
                <option value="India" selected>India</option>
                <optgroup label="International">
                  <option value="United States">United States (US)</option>
                  <option value="United Kingdom">United Kingdom (UK)</option>
                  <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                  <option value="Other">Other country</option>
                </optgroup>
              </select>
              <input type="text" id="${id}-other" class="cd-input" placeholder="Which country?" aria-label="Country name" hidden>`;

  // Budget tiers: India is shown in rupees, every other country in dollars (same tiers, rounded)
  const BUDGETS = {
    INR: ['Flexible / Discovery Stage', '₹4 – 12 Lakh', '₹12 – 30 Lakh', '₹30 – 65 Lakh', '₹65 Lakh+'],
    USD: ['Flexible / Discovery Stage', '$5,000 – $15,000', '$15,000 – $35,000', '$35,000 – $75,000', '$75,000+'],
  };
  const DEFAULT_BUDGET = 2;

  const DRAWER_HTML = `
  <div id="contact-drawer-overlay" aria-hidden="true"></div>
  <aside id="contact-drawer" role="dialog" aria-modal="true" aria-label="Contact makewithus">
    <!-- Drawer Header -->
    <div class="cd-header">
      <div>
        <div class="cd-brand-title">
          <span>makewithus®</span>
          <span class="cd-brand-badge">Pvt Ltd</span>
        </div>
        <div class="cd-brand-sub">Creative Tech, Web Apps & Software Production</div>
      </div>
      <button class="cd-close-btn" id="cd-close-btn" aria-label="Close contact drawer">
        <span>Close [×]</span>
        <div class="l"><div></div></div>
      </button>
    </div>

    <!-- Mode Tabs: Client Enquiry vs Investors/Partnership -->
    <div class="cd-tabs-bar" role="tablist">
      <button class="cd-tab-btn is-active" id="cd-tab-client" role="tab" aria-selected="true" aria-controls="cd-pane-client">
        Client Enquiry
      </button>
      <button class="cd-tab-btn" id="cd-tab-investor" role="tab" aria-selected="false" aria-controls="cd-pane-investor">
        Investors & Collaborate
      </button>
    </div>

    <!-- Drawer Content Body -->
    <div class="cd-body">
      <!-- 1. Client Enquiry Pane -->
      <div class="cd-form-pane is-active" id="cd-pane-client" role="tabpanel" aria-labelledby="cd-tab-client">
        <div class="cd-section-intro">
          <h3>Let's build something exceptional.</h3>
          <p>Tell us about your product idea, web service requirement, or engineering sprint. We respond within 24 hours.</p>
        </div>

        <form id="cd-client-form">
          <!-- Services Needed -->
          <div class="cd-group">
            <span class="cd-group-label">Services Required:</span>
            <div class="cd-pills">
              <label class="cd-pill-item">
                <input type="checkbox" name="services" value="Web App" checked>
                <span class="cd-pill-label">Web Apps / SaaS</span>
              </label>
              <label class="cd-pill-item">
                <input type="checkbox" name="services" value="Custom Software">
                <span class="cd-pill-label">Custom Software</span>
              </label>
              <label class="cd-pill-item">
                <input type="checkbox" name="services" value="Mobile Apps">
                <span class="cd-pill-label">Mobile Apps (iOS/Android)</span>
              </label>
              <label class="cd-pill-item">
                <input type="checkbox" name="services" value="Website Service">
                <span class="cd-pill-label">Website Service</span>
              </label>
              <label class="cd-pill-item">
                <input type="checkbox" name="services" value="Creative Design">
                <span class="cd-pill-label">Creative Design & UI/UX</span>
              </label>
            </div>
          </div>

          <div class="cd-row">
            <div class="cd-field">
              <label for="cd-c-name">Your Name *</label>
              <input type="text" id="cd-c-name" class="cd-input" placeholder="e.g. Alex Morgan" required>
            </div>
            <div class="cd-field">
              <label for="cd-c-email">Work Email *</label>
              <input type="email" id="cd-c-email" class="cd-input" placeholder="alex@company.com" required>
            </div>
          </div>

          <div class="cd-row">
            <div class="cd-field">
              <label for="cd-c-company">Company / Project</label>
              <input type="text" id="cd-c-company" class="cd-input" placeholder="Organization name">
            </div>
            <div class="cd-field">
              <label for="cd-c-country">Country *</label>
              ${countryField('cd-c-country')}
            </div>
          </div>

          <div class="cd-field">
            <label for="cd-c-budget">Project Scope / Budget</label>
            <select id="cd-c-budget" class="cd-select"></select>
            <input type="text" id="cd-c-budget-custom" class="cd-input" hidden>
          </div>

          <div class="cd-field">
            <label for="cd-c-message">Project Vision & Timeline *</label>
            <textarea id="cd-c-message" class="cd-textarea" placeholder="Briefly describe what you want to create, goals, and any reference links..." required></textarea>
          </div>

          <button type="submit" class="cd-submit-btn" id="cd-client-submit">
            <span>Send Client Enquiry</span>
            <span>→</span>
          </button>
        </form>

        <div class="cd-success-box" id="cd-client-success">
          <div class="cd-success-icon">✓</div>
          <h4 class="cd-success-title">Enquiry Received</h4>
          <p class="cd-success-desc">Thank you for reaching out. Our engineering & design leads are reviewing your brief and will get back to you within 24 hours.</p>
          <button type="button" class="cd-submit-btn" onclick="window.resetContactForm('client')">
            <span>Send Another Request</span>
          </button>
        </div>
      </div>

      <!-- 2. Investors & Collaboration Pane -->
      <div class="cd-form-pane" id="cd-pane-investor" role="tabpanel" aria-labelledby="cd-tab-investor">
        <div class="cd-section-intro">
          <h3>Invest & Collaborate with makewithus.</h3>
          <p>We partner with visionary investors, venture studios, and enterprise co-builders to build high-growth digital technologies.</p>
        </div>

        <form id="cd-investor-form">
          <!-- Intent Type -->
          <div class="cd-group">
            <span class="cd-group-label">Collaboration Nature:</span>
            <div class="cd-pills">
              <label class="cd-pill-item">
                <input type="radio" name="investor_type" value="Angel / VC Investment" checked>
                <span class="cd-pill-label">Angel / VC Investment</span>
              </label>
              <label class="cd-pill-item">
                <input type="radio" name="investor_type" value="Strategic Business Partnership">
                <span class="cd-pill-label">Business Partnership</span>
              </label>
              <label class="cd-pill-item">
                <input type="radio" name="investor_type" value="Enterprise Co-Building">
                <span class="cd-pill-label">Enterprise Co-Building</span>
              </label>
              <label class="cd-pill-item">
                <input type="radio" name="investor_type" value="Technology Alliance">
                <span class="cd-pill-label">Tech Alliance</span>
              </label>
            </div>
          </div>

          <div class="cd-row">
            <div class="cd-field">
              <label for="cd-i-name">Your Name *</label>
              <input type="text" id="cd-i-name" class="cd-input" placeholder="e.g. Jordan Lee" required>
            </div>
            <div class="cd-field">
              <label for="cd-i-email">Corporate Email *</label>
              <input type="email" id="cd-i-email" class="cd-input" placeholder="jordan@fund.vc" required>
            </div>
          </div>

          <div class="cd-row">
            <div class="cd-field">
              <label for="cd-i-firm">Firm / Investment Group *</label>
              <input type="text" id="cd-i-firm" class="cd-input" placeholder="e.g. Alpha Ventures" required>
            </div>
            <div class="cd-field">
              <label for="cd-i-country">Country *</label>
              ${countryField('cd-i-country')}
            </div>
          </div>

          <div class="cd-field">
            <label for="cd-i-range">Allocation / Scope</label>
            <select id="cd-i-range" class="cd-select">
              <option value="Direct Seed / Angel">Direct Angel / Seed Capital</option>
              <option value="Growth Capital / Syndicate">Institutional Venture Capital</option>
              <option value="Commercial Venture Partnership">Commercial Venture Partnership</option>
              <option value="Strategic Advisory">Strategic Advisory / M&A</option>
            </select>
          </div>

          <div class="cd-field">
            <label for="cd-i-note">Partnership Note & Objectives *</label>
            <textarea id="cd-i-note" class="cd-textarea" placeholder="Share your thesis, synergy, or how you'd like to collaborate with makewithus..." required></textarea>
          </div>

          <button type="submit" class="cd-submit-btn" id="cd-investor-submit">
            <span>Submit Collaboration Proposal</span>
            <span>→</span>
          </button>
        </form>

        <div class="cd-success-box" id="cd-investor-success">
          <div class="cd-success-icon">✓</div>
          <h4 class="cd-success-title">Proposal Submitted</h4>
          <p class="cd-success-desc">Thank you for your interest in collaborating with makewithus®. Our leadership team will review your proposal and respond directly via email.</p>
          <button type="button" class="cd-submit-btn" onclick="window.resetContactForm('investor')">
            <span>Submit Another Proposal</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Direct Contact Footer -->
    <div class="cd-footer">
      <div>
        <span>Direct: </span>
        <a href="mailto:contact@makewithus.in" class="cd-email-link">contact@makewithus.in</a>
      </div>
      <div class="cd-email-copy-wrap">
        <span>Confidential & NDA guaranteed</span>
        <button type="button" class="cd-copy-badge" id="cd-copy-email-btn">Copy Email</button>
      </div>
    </div>
  </aside>
  `;

  function initDrawer() {
    if (document.getElementById('contact-drawer')) return;

    // Inject styles link if not present
    if (!document.getElementById('contact-drawer-styles')) {
      const link = document.createElement('link');
      link.id = 'contact-drawer-styles';
      link.rel = 'stylesheet';
      link.href = '/css/contact-drawer.css';
      document.head.appendChild(link);
    }

    // Inject HTML
    const container = document.createElement('div');
    container.id = 'contact-drawer-root';
    container.innerHTML = DRAWER_HTML;
    document.body.appendChild(container);

    const drawer = document.getElementById('contact-drawer');
    const overlay = document.getElementById('contact-drawer-overlay');
    const closeBtn = document.getElementById('cd-close-btn');
    const tabClient = document.getElementById('cd-tab-client');
    const tabInvestor = document.getElementById('cd-tab-investor');
    const paneClient = document.getElementById('cd-pane-client');
    const paneInvestor = document.getElementById('cd-pane-investor');
    const copyBtn = document.getElementById('cd-copy-email-btn');

    // Global toggle functions
    window.openContactDrawer = function (targetTab) {
      drawer.classList.add('is-active');
      overlay.classList.add('is-active');
      document.body.style.overflow = 'hidden';

      if (targetTab === 'investor') {
        switchTab('investor');
      } else {
        switchTab('client');
      }
    };

    window.closeContactDrawer = function () {
      drawer.classList.remove('is-active');
      overlay.classList.remove('is-active');
      document.body.style.overflow = '';
    };

    function switchTab(tab) {
      if (tab === 'investor') {
        tabInvestor.classList.add('is-active');
        tabInvestor.setAttribute('aria-selected', 'true');
        tabClient.classList.remove('is-active');
        tabClient.setAttribute('aria-selected', 'false');

        paneInvestor.classList.add('is-active');
        paneClient.classList.remove('is-active');
      } else {
        tabClient.classList.add('is-active');
        tabClient.setAttribute('aria-selected', 'true');
        tabInvestor.classList.remove('is-active');
        tabInvestor.setAttribute('aria-selected', 'false');

        paneClient.classList.add('is-active');
        paneInvestor.classList.remove('is-active');
      }
    }

    tabClient.addEventListener('click', () => switchTab('client'));
    tabInvestor.addEventListener('click', () => switchTab('investor'));
    closeBtn.addEventListener('click', window.closeContactDrawer);
    overlay.addEventListener('click', window.closeContactDrawer);

    // Escape key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-active')) {
        window.closeContactDrawer();
      }
    });

    // Copy direct email button
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('contact@makewithus.in');
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#000000';
        copyBtn.style.color = '#ffffff';
        setTimeout(() => {
          copyBtn.textContent = orig;
          copyBtn.style.background = '';
          copyBtn.style.color = '';
        }, 2000);
      });
    }

    // Show (and require) the free-text input only when its select is on the trigger value
    function bindReveal(selectId, inputId, trigger) {
      const sel = document.getElementById(selectId);
      const inp = document.getElementById(inputId);
      const sync = (focus) => {
        const on = sel.value === trigger;
        inp.hidden = !on;
        inp.required = on;
        if (on && focus) inp.focus();
      };
      sel.addEventListener('change', () => sync(true));
      return { sync, value: () => (sel.value === trigger ? inp.value.trim() : sel.value) };
    }
    const countrySel = document.getElementById('cd-c-country');
    const budgetSel = document.getElementById('cd-c-budget');
    function syncCurrency(reset) {
      const inr = countrySel.value === 'India';
      const idx = reset || !budgetSel.options.length ? DEFAULT_BUDGET : budgetSel.selectedIndex;
      budgetSel.innerHTML = BUDGETS[inr ? 'INR' : 'USD'].map((t) => `<option value="${t}">${t}</option>`).join('')
        + '<option value="Custom">Custom budget</option>';
      budgetSel.selectedIndex = idx;
      document.getElementById('cd-c-budget-custom').placeholder = inr ? 'Your budget, e.g. ₹3,00,000' : 'Your budget, e.g. $8,000';
    }
    countrySel.addEventListener('change', () => syncCurrency(false));
    syncCurrency(true);

    const clientCountry = bindReveal('cd-c-country', 'cd-c-country-other', 'Other');
    const clientBudget = bindReveal('cd-c-budget', 'cd-c-budget-custom', 'Custom');
    const investorCountry = bindReveal('cd-i-country', 'cd-i-country-other', 'Other');

    // Client Form Submission
    const clientForm = document.getElementById('cd-client-form');
    const clientSuccess = document.getElementById('cd-client-success');
    if (clientForm) {
      clientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = document.getElementById('cd-client-submit');
        const origText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>Sending...</span>';

        // Gather form data
        const services = Array.from(clientForm.querySelectorAll('input[name="services"]:checked')).map(el => el.value);
        const name = document.getElementById('cd-c-name').value;
        const email = document.getElementById('cd-c-email').value;
        const company = document.getElementById('cd-c-company').value;
        const country = clientCountry.value();
        const budget = clientBudget.value();
        const message = document.getElementById('cd-c-message').value;

        console.log('[makewithus] Client enquiry submitted:', { services, name, email, company, country, budget, message });

        setTimeout(() => {
          clientForm.style.display = 'none';
          clientSuccess.classList.add('is-active');
          btn.disabled = false;
          btn.innerHTML = origText;
        }, 600);
      });
    }

    // Investor Form Submission
    const investorForm = document.getElementById('cd-investor-form');
    const investorSuccess = document.getElementById('cd-investor-success');
    if (investorForm) {
      investorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = document.getElementById('cd-investor-submit');
        const origText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>Submitting Proposal...</span>';

        const typeEl = investorForm.querySelector('input[name="investor_type"]:checked');
        const investorType = typeEl ? typeEl.value : 'Investment';
        const name = document.getElementById('cd-i-name').value;
        const email = document.getElementById('cd-i-email').value;
        const firm = document.getElementById('cd-i-firm').value;
        const country = investorCountry.value();
        const range = document.getElementById('cd-i-range').value;
        const note = document.getElementById('cd-i-note').value;

        console.log('[makewithus] Investor proposal submitted:', { investorType, name, email, firm, country, range, note });

        setTimeout(() => {
          investorForm.style.display = 'none';
          investorSuccess.classList.add('is-active');
          btn.disabled = false;
          btn.innerHTML = origText;
        }, 600);
      });
    }

    window.resetContactForm = function (type) {
      if (type === 'client') {
        clientForm.reset();
        syncCurrency(true);
        clientCountry.sync(false);
        clientBudget.sync(false);
        clientForm.style.display = 'block';
        clientSuccess.classList.remove('is-active');
      } else {
        investorForm.reset();
        investorCountry.sync(false);
        investorForm.style.display = 'block';
        investorSuccess.classList.remove('is-active');
      }
    };
  }

  // Intercept nav contact buttons
  function bindHeaderContact() {
    const contactBtn = document.getElementById('header-contact');
    if (contactBtn && !contactBtn.dataset.cdBound) {
      contactBtn.dataset.cdBound = 'true';
      contactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.openContactDrawer) {
          window.openContactDrawer('client');
        }
      }, true); // Use capture so it runs before d.js copies mail!
    }

    // Also bind footer email link if clicked
    const fixCoEm = document.getElementById('fix-co-em');
    if (fixCoEm && !fixCoEm.dataset.cdBound) {
      fixCoEm.dataset.cdBound = 'true';
      fixCoEm.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.openContactDrawer) {
          window.openContactDrawer('client');
        }
      });
    }

    // Bind any elements with data-open-contact
    document.querySelectorAll('[data-open-contact]').forEach((el) => {
      if (!el.dataset.cdBound) {
        el.dataset.cdBound = 'true';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const target = el.getAttribute('data-open-contact') || 'client';
          if (window.openContactDrawer) {
            window.openContactDrawer(target);
          }
        });
      }
    });
  }

  // m.js (mobile) has no header clock; this matches the one d.js runs on desktop
  function tickClock() {
    const el = document.querySelector('#header-time span');
    if (!el) return;
    const m = (Math.floor(Date.now() / 60000) + 330) % 1440; // IST = UTC+5:30
    const h = Math.floor(m / 60);
    el.textContent = `IST ${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  tickClock();
  setInterval(tickClock, 10000);

  // Init on DOM ready and keep checking periodically for SPA route changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initDrawer();
      bindHeaderContact();
    });
  } else {
    initDrawer();
    bindHeaderContact();
  }

  setInterval(bindHeaderContact, 300);
})();
