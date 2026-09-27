/**
 * Fold a name for comparison: strip diacritics and punctuation, lowercase.
 * "Mötley Crüe" (Ticketmaster) and "Motley Crue" (SeatGeek) fold to the same key.
 */
export const foldText = (value: string | undefined): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase()
