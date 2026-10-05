/**
 * Letter Pagination Utilities for In the Meantime
 * Handles multi-page stationery letters, line budgeting per page,
 * and seamless continuation pages.
 */

export const PAGE_BREAK_DELIMITER = '\n\n---page---\n\n';

// Average characters per line on paper at standard font size (~1.14rem)
export const LINE_CHAR_BUDGET = 42;

// Strict visual lines allowed per physical stationery sheet
// Page 1 with attachments (photos / voice memo): max 8 lines so attachments fit comfortably
export const MAX_LINES_PAGE_1_WITH_ATTACHMENTS = 8;
// Clean stationery page (no attachments, or Page 2+): max 14 lines so text never bleeds off paper
export const MAX_LINES_CLEAN_PAGE = 14;

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
 * Enforces strict visual line limits per page so text NEVER bleeds out of the letter.
 */
export function splitLetterIntoPages(fullBody: string, hasAttachments: boolean = false): string[] {
  if (!fullBody || fullBody.trim() === '') {
    return [''];
  }

  // 1. If explicit page breaks exist, respect them while ensuring none exceeds max lines
  if (fullBody.includes('---page---')) {
    const rawPages = fullBody.split(/---+page---+/g).map(p => p.trim());
    const finalPages: string[] = [];

    rawPages.forEach((raw, idx) => {
      const isFirst = idx === 0 && finalPages.length === 0;
      const budget = isFirst && hasAttachments ? MAX_LINES_PAGE_1_WITH_ATTACHMENTS : MAX_LINES_CLEAN_PAGE;

      if (countVisualLines(raw) <= budget) {
        finalPages.push(raw);
      } else {
        // Subdivide overflowing explicit page
        const subPages = paginateContinuousText(raw, isFirst, hasAttachments);
        finalPages.push(...subPages);
      }
    });

    return finalPages.length > 0 ? finalPages : [''];
  }

  // 2. Natural automatic line-budget pagination
  return paginateContinuousText(fullBody, true, hasAttachments);
}

/**
 * Paginates continuous text into pages respecting line limits.
 */
function paginateContinuousText(text: string, startsAsFirstPage: boolean, hasAttachments: boolean): string[] {
  const paragraphs = text.split(/\n\n+/);
  const pages: string[] = [];
  let currentPage = '';
  let isFirst = startsAsFirstPage;

  for (const para of paragraphs) {
    const maxLines = isFirst && hasAttachments ? MAX_LINES_PAGE_1_WITH_ATTACHMENTS : MAX_LINES_CLEAN_PAGE;

    // Test if entire paragraph fits in remaining space of current page
    const testWithPara = currentPage ? currentPage + '\n\n' + para : para;
    if (countVisualLines(testWithPara) <= maxLines) {
      currentPage = testWithPara;
    } else {
      // If current page already has content, push it to finish that page
      if (currentPage) {
        pages.push(currentPage);
        currentPage = '';
        isFirst = false;
      }

      const nextMaxLines = isFirst && hasAttachments ? MAX_LINES_PAGE_1_WITH_ATTACHMENTS : MAX_LINES_CLEAN_PAGE;

      // If the paragraph itself fits on a fresh page:
      if (countVisualLines(para) <= nextMaxLines) {
        currentPage = para;
      } else {
        // Paragraph is longer than a full page; subdivide it
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
    }
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [text];
}

/**
 * Updates a specific page in a multi-page letter, joining them back together.
 * If edited content exceeds max lines for that page, excess flows to next page.
 */
export function updateLetterPage(
  fullBody: string,
  pageIndex: number,
  newPageContent: string,
  hasAttachments: boolean = false
): string {
  const pages = splitLetterIntoPages(fullBody, hasAttachments);
  while (pages.length <= pageIndex) {
    pages.push('');
  }

  const isFirst = pageIndex === 0;
  const maxLines = isFirst && hasAttachments ? MAX_LINES_PAGE_1_WITH_ATTACHMENTS : MAX_LINES_CLEAN_PAGE;

  if (countVisualLines(newPageContent) <= maxLines) {
    pages[pageIndex] = newPageContent;
  } else {
    // Content overflowed pageIndex! Split and cascade into following pages
    const subPages = paginateContinuousText(newPageContent, isFirst, hasAttachments);
    pages.splice(pageIndex, 1, ...subPages);
  }

  return pages.join(PAGE_BREAK_DELIMITER);
}

/**
 * Appends a new blank physical page to the letter.
 */
export function addNewPageToLetter(fullBody: string, hasAttachments: boolean = false): {
  updatedBody: string;
  newPageIndex: number;
} {
  const pages = splitLetterIntoPages(fullBody, hasAttachments);
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

