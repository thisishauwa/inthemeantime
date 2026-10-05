/**
 * Letter Pagination Utilities for In the Meantime
 * Handles multi-page stationery letters, pagination chunking, and page-flipping.
 */

export const PAGE_BREAK_DELIMITER = '\n\n---page---\n\n';

/**
 * Splits a full letter body into discrete physical stationery pages.
 * Supports explicit page break markers, as well as natural paragraph-aware
 * automatic pagination for long letters.
 */
export function splitLetterIntoPages(fullBody: string, hasAttachments: boolean = false): string[] {
  if (!fullBody || fullBody.trim() === '') {
    return [''];
  }

  // 1. If explicit page breaks exist, respect them strictly
  if (fullBody.includes('---page---')) {
    const rawPages = fullBody.split(/---+page---+/g).map(p => p.trim());
    return rawPages.length > 0 ? rawPages : [''];
  }

  // 2. Natural automatic pagination budget (characters)
  // Page 1 has less space if polaroid photos or voice notes are cellotaped
  const page1Budget = hasAttachments ? 750 : 1100;
  const pageNBudget = 1150;

  // If letter is within Page 1 capacity, keep as single page
  if (fullBody.length <= page1Budget) {
    return [fullBody];
  }

  const pages: string[] = [];
  const paragraphs = fullBody.split(/\n\n+/);
  let currentPage = '';
  let isFirstPage = true;

  for (const para of paragraphs) {
    const budget = isFirstPage ? page1Budget : pageNBudget;

    if (!currentPage) {
      currentPage = para;
    } else if ((currentPage.length + para.length + 2) <= budget) {
      currentPage += '\n\n' + para;
    } else {
      // Current page is full, push and start next page
      pages.push(currentPage);
      currentPage = para;
      isFirstPage = false;
    }
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [fullBody];
}

/**
 * Updates a specific page in a multi-page letter, joining them back together.
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
  pages[pageIndex] = newPageContent;
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
