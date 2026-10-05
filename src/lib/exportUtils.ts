import JSZip from 'jszip';
import type { Entry } from '../types';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().split('T')[0];
  } catch {
    return 'date';
  }
}

// 1. Export as clean JSON
export function exportJSON(entries: Entry[], fileName = 'in-the-meantime-archive.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// 2. Export as consolidated Markdown
export function exportConsolidatedMarkdown(entries: Entry[], title = 'In the Meantime — Archive'): void {
  let md = `# ${title}\n\n`;
  md += `*“I am living an entire life before this person arrives. These are the things I would have told them if they were already here.”*\n\n`;
  md += `Exported on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}\n`;
  md += `Total Entries: ${entries.length}\n\n`;
  md += `---\n\n`;

  // Sort chronological ascending for reading like a book
  const sorted = [...entries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());

  sorted.forEach((entry, idx) => {
    md += `## ${idx + 1}. ${entry.title || 'Untitled Fragment'}\n\n`;
    md += `**Date:** ${formatDate(entry.entry_date)}\n`;
    if (entry.for_you) {
      md += `**Collection:** Curated For You\n`;
    }
    if (entry.tags && entry.tags.length > 0) {
      md += `**Tags:** ${entry.tags.map(t => `#${t}`).join(' ')}\n`;
    }
    md += `\n`;
    md += `${entry.body}\n\n`;

    if (entry.attachments && entry.attachments.length > 0) {
      md += `*Attachments (${entry.attachments.length}):*\n`;
      entry.attachments.forEach(att => {
        md += `- [${att.type.toUpperCase()}] ${att.filename}${att.caption ? ` — "${att.caption}"` : ''}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `in-the-meantime-book-${formatDateShort(new Date().toISOString())}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// 3. Export as ZIP archive (Markdown per entry + Media files + JSON metadata)
export async function exportZIPArchive(entries: Entry[], onlyForYou = false): Promise<void> {
  const zip = new JSZip();
  const folderName = onlyForYou ? 'InTheMeantime_ForYou' : 'InTheMeantime_FullArchive';
  const root = zip.folder(folderName) || zip;
  const mediaFolder = root.folder('attachments');

  // Add JSON database dump
  root.file('archive.json', JSON.stringify(entries, null, 2));

  // Add Readme / Intro
  let readme = `# In the Meantime\n\n`;
  readme += `This is a private personal archive.\n\n`;
  readme += `> "My life before you was not an empty waiting room."\n\n`;
  readme += `Entries included: ${entries.length}\n`;
  readme += `Exported: ${new Date().toISOString()}\n\n`;
  root.file('README.md', readme);

  // Add individual markdown files
  entries.forEach((entry, idx) => {
    const dateStr = formatDateShort(entry.entry_date);
    const sanitizedTitle = (entry.title || 'fragment')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_')
      .slice(0, 30);
    const fileName = `${dateStr}_${String(idx + 1).padStart(3, '0')}_${sanitizedTitle}.md`;

    let entryMd = `# ${entry.title || 'Fragment'}\n\n`;
    entryMd += `**Date:** ${formatDate(entry.entry_date)}\n`;
    if (entry.for_you) entryMd += `**Marked for:** Curated For You\n`;
    if (entry.tags && entry.tags.length > 0) {
      entryMd += `**Tags:** ${entry.tags.map(t => `#${t}`).join(', ')}\n`;
    }
    entryMd += `\n---\n\n`;
    entryMd += `${entry.body}\n\n`;

    if (entry.attachments && entry.attachments.length > 0) {
      entryMd += `### Attachments\n`;
      entry.attachments.forEach(att => {
        const attName = `${entry.id}_${att.filename}`;
        entryMd += `- [${att.type.toUpperCase()}] attachments/${attName}\n`;

        // Save binary attachment into zip if base64 data URL
        if (att.file_url.startsWith('data:') && mediaFolder) {
          try {
            const parts = att.file_url.split(',');
            const base64Data = parts[1];
            mediaFolder.file(attName, base64Data, { base64: true });
          } catch (err) {
            console.error('Error adding attachment to zip:', err);
          }
        }
      });
    }

    root.file(fileName, entryMd);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}_${formatDateShort(new Date().toISOString())}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// 4. Generate Book-styled Printable Window
export function openPrintBookView(entries: Entry[], onlyForYou = false, salutation = 'To you, in the meantime') {
  const sorted = [...entries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>In the Meantime — Curated Letters & Fragments</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300;1,6..72,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 28mm 25mm 28mm 25mm;
      @bottom-center {
        content: counter(page);
        font-family: 'Newsreader', serif;
        font-size: 10pt;
        color: #7A746E;
      }
    }
    body {
      background: #FDFBF7;
      color: #262422;
      font-family: 'Newsreader', Georgia, serif;
      font-size: 11.5pt;
      line-height: 1.75;
      margin: 0;
      padding: 40px 60px;
      -webkit-font-smoothing: antialiased;
    }
    .print-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #262422;
      color: #FDFBF7;
      border: none;
      padding: 10px 20px;
      border-radius: 9999px;
      font-family: sans-serif;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    @media print {
      .print-controls { display: none; }
      body { background: white; padding: 0; }
      .page-break { page-break-before: always; break-before: page; }
    }
    .title-page {
      height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      break-after: page;
    }
    .main-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 38pt;
      font-weight: 300;
      letter-spacing: 0.05em;
      margin: 0 0 16px 0;
      color: #1A1918;
    }
    .subtitle {
      font-family: 'Newsreader', serif;
      font-style: italic;
      font-size: 14pt;
      color: #736E67;
      margin-bottom: 40px;
      max-width: 480px;
    }
    .dedication {
      font-size: 11pt;
      color: #8C533E;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 60px;
    }
    .collection-info {
      font-size: 10pt;
      color: #99948D;
      margin-top: 10px;
    }
    .entry-card {
      margin-bottom: 50px;
      padding-bottom: 40px;
      border-bottom: 1px solid #ECE7DE;
      page-break-inside: avoid;
    }
    .entry-date {
      font-size: 9.5pt;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #8C533E;
      margin-bottom: 8px;
    }
    .entry-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 18pt;
      font-weight: 500;
      margin: 4px 0 16px 0;
      color: #1C1A18;
    }
    .entry-body {
      white-space: pre-wrap;
      font-size: 11.5pt;
      color: #2F2D2A;
    }
    .entry-tags {
      margin-top: 14px;
      font-size: 9pt;
      font-style: italic;
      color: #8E8982;
    }
    .entry-image {
      margin: 18px 0;
      max-width: 100%;
      border-radius: 4px;
      filter: grayscale(15%) contrast(98%);
    }
    .entry-audio-note {
      font-size: 9.5pt;
      font-style: italic;
      color: #7D776F;
      padding: 8px 14px;
      background: #F4EFE6;
      border-left: 2px solid #8C533E;
      margin: 14px 0;
    }
    .colophon {
      margin-top: 80px;
      text-align: center;
      font-style: italic;
      color: #9E9991;
      font-size: 10.5pt;
      page-break-before: always;
    }
  </style>
</head>
<body>
  <button class="print-controls" onclick="window.print()">Print / Save as PDF</button>

  <div class="title-page">
    <h1 class="main-title">In the Meantime</h1>
    <div class="subtitle">“These are the things I would have told you if you were already here.”</div>
    <div class="dedication">${salutation}</div>
    <div class="collection-info">${onlyForYou ? 'Curated Collection for You' : 'The Complete Archive'} &bull; ${entries.length} Entries</div>
  </div>

  <div class="entries-container">
    ${sorted.map((entry, i) => `
      <div class="entry-card ${i > 0 && i % 4 === 0 ? 'page-break' : ''}">
        <div class="entry-date">${formatDate(entry.entry_date)}</div>
        ${entry.title ? `<h2 class="entry-title">${escapeHtml(entry.title)}</h2>` : ''}
        <div class="entry-body">${escapeHtml(entry.body)}</div>
        
        ${entry.attachments && entry.attachments.length > 0 ? entry.attachments.map(att => {
          if (att.type === 'image') {
            return `<img class="entry-image" src="${att.file_url}" alt="${escapeHtml(att.filename)}" />`;
          } else {
            return `<div class="entry-audio-note">&#127911; Voice fragment recorded (${att.filename})</div>`;
          }
        }).join('') : ''}

        ${entry.tags && entry.tags.length > 0 ? `<div class="entry-tags">${entry.tags.map(t => `#${escapeHtml(t)}`).join('  ')}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="colophon">
    <p>“My life before you was not an empty waiting room.”</p>
    <p style="font-size: 9pt; color: #BBB6AE;">Archived with In the Meantime &bull; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
