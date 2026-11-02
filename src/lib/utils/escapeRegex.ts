/** Escape user input so MongoDB matches it literally instead of running it as a regular expression. */
export function escapeRegex(input: string, maxLength = 80): string {
  return input.slice(0, maxLength).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
