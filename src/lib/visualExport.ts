import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type { Entry } from '../types';

export interface VisualExportProgress {
  current: number;
  total: number;
  status: string;
}

// Helper to format date nicely
function formatDateLabel(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

// Create an offscreen DOM node that mirrors the on-screen letter stage exactly
function createOffscreenStage(entry: Entry, fallbackColor = '#8B4513'): HTMLDivElement {
  const backdropColor = entry.backdrop_color || fallbackColor;
  const fontFamily = entry.font_family || 'Newsreader, Georgia, serif';
  const textAlign = entry.text_align || 'left';

  // Outer Stage Container (A4 portrait proportion: 794px x 1123px at 96 DPI, scale 2 gives 1588x2246 high-res)
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.height = '1123px';
  container.style.backgroundColor = backdropColor;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.padding = '40px';
  container.style.boxSizing = 'border-box';
  container.style.overflow = 'hidden';
  container.style.zIndex = '-1000';

  // Inner A4 Creased Paper Sheet with authentic texture and tilt
  const paper = document.createElement('div');
  paper.style.position = 'relative';
  paper.style.width = '520px';
  paper.style.aspectRatio = '1 / 1.414';
  paper.style.maxHeight = '92%';
  paper.style.borderRadius = '12px';
  paper.style.padding = '48px 40px 40px 40px';
  paper.style.backgroundImage = "url('/paper-bg.jpg')";
  paper.style.backgroundSize = '110% 110%';
  paper.style.backgroundRepeat = 'no-repeat';
  paper.style.backgroundPosition = 'center';
  paper.style.transform = 'rotate(-1.5deg)';
  paper.style.boxSizing = 'border-box';
  paper.style.overflow = 'hidden';
  paper.style.fontFamily = fontFamily;
  paper.style.textAlign = textAlign;
  paper.style.fontSize = '1.25rem';
  paper.style.lineHeight = '1.75';
  paper.style.color = '#1F2937';

  // Date Header on Paper
  const dateHeader = document.createElement('div');
  dateHeader.style.fontSize = '0.85rem';
  dateHeader.style.color = '#8C8C8C';
  dateHeader.style.marginBottom = '20px';
  dateHeader.style.fontFamily = "'Inter', sans-serif";
  dateHeader.style.letterSpacing = '0.02em';
  dateHeader.textContent = formatDateLabel(entry.entry_date);
  paper.appendChild(dateHeader);

  // Letter Body
  const bodyText = document.createElement('div');
  bodyText.style.whiteSpace = 'pre-wrap';
  bodyText.style.wordBreak = 'break-word';
  bodyText.style.minHeight = '240px';
  bodyText.textContent = entry.body || '';
  paper.appendChild(bodyText);

  // Attached Cellotaped Photos
  if (entry.photos && entry.photos.length > 0) {
    entry.photos.forEach((photo) => {
      const photoWrapper = document.createElement('div');
      photoWrapper.style.position = 'relative';
      photoWrapper.style.display = 'inline-block';
      photoWrapper.style.margin = '20px auto 10px auto';
      photoWrapper.style.padding = '6px 6px 12px 6px';
      photoWrapper.style.background = '#FFFFFF';
      photoWrapper.style.borderRadius = '2px';
      photoWrapper.style.transform = `rotate(${photo.rotate || -1.5}deg)`;
      photoWrapper.style.maxWidth = '200px';
      photoWrapper.style.border = '1px solid rgba(0, 0, 0, 0.05)';

      // Cellotape top
      const tapeTop = document.createElement('div');
      tapeTop.style.position = 'absolute';
      tapeTop.style.top = '-10px';
      tapeTop.style.left = '50%';
      tapeTop.style.transform = 'translateX(-50%) rotate(1deg)';
      tapeTop.style.width = '64px';
      tapeTop.style.height = '18px';
      tapeTop.style.background = 'rgba(255, 255, 255, 0.55)';
      tapeTop.style.border = '1px solid rgba(255, 255, 255, 0.65)';
      tapeTop.style.pointerEvents = 'none';
      photoWrapper.appendChild(tapeTop);

      const img = document.createElement('img');
      img.src = photo.url;
      img.style.display = 'block';
      img.style.width = '100%';
      img.style.maxHeight = '150px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '2px';
      photoWrapper.appendChild(img);

      paper.appendChild(photoWrapper);
    });
  }

  container.appendChild(paper);
  return container;
}

// Wait for fonts and images to load inside an element
async function waitForElementAssets(element: HTMLElement): Promise<void> {
  if (document.fonts) {
    await document.fonts.ready;
  }
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
  // Short buffer for CSS background image rendering
  await new Promise((r) => setTimeout(r, 120));
}

// 1. Export as Visual PDF Booklet with full colored canvas and authentic paper
export async function downloadVisualPDF(
  entries: Entry[],
  onProgress?: (progress: VisualExportProgress) => void
): Promise<void> {
  if (entries.length === 0) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const total = entries.length;

  for (let i = 0; i < total; i++) {
    const entry = entries[i];
    onProgress?.({
      current: i + 1,
      total,
      status: `Rendering letter ${i + 1} of ${total}: "${entry.title || 'Untitled'}"...`,
    });

    const stage = createOffscreenStage(entry);
    document.body.appendChild(stage);

    try {
      await waitForElementAssets(stage);

      const canvas = await html2canvas(stage, {
        scale: 2, // Crisp 300 DPI retina resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Add full bleed A4 image (210mm x 297mm)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    } finally {
      document.body.removeChild(stage);
    }
  }

  onProgress?.({ current: total, total, status: 'Finalizing PDF download...' });
  pdf.save(`In-the-Meantime_Letters_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 2. Export as High-Res PNG Images ZIP
export async function downloadVisualImagesZip(
  entries: Entry[],
  onProgress?: (progress: VisualExportProgress) => void
): Promise<void> {
  if (entries.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('letters_visual') || zip;
  const total = entries.length;

  for (let i = 0; i < total; i++) {
    const entry = entries[i];
    onProgress?.({
      current: i + 1,
      total,
      status: `Rendering image ${i + 1} of ${total}...`,
    });

    const stage = createOffscreenStage(entry);
    document.body.appendChild(stage);

    try {
      await waitForElementAssets(stage);

      const canvas = await html2canvas(stage, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

      const dateStr = entry.entry_date.slice(0, 10);
      const sanitized = (entry.title || 'letter')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')
        .slice(0, 25);
      const filename = `${String(i + 1).padStart(2, '0')}_${dateStr}_${sanitized}.png`;

      folder.file(filename, base64Data, { base64: true });
    } finally {
      document.body.removeChild(stage);
    }
  }

  onProgress?.({ current: total, total, status: 'Compressing ZIP archive...' });
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `In-the-Meantime_Letters_Images_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 3. Open Print Window with Exact Colored Stage and Authentic Paper
export function openVisualPrintBook(entries: Entry[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const pagesHtml = entries
    .map((entry) => {
      const backdrop = entry.backdrop_color || '#8B4513';
      const font = entry.font_family || 'Newsreader, Georgia, serif';
      const align = entry.text_align || 'left';
      const dateLabel = formatDateLabel(entry.entry_date);

      const photosHtml = (entry.photos || [])
        .map(
          (p) => `
        <div class="cellotaped-photo" style="transform: rotate(${p.rotate || -1.5}deg);">
          <div class="cellotape-top"></div>
          <img src="${p.url}" />
        </div>
      `
        )
        .join('');

      return `
      <div class="stage-page" style="background-color: ${backdrop};">
        <div class="paper-sheet" style="font-family: ${font}; text-align: ${align};">
          <div class="date-header">${dateLabel}</div>
          <div class="letter-body">${(entry.body || '').replace(/\n/g, '<br/>')}</div>
          ${photosHtml}
        </div>
      </div>
    `;
    })
    .join('');

  const doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>In the Meantime — Visual Letters</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono&family=Damion&family=Finger+Paint&family=Geist:wght@300;400;500;700&family=Gloria+Hallelujah&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=Mansalva&family=Marck+Script&family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&family=Schoolbell&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      background: #111827;
      margin: 0;
      font-family: 'Inter', -apple-system, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-bar {
      position: fixed;
      top: 16px;
      right: 16px;
      background: #FFFFFF;
      padding: 10px 18px;
      border-radius: 999px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.18);
      z-index: 1000;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .print-btn {
      background: #5C59ED;
      color: #FFF;
      border: none;
      padding: 8px 16px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    @media print {
      .print-bar { display: none !important; }
      body { background: transparent; }
      .stage-page {
        page-break-after: always;
        break-after: page;
        height: 100vh !important;
        width: 100vw !important;
      }
    }
    .stage-page {
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      page-break-after: always;
      break-after: page;
    }
    .paper-sheet {
      width: 520px;
      aspect-ratio: 1 / 1.414;
      max-height: 90vh;
      background-image: url('/paper-bg.jpg');
      background-size: 110% 110%;
      background-position: center;
      border-radius: 12px;
      padding: 48px 40px 40px 40px;
      transform: rotate(-1.5deg);
      font-size: 1.22rem;
      line-height: 1.75;
      color: #1F2937;
      overflow: hidden;
      position: relative;
    }
    .date-header {
      font-size: 0.85rem;
      color: #8C8C8C;
      margin-bottom: 20px;
      font-family: 'Inter', sans-serif;
    }
    .letter-body {
      min-height: 240px;
      word-break: break-word;
    }
    .cellotaped-photo {
      position: relative;
      display: inline-block;
      margin: 16px auto 10px auto;
      padding: 6px 6px 12px 6px;
      background: #FFFFFF;
      border-radius: 2px;
      max-width: 200px;
      border: 1px solid rgba(0,0,0,0.05);
    }
    .cellotaped-photo img {
      width: 100%;
      max-height: 150px;
      object-fit: cover;
      display: block;
    }
    .cellotape-top {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%) rotate(1deg);
      width: 64px;
      height: 18px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.7);
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span style="font-size: 13px; color: #374151;">${entries.length} Letter${entries.length === 1 ? '' : 's'}</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  ${pagesHtml}
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(doc);
  printWindow.document.close();
}
