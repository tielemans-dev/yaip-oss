export const daInvoicesMessages = {
  "invoices.title": "Fakturaer",
  "invoices.loading": "Indlæser...",
  "invoices.action.new": "Ny faktura",
  "invoices.action.create": "Opret faktura",
  "invoices.empty.title": "Ingen fakturaer endnu",
  "invoices.empty.description":
    "Opret din første faktura for at begynde at fakturere dine kunder.",
  "invoices.table.number": "Nummer",
  "invoices.table.contact": "Kontakt",
  "invoices.table.issueDate": "Udstedelsesdato",
  "invoices.table.dueDate": "Forfaldsdato",
  "invoices.table.total": "Total",
  "invoices.table.status": "Status",
  "invoices.status.draft": "Kladde",
  "invoices.status.sent": "Sendt",
  "invoices.status.paid": "Betalt",
  "invoices.status.overdue": "Forfalden",
  "invoices.delete.title": "Slet faktura",
  "invoices.delete.description":
    "Er du sikker på, at du vil slette faktura {number}? Denne handling kan ikke fortrydes.",
  "invoices.action.cancel": "Annuller",
  "invoices.action.delete": "Slet",
  "invoices.new.title": "Ny faktura",
  "invoices.new.field.dueDate": "Forfaldsdato",
  "invoices.new.validation.dueDateRequired":
    "Angiv venligst en forfaldsdato",
  "invoices.new.error.createFailed": "Kunne ikke oprette faktura",
  "invoices.new.notes.placeholder":
    "Betalingsbetingelser, takkenote osv.",
  "invoices.new.ai.label": "Kladde med AI",
  "invoices.new.ai.placeholder":
    "Eksempel: Opret en faktura til Acme for 8 timers design á 1200 DKK/time, forfalder om 14 dage.",
  "invoices.new.ai.action.generate": "Generer kladde",
  "invoices.new.ai.action.generating": "Genererer...",
  "invoices.new.ai.availability.checking":
    "Tjekker AI-tilgængelighed...",
  "invoices.new.ai.availability.disabled":
    "AI BYOK er i øjeblikket deaktiveret for denne distribution.",
  "invoices.new.ai.error.promptRequired":
    "Beskriv først fakturaen.",
  "invoices.new.ai.error.generateFailed":
    "Kunne ikke generere kladde med AI.",
  "invoices.new.ai.info.contactNotMatched":
    "Kladde genereret. Kontakt \"{name}\" blev ikke matchet automatisk.",
} as const
