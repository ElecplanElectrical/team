# Finance foundation

Accepted quotes can be converted to a single client invoice from the Quotes screen.

- New quotes store structured line items with quantity, unit price and GST rate.
- Quote subtotal, GST and total are calculated server-side.
- Conversion copies line items and tax totals into the invoice.
- `Invoice.sourceQuoteId` is unique, preventing duplicate quote-to-invoice conversion.
- Linked jobs are moved to `INVOICED` only when conversion succeeds.
- Xero remains disconnected; no sync or OAuth behavior is added here.
