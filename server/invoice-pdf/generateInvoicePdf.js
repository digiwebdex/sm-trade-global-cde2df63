const fs = require('fs');
const path = require('path');

// Persistent Chrome cache inside the server app (survives npm install / VPS deploy)
const PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR
  || path.join(__dirname, '..', '.puppeteer-cache');
process.env.PUPPETEER_CACHE_DIR = PUPPETEER_CACHE_DIR;

const puppeteer = require('puppeteer');

function getBrowserLaunchOptions() {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--font-render-hinting=none',
  ];

  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args,
    };
  }

  const systemChrome = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ].find((p) => fs.existsSync(p));

  if (systemChrome) {
    return { headless: true, executablePath: systemChrome, args };
  }

  return { headless: true, args };
}

async function launchBrowser() {
  try {
    return await puppeteer.launch(getBrowserLaunchOptions());
  } catch (err) {
    const hint = [
      'Chrome is not installed for Puppeteer.',
      'Run: cd /var/www/smtradeapp-soft/server && npm run setup:chrome',
      'Or set PUPPETEER_EXECUTABLE_PATH to a system Chrome/Chromium binary.',
    ].join(' ');
    throw new Error(`${err.message}\n${hint}`);
  }
}

const DIR = __dirname;
const TEMPLATE_PATH = path.join(DIR, 'invoice-template.html');
const CSS_PATH = path.join(DIR, 'invoice.css');
const DEFAULT_LOGO = path.join(DIR, '../../src/assets/logo.png');

/** Rows per page — tuned to match attached A4 reference */
const ROWS_FIRST_PAGE = 26;
const ROWS_MIDDLE_PAGE = 32;
const ROWS_LAST_PAGE_MAX = 20;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNumber(num) {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '0.00';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPlain(num) {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '0.00';
  return n.toFixed(2);
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function toFileUrl(filePath) {
  const resolved = path.resolve(filePath);
  return `file://${resolved.replace(/\\/g, '/')}`;
}

function readAsDataUrl(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return '';
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const buf = fs.readFileSync(resolvedPath(filePath));
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function resolvedPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
}

function srcForImage(src) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('http')) return src;
  return readAsDataUrl(src);
}

/**
 * Deterministic pagination: first page holds fewer rows (header + bill-to),
 * middle pages hold more, last page reserves space for totals + signatures.
 */
function paginateItems(items) {
  if (!items.length) return [[]];

  if (items.length <= ROWS_LAST_PAGE_MAX) {
    return [items];
  }

  const pages = [];
  let index = 0;

  pages.push(items.slice(index, index + ROWS_FIRST_PAGE));
  index += ROWS_FIRST_PAGE;

  while (items.length - index > ROWS_LAST_PAGE_MAX) {
    pages.push(items.slice(index, index + ROWS_MIDDLE_PAGE));
    index += ROWS_MIDDLE_PAGE;
  }

  if (index < items.length) {
    pages.push(items.slice(index));
  }

  return pages;
}

function renderTableRows(rows) {
  return rows.map((item) => `
    <tr>
      <td class="col-desc">${escapeHtml(item.description)}</td>
      <td class="col-qty">${escapeHtml(item.qty)}</td>
      <td class="col-unit">${escapeHtml(formatPlain(item.unitPrice))}</td>
      <td class="col-total">${escapeHtml(formatNumber(item.total))}</td>
    </tr>
  `).join('');
}

function renderTableHead() {
  return `
    <thead>
      <tr>
        <th class="col-desc">Description</th>
        <th class="col-qty">Qty</th>
        <th class="col-unit">Unit Price</th>
        <th class="col-total">Total</th>
      </tr>
    </thead>
  `;
}

function renderHeader(data, logoSrc) {
  const { company, invoice } = data;
  return `
    <header class="doc-header">
      <div class="header-row">
        <div class="brand-block">
          <div class="logo-circle">
            <img src="${logoSrc}" alt="Logo" />
          </div>
          <div>
            <div class="company-text">
              <div class="company-name">${escapeHtml(company.name)}</div>
              <div class="company-subtitle">${escapeHtml(company.subtitle)}</div>
            </div>
          </div>
        </div>
        <div class="title-block">
          <div class="doc-title">BILL</div>
          <div class="doc-number">${escapeHtml(invoice.invoiceNo)}</div>
        </div>
      </div>
    </header>
    <div class="header-divider"></div>
  `;
}

function renderBillTo(data) {
  const { invoice } = data;
  return `
    <div class="meta-row">
      <div class="bill-to-block">
        <div class="bill-accent"></div>
        <div>
          <div class="bill-label">Bill To</div>
          <div class="bill-name">${escapeHtml(invoice.billToName)}</div>
          ${invoice.billToOrganization ? `<div class="bill-org">${escapeHtml(invoice.billToOrganization)}</div>` : ''}
          ${invoice.billToAddress ? `<div class="bill-org">${escapeHtml(invoice.billToAddress)}</div>` : ''}
        </div>
      </div>
      <div class="date-block">
        <span class="date-label">Bill Date :</span>
        <span class="date-value">${escapeHtml(formatDate(invoice.invoiceDate))}</span>
      </div>
    </div>
  `;
}

