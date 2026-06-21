/** Format price in Pakistani Rupees (PKR) */
export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}
