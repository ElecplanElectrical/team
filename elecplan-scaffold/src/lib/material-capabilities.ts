/**
 * Barcode stock scanning belongs to Elecplan's operational portal only.
 *
 * Elecplan's original single-business workspace predates BusinessPortal, so a
 * missing slug is retained as the legacy Elecplan case. Every branded customer
 * tenant must be explicitly opted in rather than inheriting the scanner.
 */
export function canUseMaterialScanner(businessSlug: string | null | undefined) {
  return businessSlug == null || businessSlug === "elecplan";
}