function renderFooter(data, pageIndex, totalPages) {
  const { company } = data;
  const addresses = company.addresses || [company.address, company.address2].filter(Boolean);
  const phones = company.phones || (company.phone ? [company.phone] : []);
  const website = String(company.website || '').replace(/^www\./i, '');
  const qrSrc = srcForImage(company.qrCode);

  return `
    <footer class="doc-footer">
      <div class="footer-inner">
        <div class="footer-contact">
          <div class="footer-line contact-primary">
            ✉ ${escapeHtml(company.email)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;🌐 ${escapeHtml(website)}
          </div>
          ${addresses.map((addr, i) => `
            <div class="footer-line">${i === 0 ? '◉ Address : ' : '◉ '}${escapeHtml(addr)}</div>
          `).join('')}
          <div class="footer-line footer-phones">
            ${phones.map((p) => `<span>☎ ${escapeHtml(p)}</span>`).join('')}
          </div>
        </div>
        ${qrSrc ? `
          <div class="footer-qr">
            <img src="${qrSrc}" alt="QR" />
            <div class="footer-qr-caption">Scan to view invoice</div>
            <div class="footer-qr-sub">for details</div>
          </div>
        ` : ''}
      </div>
    </footer>
    <div class="page-number">Page ${pageIndex + 1} of ${totalPages}</div>
  `;
}

function renderWatermark(logoSrc) {
  return `
    <div class="watermark">
      <img src="${logoSrc}" alt="" />
    </div>
  `;
}

function renderTotals(data) {
  const { totals } = data;
  return `
    <div class="totals-block">
      <div class="total-bar">
        <span class="total-bar-label">Total Amount</span>
        <span class="total-bar-value">BDT ${escapeHtml(formatNumber(totals.grandTotal))}</span>
      </div>
      <div class="amount-words"><strong>In Word :</strong> ${escapeHtml(totals.amountInWords)}.</div>
    </div>
  `;
}

function renderSignatures(data) {
  const { signatures = {} } = data;
  const sigImg = srcForImage(signatures.signatureImage);

  return `
    <div class="signatures">
      <div class="signature-col">
        <div class="signature-box">
          ${signatures.receivedBy ? `<div class="signature-name">${escapeHtml(signatures.receivedBy)}</div>` : ''}
        </div>
        <div class="signature-line">Received by</div>
      </div>
      <div class="signature-col">
        <div class="signature-box">
          ${signatures.preparedBy ? `<div class="signature-name">${escapeHtml(signatures.preparedBy)}</div>` : ''}
          ${signatures.preparedDate ? `<div class="signature-meta">${escapeHtml(signatures.preparedDate)}</div>` : ''}
        </div>
        <div class="signature-line">Prepared by</div>
      </div>
      <div class="signature-col">
        <div class="signature-box">
          ${sigImg ? `<img src="${sigImg}" alt="Signature" />` : ''}
          ${signatures.authorizedBy ? `<div class="signature-name" style="color:#1f3b8a;margin-top:2px;">${escapeHtml(signatures.authorizedBy)}</div>` : ''}
          ${signatures.designation ? `<div class="signature-meta">${escapeHtml(signatures.designation)}</div>` : ''}
        </div>
        <div class="signature-line">Authorize by</div>
      </div>
    </div>
  `;
}

function buildPagesHtml(data) {
  const logoPath = data.company.logo || DEFAULT_LOGO;
  const logoSrc = srcForImage(logoPath) || readAsDataUrl(DEFAULT_LOGO);
  const itemPages = paginateItems(data.items || []);
  const totalPages = itemPages.length;

  return itemPages.map((rows, pageIndex) => {
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === totalPages - 1;

    return `
      <section class="page ${isFirst ? 'page--first' : 'page--continued'}">
        ${renderWatermark(logoSrc)}
        ${renderHeader(data, logoSrc)}
        <div class="doc-body page-content">
          ${isFirst ? renderBillTo(data) : ''}
          <div class="items-table-wrap">
            <table class="items-table">
              ${renderTableHead()}
              <tbody>
                ${renderTableRows(rows)}
              </tbody>
            </table>
          </div>
          ${isLast ? renderTotals(data) : ''}
        </div>
        ${isLast ? renderSignatures(data) : ''}
        ${renderFooter(data, pageIndex, totalPages)}
      </section>
    `;
  }).join('\n');
}

function buildHtmlDocument(data) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const pages = buildPagesHtml(data);
  const title = data.invoice?.invoiceNo || 'Invoice';

  return template
    .replace('{{DOCUMENT_TITLE}}', escapeHtml(title))
    .replace('{{CSS_PATH}}', toFileUrl(CSS_PATH))
    .replace('{{PAGES}}', pages);
}

/**
 * Generate an A4 invoice PDF from JSON data.
 * @param {object} data - Invoice payload (see sample-invoice-data.json)
 * @param {object} [options]
 * @param {string} [options.outputPath] - Write PDF to disk
 * @param {boolean} [options.returnBuffer=false] - Return Buffer instead of path
 * @returns {Promise<string|Buffer>}
 */
async function generateInvoicePdf(data, options = {}) {
  const html = buildHtmlDocument(data);
  const tmpHtml = path.join(DIR, `.tmp-invoice-${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, html, 'utf8');

  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.goto(toFileUrl(tmpHtml), { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    if (options.returnBuffer) {
      return pdfBuffer;
    }

    const outputPath = options.outputPath
      || path.join(DIR, `${data.invoice?.invoiceNo || 'invoice'}.pdf`);

    fs.writeFileSync(outputPath, pdfBuffer);
    return outputPath;
  } finally {
    if (browser) await browser.close();
    if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
  }
}

module.exports = {
  generateInvoicePdf,
  buildHtmlDocument,
  paginateItems,
  formatNumber,
  formatDate,
};

if (require.main === module) {
  const samplePath = path.join(DIR, 'sample-invoice-data.json');
  const sample = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
  const out = path.join(DIR, `${sample.invoice.invoiceNo}.pdf`);

  generateInvoicePdf(sample, { outputPath: out })
    .then((file) => {
      console.log(`PDF written: ${file}`);
    })
    .catch((err) => {
      console.error('PDF generation failed:', err);
      process.exit(1);
    });
}
