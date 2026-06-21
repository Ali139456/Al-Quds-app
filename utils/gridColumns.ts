/** Category chips on home — always 3 per row when space allows. */
export const EXPLORE_COLUMNS = 3;

/** Menu grid: 2 cols on phones, 3 on wider screens. */
export function getMenuGridColumns(screenWidth: number): number {
  return screenWidth >= 600 ? 3 : 2;
}

export function gridItemWidth(
  screenWidth: number,
  columns: number,
  horizontalPadding: number,
  gap: number
): number {
  const totalGap = gap * (columns - 1);
  return Math.floor((screenWidth - horizontalPadding - totalGap) / columns);
}
