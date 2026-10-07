/**
 * Letter Pagination Utilities for In the Meantime
 * Handles multi-page stationery letters, line budgeting per page,
 * and seamless continuation pages.
 */

export const PAGE_BREAK_DELIMITER = '\n\n---page---\n\n';

// Average characters per line on paper at standard font size (~1.14rem)
export const LINE_CHAR_BUDGET = 50;

// Default visual line capacity per physical stationery sheet
// Page 1 with attachments (photos / voice memo): comfortable 10 lines
export const MAX_LINES_PAGE_1_WITH_ATTACHMENTS = 10;
// Clean stationery page (no attachments, or Page 2+): 16 lines filling ~88% of the paper
export const MAX_LINES_CLEAN_PAGE = 16;

/**
 * Calculates visual lines consumed by a string:
 * - Each explicit newline (\n) creates a new line.
 * - Long lines wrap: Math.ceil(line.length / LINE_CHAR_BUDGET)
 * - Empty newlines count as 1 vertical line spacing
 */
export function countVisualLines(text: string): number {
  if (!text) return 0;
  const lines = text.split('\n');
  let total = 0;
  for (const line of lines) {
    if (line.length === 0) {
      total += 1;
    } else {
      total += Math.max(1, Math.ceil(line.length / LINE_CHAR_BUDGET));
    }
  }
  return total;
}

/**
 * Breaks a single long paragraph into chunks that each fit within maxLines.
 */
