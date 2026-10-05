import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { splitLetterIntoPages } from './pagination';
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

// Create an offscreen DOM node that mirrors the on-screen letter stage exactly (supports multi-page stationery)
function createOffscreenStage(
  entry: Entry,
  fallbackColor = '#8B4513',
  pageIndex: number = 0
): HTMLDivElement {
  const backdropColor = entry.backdrop_color || fallbackColor;
  const fontFamily = entry.font_family || 'Newsreader, Georgia, serif';
  const textAlign = entry.text_align || 'left';
  const hasAttachments = (entry.photos && entry.photos.length > 0) || (entry.attachments || []).some(a => a.type === 'audio');
  const pages = splitLetterIntoPages(entry.body || '', hasAttachments);
  const pageText = pages[pageIndex] || '';

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

  // Date Header on Paper (displays continuation indicator on subsequent sheets)
  const isContinuation = pageIndex > 0;
  const dateHeader = document.createElement('div');
  dateHeader.style.fontSize = '0.85rem';
  dateHeader.style.color = '#8C8C8C';
  dateHeader.style.marginBottom = '20px';
  dateHeader.style.fontFamily = "'Inter', sans-serif";
  dateHeader.style.letterSpacing = '0.02em';
  dateHeader.style.display = 'flex';
  dateHeader.style.justifyContent = 'space-between';
  dateHeader.innerHTML = `
    <span>${formatDateLabel(entry.entry_date)}</span>
    ${isContinuation ? `<span style="font-style: italic; color: #8C8C8C; font-size: 0.85rem;">(continued)</span>` : ''}
  `;
  paper.appendChild(dateHeader);

  // Letter Body (constrained so text never bleeds out of the stationery)
  const bodyText = document.createElement('div');
  bodyText.style.whiteSpace = 'pre-wrap';
  bodyText.style.wordBreak = 'break-word';
  bodyText.style.minHeight = pageIndex === 0 ? '200px' : '320px';
  bodyText.textContent = pageText;
  paper.appendChild(bodyText);

  // Attached Human Voice Memos (Rendered on Page 1)
  const audioAttachments = (entry.attachments || []).filter(a => a.type === 'audio');
  if (pageIndex === 0 && audioAttachments.length > 0) {
    audioAttachments.forEach((aud) => {
      const memoWrapper = document.createElement('div');
      memoWrapper.style.position = 'relative';
      memoWrapper.style.display = 'inline-flex';
      memoWrapper.style.alignItems = 'center';
      memoWrapper.style.gap = '10px';
      memoWrapper.style.margin = '14px 0 10px 0';
      memoWrapper.style.padding = '8px 14px';
      memoWrapper.style.background = '#FAF8F5';
      memoWrapper.style.border = '1px solid rgba(80, 60, 40, 0.14)';
      memoWrapper.style.borderRadius = '6px';

      // Cellotape
      const tape = document.createElement('div');
      tape.style.position = 'absolute';
      tape.style.top = '-7px';
      tape.style.left = '14px';
      tape.style.width = '38px';
      tape.style.height = '14px';
      tape.style.background = 'rgba(255, 255, 255, 0.65)';
      tape.style.border = '1px solid rgba(255, 255, 255, 0.75)';
      tape.style.transform = 'rotate(-2deg)';
      memoWrapper.appendChild(tape);

      // Play icon circle
      const playIcon = document.createElement('div');
      playIcon.style.width = '24px';
      playIcon.style.height = '24px';
      playIcon.style.borderRadius = '50%';
      playIcon.style.background = '#3E3733';
      playIcon.style.display = 'flex';
      playIcon.style.alignItems = 'center';
      playIcon.style.justifyContent = 'center';
      playIcon.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      memoWrapper.appendChild(playIcon);

      // Acoustic rhythm bars
      const barsDiv = document.createElement('div');
      barsDiv.style.display = 'flex';
      barsDiv.style.alignItems = 'center';
      barsDiv.style.gap = '2.5px';
      barsDiv.style.height = '20px';
      const sampleHeights = [6, 12, 16, 20, 14, 18, 19, 10, 15, 20, 13, 8, 14, 17, 9];
      sampleHeights.forEach((h) => {
        const b = document.createElement('div');
        b.style.width = '2.5px';
        b.style.height = `${h}px`;
        b.style.background = '#4A403A';
        b.style.borderRadius = '1px';
        barsDiv.appendChild(b);
      });
      memoWrapper.appendChild(barsDiv);

      // Duration label
      const durLabel = document.createElement('span');
      const secs = aud.duration || 0;
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      durLabel.style.fontFamily = "'DM Mono', monospace";
      durLabel.style.fontSize = '11px';
      durLabel.style.color = '#5A4E47';
      durLabel.textContent = `${m}:${s < 10 ? '0' : ''}${s} • voice memo`;
      memoWrapper.appendChild(durLabel);

      paper.appendChild(memoWrapper);
    });
  }

  // Attached Cellotaped Photos (Rendered on Page 1)
  if (pageIndex === 0 && entry.photos && entry.photos.length > 0) {
    const gallery = document.createElement('div');
    gallery.style.display = 'flex';
    gallery.style.flexWrap = 'wrap';
    gallery.style.justifyContent = 'center';
    gallery.style.alignItems = 'center';
    gallery.style.gap = entry.photos.length === 1 ? '0' : entry.photos.length === 2 ? '14px' : '10px';
    gallery.style.margin = '18px auto 8px auto';
    gallery.style.width = '100%';
    gallery.style.maxWidth = '460px';

    const naturalRotations = [-2.5, 2, -1.8, 2.5, -2, 1.5];

    entry.photos.forEach((photo, idx) => {
      const photoWidth =
        entry.photos!.length === 1
          ? '220px'
          : entry.photos!.length === 2
          ? '185px'
          : entry.photos!.length === 3
          ? '138px'
          : '142px';

      const rotation = photo.rotate || naturalRotations[idx % naturalRotations.length];

      const photoWrapper = document.createElement('div');
      photoWrapper.style.position = 'relative';
      photoWrapper.style.width = photoWidth;
      photoWrapper.style.maxWidth = '100%';
      photoWrapper.style.margin = '4px';
      photoWrapper.style.padding = '6px 6px 12px 6px';
      photoWrapper.style.background = '#FFFFFF';
      photoWrapper.style.borderRadius = '2px';
      photoWrapper.style.transform = `rotate(${rotation}deg)`;
      photoWrapper.style.border = '1px solid rgba(0, 0, 0, 0.05)';
      photoWrapper.style.boxSizing = 'border-box';
      photoWrapper.style.flexShrink = '0';

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
      img.crossOrigin = 'anonymous';
      img.src = photo.url;
      img.style.display = 'block';
      img.style.width = '100%';
      img.style.height = entry.photos!.length === 1 ? '150px' : entry.photos!.length === 2 ? '130px' : '105px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '2px';
      photoWrapper.appendChild(img);

      gallery.appendChild(photoWrapper);
    });

    paper.appendChild(gallery);
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

// 1. Export as Visual PDF Booklet with full colored canvas and authentic paper (supports multi-page letters)
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

  // Flatten all letter sheets
  const tasks: { entry: Entry; pageIndex: number; totalPages: number }[] = [];
  entries.forEach((entry) => {
    const hasAtt = (entry.photos && entry.photos.length > 0) || (entry.attachments || []).some(a => a.type === 'audio');
    const pgs = splitLetterIntoPages(entry.body || '', hasAtt);
    for (let p = 0; p < pgs.length; p++) {
      tasks.push({ entry, pageIndex: p, totalPages: pgs.length });
    }
  });

  const total = tasks.length;

  for (let i = 0; i < total; i++) {
    const task = tasks[i];
    onProgress?.({
      current: i + 1,
      total,
      status: `Rendering sheet ${i + 1} of ${total}: "${task.entry.title || 'Untitled'}"${task.totalPages > 1 ? ` (Page ${task.pageIndex + 1}/${task.totalPages})` : ''}...`,
    });

    const stage = createOffscreenStage(task.entry, '#8B4513', task.pageIndex);
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

  const tasks: { entry: Entry; pageIndex: number; totalPages: number }[] = [];
  entries.forEach((entry) => {
    const hasAtt = (entry.photos && entry.photos.length > 0) || (entry.attachments || []).some(a => a.type === 'audio');
    const pgs = splitLetterIntoPages(entry.body || '', hasAtt);
    for (let p = 0; p < pgs.length; p++) {
      tasks.push({ entry, pageIndex: p, totalPages: pgs.length });
    }
  });

  const total = tasks.length;

  for (let i = 0; i < total; i++) {
    const task = tasks[i];
    onProgress?.({
      current: i + 1,
      total,
      status: `Rendering image ${i + 1} of ${total}...`,
    });

    const stage = createOffscreenStage(task.entry, '#8B4513', task.pageIndex);
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

      const dateStr = task.entry.entry_date.slice(0, 10);
      const sanitized = (task.entry.title || 'letter')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')
        .slice(0, 25);
      const pageSuffix = task.totalPages > 1 ? `_p${task.pageIndex + 1}` : '';
      const filename = `${String(i + 1).padStart(2, '0')}_${dateStr}_${sanitized}${pageSuffix}.png`;

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

// 3. Open Print Window with Exact Colored Stage and Authentic Paper (supports multi-page letters)
export function openVisualPrintBook(entries: Entry[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const pagesHtml = entries
    .map((entry) => {
      const backdrop = entry.backdrop_color || '#8B4513';
      const font = entry.font_family || 'Newsreader, Georgia, serif';
      const align = entry.text_align || 'left';
      const dateLabel = formatDateLabel(entry.entry_date);
      const hasAtt = (entry.photos && entry.photos.length > 0) || (entry.attachments || []).some(a => a.type === 'audio');
      const letterPages = splitLetterIntoPages(entry.body || '', hasAtt);

      return letterPages.map((pageText, pIdx) => {
        const isFirstPage = pIdx === 0;

        const photosCount = isFirstPage ? (entry.photos || []).length : 0;
        let photoWidth = '220px';
        let imgHeight = '150px';
        if (photosCount === 2) {
          photoWidth = '185px';
          imgHeight = '130px';
        } else if (photosCount === 3) {
          photoWidth = '135px';
          imgHeight = '105px';
        } else if (photosCount >= 4) {
          photoWidth = '145px';
          imgHeight = '105px';
        }

        const photosHtml = photosCount > 0 ? `
          <div class="letter-scrapbook-gallery">
            ${entry.photos!.map((p, idx) => {
              const rot = p.rotate ?? (idx % 2 === 0 ? -1.5 : 1.8);
              return `
                <div class="cellotaped-photo" style="width: ${photoWidth}; transform: rotate(${rot}deg);">
                  <div class="cellotape-top"></div>
                  <img src="${p.url}" style="height: ${imgHeight};" />
                </div>
              `;
            }).join('')}
          </div>
        ` : '';

        const audioMemosHtml = isFirstPage ? (entry.attachments || [])
          .filter(a => a.type === 'audio')
          .map(aud => {
            const secs = aud.duration || 0;
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            const dur = `${m}:${s < 10 ? '0' : ''}${s}`;
            return `
              <div class="human-voice-memo">
                <div class="cellotape-memo-top"></div>
                <div class="voice-memo-play-circle">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div class="voice-memo-acoustic-bars">
                  <span style="height: 6px;"></span><span style="height: 12px;"></span>
                  <span style="height: 18px;"></span><span style="height: 14px;"></span>
                  <span style="height: 20px;"></span><span style="height: 10px;"></span>
                  <span style="height: 17px;"></span><span style="height: 19px;"></span>
                  <span style="height: 14px;"></span><span style="height: 8px;"></span>
                </div>
                <div class="voice-memo-label">${dur} • voice memo</div>
              </div>
            `;
          }).join('') : '';

        const isContinuation = pIdx > 0;
        const pageHeader = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" class="date-header">
            <span>${dateLabel}</span>
            ${isContinuation ? `<span style="font-style: italic; color: #8C8C8C; font-size: 0.85rem;">(continued)</span>` : ''}
          </div>
        `;

        return `
          <div class="stage-page" style="background-color: ${backdrop};">
            <div class="paper-sheet" style="font-family: ${font}; text-align: ${align};">
              ${pageHeader}
              <div class="letter-body">${(pageText || '').replace(/\n/g, '<br/>')}</div>
              ${audioMemosHtml}
              ${photosHtml}
            </div>
          </div>
        `;
      }).join('');
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
    .letter-scrapbook-gallery {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 14px;
      margin-top: 18px;
      width: 100%;
    }
    .cellotaped-photo {
      position: relative;
      flex-shrink: 0;
      box-sizing: border-box;
      max-width: 100%;
      margin: 4px;
      padding: 6px 6px 12px 6px;
      background: #FFFFFF;
      border-radius: 2px;
      border: 1px solid rgba(0,0,0,0.05);
    }
    .cellotaped-photo img {
      width: 100%;
      object-fit: cover;
      display: block;
      border-radius: 2px;
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
      pointer-events: none;
    }
    .human-voice-memo {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin: 14px 0 10px 0;
      padding: 8px 14px;
      background: #FAF8F5;
      border: 1px solid rgba(80, 60, 40, 0.14);
      border-radius: 6px;
    }
    .cellotape-memo-top {
      position: absolute;
      top: -7px;
      left: 14px;
      width: 38px;
      height: 14px;
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.75);
      transform: rotate(-2deg);
    }
    .voice-memo-play-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #3E3733;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .voice-memo-acoustic-bars {
      display: flex;
      align-items: center;
      gap: 2.5px;
      height: 20px;
    }
    .voice-memo-acoustic-bars span {
      width: 2.5px;
      background: #4A403A;
      border-radius: 1px;
      display: inline-block;
    }
    .voice-memo-label {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: #5A4E47;
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
