# Invoice PDF — Backend Integration

## Files

| File | Purpose |
|------|---------|
| `invoice-template.html` | HTML shell loaded by Puppeteer |
| `invoice.css` | Print-first A4 styles |
| `generateInvoicePdf.js` | Builds pages, paginates items, exports PDF |
| `sample-invoice-data.json` | Example payload |

## Install

```bash
cd /var/www/smtradeapp-soft/server
npm install --omit=dev
npm run setup:chrome
```

`setup:chrome` downloads Puppeteer’s Chrome into `server/.puppeteer-cache/` (persistent on VPS).

If Chrome is already installed system-wide, you can instead set:

```bash
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Generate from CLI

```bash
node invoice-pdf/generateInvoicePdf.js
```

Output: `server/invoice-pdf/INV-2026-012.pdf`

## Use in Express

```javascript
const path = require('path');
const { generateInvoicePdf } = require('./invoice-pdf/generateInvoicePdf');

app.get('/api/invoices/:id/pdf', requireAuth, async (req, res) => {
  try {
    const invoice = await loadInvoiceFromDb(req.params.id); // your existing query
    const settings = await loadCompanySettings();

    const data = {
      company: {
        logo: path.join(__dirname, '../src/assets/logo.png'),
        name: settings.name,
        subtitle: settings.tagline,
        email: settings.email,
        website: settings.website,
        addresses: [settings.address, settings.address2].filter(Boolean),
        phones: settings.phones || [settings.phone],
        qrCode: await buildVerifyQrDataUrl(invoice), // optional data URL
      },
      invoice: {
        invoiceNo: invoice.invoiceNumber,
        invoiceDate: invoice.date,
        billToName: invoice.customerName,
        billToOrganization: invoice.customerOrganization || '',
        billToAddress: invoice.customerAddress,
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        qty: String(item.quantity),
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      totals: {
        grandTotal: invoice.grandTotal,
        amountInWords: invoice.amountInWords,
      },
      signatures: {
        receivedBy: invoice.signatureReceivedName || '',
        preparedBy: settings.preparedByName || '',
        preparedDate: settings.preparedDate || '',
        authorizedBy: settings.authorizedByName || '',
        designation: settings.authorizedDesignation || '',
        signatureImage: settings.signatureAuthorize || '',
      },
    };

    const pdfBuffer = await generateInvoicePdf(data, { returnBuffer: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Page splitting (production approach)

`generateInvoicePdf.js` uses **deterministic row counts** per page:

- Page 1: 26 rows (header + bill-to reduce space)
- Middle pages: 32 rows
- Final page: remaining rows + total bar + amount in words + signatures

This avoids cutting a table row across pages. Tune `ROWS_FIRST_PAGE`, `ROWS_MIDDLE_PAGE`, and `ROWS_LAST_PAGE_MAX` in `generateInvoicePdf.js` if your VPS font metrics differ slightly.

For very long invoices, add middle pages automatically; totals and signatures render **only on the last page**. Header, watermark, footer, and page numbers repeat on every page.

## Frontend option

Replace client-side `html2canvas` + `jsPDF` download with:

```javascript
const res = await fetch(`/api/invoices/${id}/pdf`, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await res.blob();
// trigger download
```

Puppeteer output is more stable for print alignment than canvas capture.

## VPS notes

- Puppeteer needs Chromium dependencies on Linux (`apt install chromium-browser` or bundled download).
- Run with `--no-sandbox` (already set) under PM2/root if required.
- Keep logo/signature paths absolute or embed as data URLs for reliable rendering.
