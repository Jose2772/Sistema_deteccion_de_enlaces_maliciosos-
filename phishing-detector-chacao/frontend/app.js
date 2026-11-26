(() => {
  const STORAGE_KEY = 'fjldi_security_chacao_history_v1';

  // Ejemplos predefinidos del sector importación/exportación
  const EXAMPLES = {
    safe: {
      sender: 'notificaciones@seniat.gob.ve',
      dept: 'Aduanas y Aranceles',
      text: 'https://declaraciones.seniat.gob.ve/portal/consulta-arancelaria'
    },
    medium: {
      sender: 'tracking@carga-express.info',
      dept: 'Logística y Navieras',
      text: 'http://bit.ly/guia-contenedor-la-guaira-2026'
    },
    danger: {
      sender: 'urgente@seniat-liquidacion-ve.xyz',
      dept: 'Finanzas y Divisas',
      text: 'http://198.51.100.42/seniat-invoice-bl/descargar_manifiesto.exe?ref=urgent'
    },
    multi: {
      sender: 'operaciones@naviera-global-alert.top',
      dept: 'Comercio Exterior / Export',
      text: `Estimado cliente,\nSu contenedor en Puerto Cabello presenta retención documental. Verifique el Bill of Lading en:\nhttps://maersk-bolipuertos-verify.xyz/invoice/login\nO consulte el estado general en:\nhttps://www.maersk.com/tracking`
    }
  };

  // Registros iniciales de demostración
  const SEED_HISTORY = [
    {
      id: 1732560001,
      timestamp: '25/11/2026 09:14',
      url: 'https://declaraciones.seniat.gob.ve/sidunea',
      domain: 'declaraciones.seniat.gob.ve',
      sender: 'sidunea@seniat.gob.ve',
      dept: 'Aduanas y Aranceles',
      score: 5,
      level: 'safe',
      label: 'ENLACE SEGURO',
      findings: ['Protocolo HTTPS cifrado activo.', 'Dominio oficial gubernamental/institucional verificado (.gob.ve).']
    },
    {
      id: 1732560002,
      timestamp: '25/11/2026 10:42',
      url: 'http://rastreo-carga-venezuela.net/bl-status?id=8841',
      domain: 'rastreo-carga-venezuela.net',
      sender: 'info@rastreo-carga-venezuela.net',
      dept: 'Logística y Navieras',
      score: 42,
      level: 'medium',
      label: 'SEGURIDAD MEDIA',
      findings: ['Conexión HTTP sin cifrado TLS.', 'Palabra clave logística ("bl-status") en dominio externo no corporativo.']
    },
    {
      id: 1732560003,
      timestamp: '25/11/2026 11:28',
      url: 'https://bolipuertos-arancel-pago.xyz/factura_aduana.scr',
      domain: 'bolipuertos-arancel-pago.xyz',
      sender: 'cobranzas@bolipuertos-arancel-pago.xyz',
      dept: 'Finanzas y Divisas',
      score: 92,
      level: 'danger',
      label: 'PELIGROSO / MALICIOSO',
      findings: [
        'Suplantación de identidad institucional (Bolipuertos) en dominio no oficial.',
        'Extensión de dominio de alto riesgo (.xyz).',
        'Descarga directa de archivo ejecutable peligroso (.scr).'
      ]
    }
  ];

  let history = loadHistory();
  let currentFilter = 'all';

  // Referencias DOM
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const senderInput = document.getElementById('senderInput');
  const deptInput = document.getElementById('deptInput');
  const urlInput = document.getElementById('urlInput');
  const scanBtn = document.getElementById('scanBtn');
  const clearBtn = document.getElementById('clearBtn');
  const laserBeam = document.getElementById('laserBeam');
  const emptyResult = document.getElementById('emptyResult');
  const resultsList = document.getElementById('resultsList');
  const historyCount = document.getElementById('historyCount');
  const historyTableBody = document.getElementById('historyTableBody');
  const searchHistory = document.getElementById('searchHistory');
  const detailModal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');

  // Inicializar
  renderHistory();
  updateAnalytics();

  // Navegación entre pestañas
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(`tab-${target}`).classList.add('active');
    });
  });

  // Botones de ejemplo
  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const ex = EXAMPLES[chip.dataset.example];
      if (!ex) return;
      senderInput.value = ex.sender;
      deptInput.value = ex.dept;
      urlInput.value = ex.text;
    });
  });

  // Limpiar formulario
  clearBtn.addEventListener('click', () => {
    senderInput.value = '';
    urlInput.value = '';
    resultsList.innerHTML = '';
    resultsList.classList.add('hidden');
    emptyResult.classList.remove('hidden');
  });

  // Ejecutar análisis
  scanBtn.addEventListener('click', () => {
    const rawText = urlInput.value.trim();
    if (!rawText) {
      alert('Por favor ingresa una URL o el texto de un correo institucional para analizar.');
      return;
    }

    const urls = extractUrls(rawText);
    if (urls.length === 0) {
      alert('No se detectaron enlaces válidos en el texto ingresado.');
      return;
    }

    // Disparar animación láser
    laserBeam.classList.remove('scanning');
    void laserBeam.offsetWidth;
    laserBeam.classList.add('scanning');

    const sender = senderInput.value.trim() || 'No especificado';
    const dept = deptInput.value;

    setTimeout(() => {
      const batchResults = urls.map(u => analyzeUrl(u, sender, dept));
      history = [...batchResults, ...history];
      saveHistory();
      renderScanResults(batchResults);
      renderHistory();
      updateAnalytics();
    }, 350);
  });

  // Extraer URLs de texto o línea única
  function extractUrls(text) {
    const regex = /(https?:\/\/[^\s"'<>]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s"'<>]*)?)/gi;
    const matches = text.match(regex) || [];
    const cleaned = matches.map(m => m.replace(/[.,;!?)]+$/, ''));
    return [...new Set(cleaned)];
  }

  // Motor Heurístico de Evaluación
  function analyzeUrl(rawUrl, sender, dept) {
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`;
    let parsed;
    try {
      parsed = new URL(normalized);
    } catch {
      parsed = { protocol: 'http:', hostname: rawUrl, pathname: '', search: '' };
    }

    const host = parsed.hostname.toLowerCase();
    const fullLower = normalized.toLowerCase();
    let score = 0;
    const findings = [];

    // Regla 1: Protocolo sin cifrado
    if (parsed.protocol === 'http:') {
      score += 22;
      findings.push('Protocolo HTTP inseguro (sin cifrado SSL/TLS).');
    } else {
      findings.push('Conexión cifrada mediante HTTPS.');
    }

    // Regla 2: Dirección IP directa en lugar de dominio
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      score += 45;
      findings.push('Uso de dirección IP directa en lugar de nombre de dominio corporativo.');
    }

    // Regla 3: Typosquatting de entidades aduaneras, navieras y bancos
    const trustedEntities = [
      { key: 'seniat', official: ['seniat.gob.ve'] },
      { key: 'bolipuertos', official: ['bolipuertos.gob.ve'] },
      { key: 'maersk', official: ['maersk.com'] },
      { key: 'dhl', official: ['dhl.com'] },
      { key: 'banesco', official: ['banesco.com'] },
      { key: 'mercantil', official: ['mercantilbanco.com'] }
    ];

    trustedEntities.forEach(ent => {
      if (host.includes(ent.key)) {
        const isOfficial = ent.official.some(off => host === off || host.endsWith(`.${off}`));
        if (!isOfficial) {
          score += 50;
          findings.push(`Posible suplantación (Typosquatting) de "${ent.key.toUpperCase()}" en dominio no autorizado.`);
        } else {
          score = Math.max(0, score - 15);
          findings.push(`Dominio oficial verificado (${ent.official[0]}).`);
        }
      }
    });

    // Regla 4: TLDs de alto riesgo
    const riskyTlds = ['.xyz', '.top', '.tk', '.ml', '.ga', '.click', '.zip', '.loan', '.work'];
    if (riskyTlds.some(tld => host.endsWith(tld))) {
      score += 32;
      findings.push('Extensión de dominio (TLD) frecuentemente asociada a campañas de phishing.');
    }

    // Regla 5: Acortadores de URL
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'is.gd'];
    if (shorteners.some(s => host === s || host.endsWith(`.${s}`))) {
      score += 28;
      findings.push('Enlace acortado que oculta el destino real de navegación.');
    }

    // Regla 6: Ingeniería social aduanera / financiera
    const lureKeywords = ['invoice', 'bill-of-lading', 'manifiesto', 'arancel', 'retencion', 'liquidacion', 'urgent', 'verify', 'login'];
    const matchedKeywords = lureKeywords.filter(k => fullLower.includes(k));
    if (matchedKeywords.length > 0 && score > 0) {
      score += matchedKeywords.length * 10;
      findings.push(`Términos de ingeniería social aduanera/financiera detectados: ${matchedKeywords.join(', ')}.`);
    }

    // Regla 7: Archivos ejecutables peligrosos
    if (/\.(exe|scr|bat|cmd|vbs|ps1|iso|msi)(\?|$)/i.test(fullLower)) {
      score += 55;
      findings.push('Descarga directa de archivo ejecutable o de alto riesgo detectada.');
    }

    // Regla 8: Punycode o símbolo @
    if (host.includes('xn--') || fullLower.includes('@')) {
      score += 40;
      findings.push('Técnica de ofuscación detectada (Punycode IDN o redirección con "@").');
    }

    score = Math.min(100, Math.max(0, score));

    let level = 'safe';
    let label = 'ENLACE SEGURO';
    if (score >= 60) {
      level = 'danger';
      label = 'PELIGROSO / MALICIOSO';
    } else if (score >= 25) {
      level = 'medium';
      label = 'SEGURIDAD MEDIA';
    }

    const now = new Date();
    const timestamp = now.toLocaleDateString('es-VE') + ' ' + now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    return {
      id: Date.now() + Math.floor(Math.random() * 10000),
      timestamp,
      url: rawUrl,
      domain: host,
      sender,
      dept,
      score,
      level,
      label,
      findings
    };
  }

  // Renderizar tarjetas de diagnóstico inmediato
  function renderScanResults(items) {
    emptyResult.classList.add('hidden');
    resultsList.classList.remove('hidden');
    resultsList.innerHTML = items.map(item => `
      <div class="result-item status-${item.level}">
        <div class="result-top">
          <span class="neon-${item.level}">${item.label}</span>
          <span style="font-size:0.8rem;color:#94a3b8;">Riesgo: <strong>${item.score}/100</strong></span>
        </div>
        <div class="result-url">${escapeHtml(item.url)}</div>
        <ul class="findings-list">
          ${item.findings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }

  // Renderizar tabla de historial
  function renderHistory() {
    historyCount.textContent = history.length;
    const query = searchHistory.value.toLowerCase().trim();

    const filtered = history.filter(item => {
      const matchesFilter = currentFilter === 'all' || item.level === currentFilter;
      const matchesQuery =
        item.url.toLowerCase().includes(query) ||
        item.domain.toLowerCase().includes(query) ||
        item.sender.toLowerCase().includes(query) ||
        item.dept.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });

    if (filtered.length === 0) {
      historyTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:1.5rem;">No hay registros que coincidan con el filtro seleccionado.</td></tr>`;
      return;
    }

    historyTableBody.innerHTML = filtered.map(item => `
      <tr>
        <td style="white-space:nowrap;color:#94a3b8;font-size:0.82rem;">${escapeHtml(item.timestamp)}</td>
        <td><span class="neon-${item.level}">${item.label}</span></td>
        <td class="url-cell" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</td>
        <td>${escapeHtml(item.dept)}</td>
        <td><strong>${item.score}/100</strong></td>
        <td>
          <button type="button" class="btn-outline" onclick="window.viewAuditDetail(${item.id})">Ver detalle</button>
        </td>
      </tr>
    `).join('');
  }

  // Filtros y búsqueda en historial
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderHistory();
    });
  });

  searchHistory.addEventListener('input', renderHistory);

  // Modal de detalle forense
  window.viewAuditDetail = (id) => {
    const item = history.find(h => h.id === id);
    if (!item) return;

    modalBody.innerHTML = `
      <p style="margin-bottom:0.6rem;"><strong>Diagnóstico:</strong> <span class="neon-${item.level}">${item.label} (${item.score}/100)</span></p>
      <p style="margin-bottom:0.6rem;"><strong>Fecha y Hora:</strong> ${escapeHtml(item.timestamp)}</p>
      <p style="margin-bottom:0.6rem;"><strong>Remitente:</strong> ${escapeHtml(item.sender)}</p>
      <p style="margin-bottom:0.6rem;"><strong>Departamento:</strong> ${escapeHtml(item.dept)}</p>
      <p style="margin-bottom:0.8rem;word-break:break-all;"><strong>URL Analizada:</strong><br><code>${escapeHtml(item.url)}</code></p>
      <p style="margin-bottom:0.4rem;"><strong>Hallazgos del Motor Heurístico:</strong></p>
      <ul class="findings-list">
        ${item.findings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
      </ul>
    `;
    detailModal.classList.remove('hidden');
  };

  document.getElementById('closeModalBtn').addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.add('hidden');
  });

  // Exportar CSV
  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    if (history.length === 0) return;
    const headers = ['Fecha', 'Estado', 'Puntuacion', 'URL', 'Dominio', 'Remitente', 'Departamento'];
    const rows = history.map(h => [
      `"${h.timestamp}"`,
      `"${h.label}"`,
      h.score,
      `"${h.url.replace(/"/g, '""')}"`,
      `"${h.domain}"`,
      `"${h.sender.replace(/"/g, '""')}"`,
      `"${h.dept}"`
    ].join(','));
    downloadFile([headers.join(','), ...rows].join('\n'), 'fjldi-security-chacao-auditoria.csv', 'text/csv;charset=utf-8;');
  });

  // Exportar JSON
  document.getElementById('exportJsonBtn').addEventListener('click', () => {
    if (history.length === 0) return;
    downloadFile(JSON.stringify(history, null, 2), 'fjldi-security-chacao-auditoria.json', 'application/json');
  });

  // Borrar historial
  document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    if (confirm('¿Deseas eliminar todos los registros del historial de auditoría?')) {
      history = [];
      saveHistory();
      renderHistory();
      updateAnalytics();
    }
  });

  // Actualizar KPIs y gráfico circular SVG
  function updateAnalytics() {
    const total = history.length;
    const safe = history.filter(h => h.level === 'safe').length;
    const medium = history.filter(h => h.level === 'medium').length;
    const danger = history.filter(h => h.level === 'danger').length;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiSafe').textContent = safe;
    document.getElementById('kpiMedium').textContent = medium;
    document.getElementById('kpiDanger').textContent = danger;

    const pSafe = total ? Math.round((safe / total) * 100) : 0;
    const pMed = total ? Math.round((medium / total) * 100) : 0;
    const pDan = total ? Math.round((danger / total) * 100) : 0;

    document.getElementById('pctSafe').textContent = `${pSafe}%`;
    document.getElementById('pctMedium').textContent = `${pMed}%`;
    document.getElementById('pctDanger').textContent = `${pDan}%`;

    const circumference = 2 * Math.PI * 46; // ~289.02
    const lenSafe = total ? (safe / total) * circumference : 0;
    const lenMed = total ? (medium / total) * circumference : 0;
    const lenDan = total ? (danger / total) * circumference : 0;

    const segSafe = document.getElementById('segSafe');
    const segMedium = document.getElementById('segMedium');
    const segDanger = document.getElementById('segDanger');

    segSafe.setAttribute('stroke-dasharray', `${lenSafe} ${circumference}`);
    segSafe.setAttribute('stroke-dashoffset', '0');

    segMedium.setAttribute('stroke-dasharray', `${lenMed} ${circumference}`);
    segMedium.setAttribute('stroke-dashoffset', `${-lenSafe}`);

    segDanger.setAttribute('stroke-dasharray', `${lenDan} ${circumference}`);
    segDanger.setAttribute('stroke-dashoffset', `${-(lenSafe + lenMed)}`);
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [...SEED_HISTORY];
    } catch {
      return [...SEED_HISTORY];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();