function splitLongParagraph(paragraph: string, maxLines: number): string[] {
  if (countVisualLines(paragraph) <= maxLines) {
    return [paragraph];
  }

  // Try splitting by sentences first (. ? !)
  const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [paragraph];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const candidate = currentChunk ? currentChunk + ' ' + sentence.trim() : sentence.trim();
    if (countVisualLines(candidate) <= maxLines) {
      currentChunk = candidate;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If a single sentence is itself longer than maxLines, split by words
      if (countVisualLines(sentence) > maxLines) {
        const words = sentence.trim().split(/\s+/);
        let wordChunk = '';
        for (const w of words) {
          const wordCandidate = wordChunk ? wordChunk + ' ' + w : w;
          if (countVisualLines(wordCandidate) <= maxLines) {
            wordChunk = wordCandidate;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        currentChunk = wordChunk;
      } else {
        currentChunk = sentence.trim();
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [paragraph];
}

/**
 * Splits a full letter body into discrete physical stationery pages.
 * Fills each page to genuine capacity so letters never prematurely break halfway down the paper.
 */
export function splitLetterIntoPages(
  fullBody: string,
  hasAttachments: boolean = false,
  maxCleanLines: number = MAX_LINES_CLEAN_PAGE,
  maxAttachmentLines: number = MAX_LINES_PAGE_1_WITH_ATTACHMENTS
): string[] {
  if (!fullBody || fullBody.trim() === '') {
    return [''];
  }

  // 1. If explicit manual page breaks exist (from deliberate '+ New page' actions)
  if (fullBody.includes('---page---')) {
    const rawPages = fullBody.split(/---+page---+/g);
    // If any page is completely empty, it was deliberately created with '+ New page'
    const hasDeliberateBlankPage = rawPages.some(p => p.trim() === '');
    if (hasDeliberateBlankPage) {
      const finalPages: string[] = [];
      rawPages.forEach((raw, idx) => {
        const isFirst = idx === 0 && finalPages.length === 0;
        const budget = isFirst && hasAttachments ? maxAttachmentLines : maxCleanLines;
        if (countVisualLines(raw) <= budget) {
          finalPages.push(raw.trim());
        } else {
          const subPages = paginateContinuousText(raw.trim(), isFirst, hasAttachments, maxCleanLines, maxAttachmentLines);
          finalPages.push(...subPages);
        }
      });
      return finalPages.length > 0 ? finalPages : [''];
    }

    // Otherwise, recombine previously auto-paginated chunks so writing fills each sheet fully
    const unified = rawPages.map(p => p.trim()).filter(Boolean).join('\n\n');
    return paginateContinuousText(unified, true, hasAttachments, maxCleanLines, maxAttachmentLines);
  }

  // 2. Natural automatic line-budget pagination
  return paginateContinuousText(fullBody, true, hasAttachments, maxCleanLines, maxAttachmentLines);
}

/**
 * Paginates continuous text into pages respecting line limits.
 * Letters now fill the entire stationery sheet before moving to a new page.
 */
function paginateContinuousText(
  text: string,
  startsAsFirstPage: boolean,
  hasAttachments: boolean,
  maxCleanLines: number = MAX_LINES_CLEAN_PAGE,
  maxAttachmentLines: number = MAX_LINES_PAGE_1_WITH_ATTACHMENTS
): string[] {
  const paragraphs = text.split(/\n\n+/);
  const pages: string[] = [];
  let currentPage = '';
  let isFirst = startsAsFirstPage;

  for (const para of paragraphs) {
    const maxLines = isFirst && hasAttachments ? maxAttachmentLines : maxCleanLines;

    // 1. If entire paragraph fits in remaining space of current page, append it
    const testWithPara = currentPage ? currentPage + '\n\n' + para : para;
    if (countVisualLines(testWithPara) <= maxLines) {
      currentPage = testWithPara;
      continue;
    }

    // 2. If current page is already well-filled (within 2 lines of maxLines),
    // start this paragraph cleanly on the next page
    const currentLines = countVisualLines(currentPage);
    if (currentPage && currentLines >= (maxLines - 2)) {
      pages.push(currentPage);
      currentPage = '';
      isFirst = false;

      const nextMaxLines = isFirst && hasAttachments ? maxAttachmentLines : maxCleanLines;
      if (countVisualLines(para) <= nextMaxLines) {
        currentPage = para;
      } else {
        const chunks = splitLongParagraph(para, nextMaxLines);
        for (let i = 0; i < chunks.length; i++) {
          if (i === chunks.length - 1) {
            currentPage = chunks[i];
          } else {
            pages.push(chunks[i]);
            isFirst = false;
          }
        }
      }
      continue;
    }

    // 3. Otherwise, current page still has significant space remaining.
    // Fill the remaining lines of this page with sentences from `para` so the sheet fills completely!
    const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [para];
    let sentenceIdx = 0;
    while (sentenceIdx < sentences.length) {
      const sentence = sentences[sentenceIdx].trim();
      const testCandidate = currentPage ? currentPage + (currentPage.endsWith('\n') ? '' : ' ') + sentence : sentence;
      const targetMax = isFirst && hasAttachments ? maxAttachmentLines : maxCleanLines;

      if (countVisualLines(testCandidate) <= targetMax) {
        currentPage = testCandidate;
        sentenceIdx++;
      } else {
        if (currentPage) {
          pages.push(currentPage);
          currentPage = '';
          isFirst = false;
        }
        const remainingText = sentences.slice(sentenceIdx).join(' ').trim();
        const nextTargetMax = isFirst && hasAttachments ? maxAttachmentLines : maxCleanLines;
        if (countVisualLines(remainingText) <= nextTargetMax) {
          currentPage = remainingText;
        } else {
          const chunks = splitLongParagraph(remainingText, nextTargetMax);
          for (let i = 0; i < chunks.length; i++) {
            if (i === chunks.length - 1) {
              currentPage = chunks[i];
            } else {
              pages.push(chunks[i]);
              isFirst = false;
            }
          }
        }
        break;
      }
    }
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [text];
}

/**
 * Updates a specific page in a multi-page letter, joining them back together.
 */
export function updateLetterPage(
  fullBody: string,
  pageIndex: number,
  newPageContent: string,
  hasAttachments: boolean = false,
  maxCleanLines: number = MAX_LINES_CLEAN_PAGE,
  maxAttachmentLines: number = MAX_LINES_PAGE_1_WITH_ATTACHMENTS
): string {
  const pages = splitLetterIntoPages(fullBody, hasAttachments, maxCleanLines, maxAttachmentLines);
  while (pages.length <= pageIndex) {
    pages.push('');
  }

  const isFirst = pageIndex === 0;
  const maxLines = isFirst && hasAttachments ? maxAttachmentLines : maxCleanLines;

  if (countVisualLines(newPageContent) <= maxLines) {
    pages[pageIndex] = newPageContent;
  } else {
    // Content overflowed pageIndex! Split and cascade into following pages
    const subPages = paginateContinuousText(newPageContent, isFirst, hasAttachments, maxCleanLines, maxAttachmentLines);
    pages.splice(pageIndex, 1, ...subPages);
  }

  return pages.join(PAGE_BREAK_DELIMITER);
}

/**
 * Appends a new blank physical page to the letter.
 */
export function addNewPageToLetter(
  fullBody: string,
  hasAttachments: boolean = false,
  maxCleanLines: number = MAX_LINES_CLEAN_PAGE,
  maxAttachmentLines: number = MAX_LINES_PAGE_1_WITH_ATTACHMENTS
): {
  updatedBody: string;
  newPageIndex: number;
} {
  const pages = splitLetterIntoPages(fullBody, hasAttachments, maxCleanLines, maxAttachmentLines);
  pages.push('');
  return {
    updatedBody: pages.join(PAGE_BREAK_DELIMITER),
    newPageIndex: pages.length - 1,
  };
}

/**
 * Deletes a page from a multi-page letter.
 */
export function deleteLetterPage(
  fullBody: string,
  pageIndex: number,
  hasAttachments: boolean = false
): string {
  const pages = splitLetterIntoPages(fullBody, hasAttachments);
  if (pages.length <= 1) {
    return '';
  }
  pages.splice(pageIndex, 1);
  return pages.join(PAGE_BREAK_DELIMITER);
}

