(function () {
  function render(state) {
    const validation = ScheduleEngine.validateState(state);
    return `
      <section class="view-header">
        <div>
          <h2>Export / Import</h2>
          <p>JSON includes all normalized source entities.</p>
        </div>
      </section>
      <div class="summary-grid">
        <div class="metric"><span>Validation errors</span><strong>${validation.errors.length}</strong></div>
        <div class="metric"><span>Validation warnings</span><strong>${validation.warnings.length}</strong></div>
        <div class="metric"><span>Entities</span><strong>7</strong></div>
        <div class="metric"><span>Storage</span><strong>localStorage</strong></div>
      </div>
      ${validation.errors.length || validation.warnings.length ? `
        <section class="panel">
          <h3>Validation</h3>
          <ul class="warning-list">
            ${validation.errors.map((item) => `<li>Error: ${item}</li>`).join("")}
            ${validation.warnings.map((item) => `<li>Warning: ${item}</li>`).join("")}
          </ul>
        </section>
      ` : ""}
      <section class="panel" style="margin-top: 16px;">
        <div class="json-actions">
          <button id="refresh-export" type="button">Refresh JSON</button>
          <button id="download-export" class="secondary" type="button">Download JSON</button>
          <button id="import-json" class="secondary" type="button">Import JSON</button>
        </div>
        <textarea id="json-payload" spellcheck="false">${JSON.stringify(state, null, 2)}</textarea>
      </section>
    `;
  }

  window.ExportImportView = { render };
})();

