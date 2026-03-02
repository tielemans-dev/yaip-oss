export const enInvoicesMessages = {
  "invoices.title": "Invoices",
  "invoices.loading": "Loading...",
  "invoices.action.new": "New Invoice",
  "invoices.action.create": "Create Invoice",
  "invoices.empty.title": "No invoices yet",
  "invoices.empty.description":
    "Create your first invoice to start billing your clients.",
  "invoices.table.number": "Number",
  "invoices.table.contact": "Contact",
  "invoices.table.issueDate": "Issue Date",
  "invoices.table.dueDate": "Due Date",
  "invoices.table.total": "Total",
  "invoices.table.status": "Status",
  "invoices.status.draft": "Draft",
  "invoices.status.sent": "Sent",
  "invoices.status.paid": "Paid",
  "invoices.status.overdue": "Overdue",
  "invoices.delete.title": "Delete invoice",
  "invoices.delete.description":
    "Are you sure you want to delete invoice {number}? This action cannot be undone.",
  "invoices.action.cancel": "Cancel",
  "invoices.action.delete": "Delete",
  "invoices.new.title": "New Invoice",
  "invoices.new.field.dueDate": "Due Date",
  "invoices.new.validation.dueDateRequired": "Please set a due date",
  "invoices.new.error.createFailed": "Failed to create invoice",
  "invoices.new.notes.placeholder": "Payment terms, thank you note, etc.",
  "invoices.new.ai.label": "Draft with AI",
  "invoices.new.ai.placeholder":
    "Example: Create an invoice for Acme for 8 hours of design at 1200 DKK/hour, due in 14 days.",
  "invoices.new.ai.action.generate": "Generate Draft",
  "invoices.new.ai.action.generating": "Generating...",
  "invoices.new.ai.availability.checking": "Checking AI availability...",
  "invoices.new.ai.availability.disabled":
    "AI BYOK is currently disabled for this distribution.",
  "invoices.new.ai.error.promptRequired":
    "Please describe the invoice first.",
  "invoices.new.ai.error.generateFailed": "Failed to generate draft from AI.",
  "invoices.new.ai.info.contactNotMatched":
    "Draft generated. Contact \"{name}\" was not matched automatically.",
} as const
