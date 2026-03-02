import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { trpc } from "../../../trpc/client"
import { applyCatalogItemToLineItem, type CatalogItemOption } from "../../../lib/catalog"
import { LocalizedDateField } from "../../../components/localized-date-field"
import {
  formatCurrency as formatCurrencyIntl,
  formatDate as formatDateIntl,
} from "../../../lib/i18n/format"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog"
import { Send, Pencil, Trash2, Plus, ArrowLeft, ArrowRight, XCircle } from "lucide-react"
import { useI18n } from "../../../lib/i18n/react"

export const Route = createFileRoute("/_app/quotes/$quoteId")({
  validateSearch: (search: Record<string, unknown>) => ({
    emailWarning: typeof search.emailWarning === "string" ? search.emailWarning : undefined,
  }),
  component: QuoteDetailPage,
})

type Contact = {
  id: string
  name: string
  email: string | null
  company: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

type QuoteItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  sortOrder: number
}

type Quote = {
  id: string
  number: string
  status: string
  issueDate: string
  expiryDate: string
  subtotal: number
  taxAmount: number
  total: number
  currency: string
  notes: string | null
  contact: Contact
  items: QuoteItem[]
  invoices: { id: string; number: string }[]
}

type EditItem = {
  description: string
  quantity: number
  unitPrice: number
  catalogItemId?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  expired: { label: "Expired", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
}

function formatCurrency(amount: number, currency: string, locale?: string | null) {
  return formatCurrencyIntl(amount, currency, locale)
}

function formatDate(dateStr: string, locale?: string | null) {
  return formatDateIntl(dateStr, locale)
}

function StatusBadge({
  status,
  tm,
}: {
  status: string
  tm: (messages: { en: string } & Record<string, string | undefined>) => string
}) {
  const config = statusConfig[status] ?? statusConfig.draft
  return (
    <Badge variant="outline" className={config.className}>
      {tm({
        en: config.label,
        da:
          config.label === "Draft"
            ? "Kladde"
            : config.label === "Sent"
              ? "Sendt"
              : config.label === "Accepted"
                ? "Accepteret"
                : config.label === "Rejected"
                  ? "Afvist"
                  : "Udløbet",
      })}
    </Badge>
  )
}

function QuoteDetailPage() {
  const { tm, locale } = useI18n()
  const { quoteId } = Route.useParams()
  const { emailWarning } = Route.useSearch()
  const navigate = useNavigate()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(emailWarning
    ? tm({
        en: `Quote marked as sent — email not delivered: ${emailWarning}`,
        da: `Tilbud markeret som sendt — e-mail ikke leveret: ${emailWarning}`,
      })
    : null)
  const [acting, setActing] = useState(false)
  const [editing, setEditing] = useState(false)

  // Edit state
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItemOption[]>([])
  const [editContactId, setEditContactId] = useState("")
  const [editExpiryDate, setEditExpiryDate] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editTaxRate, setEditTaxRate] = useState(0)
  const [editItems, setEditItems] = useState<EditItem[]>([])

  useEffect(() => {
    trpc.quotes.get
      .query({ id: quoteId })
      .then((data) => {
        const q = data as unknown as Quote
        setQuote(q)
      })
      .catch(() => setError(tm({ en: "Quote not found", da: "Tilbud blev ikke fundet" })))
      .finally(() => setLoading(false))
  }, [quoteId])

  function startEditing() {
    if (!quote) return
    setEditContactId(quote.contact.id)
    setEditExpiryDate(new Date(quote.expiryDate).toISOString().split("T")[0])
    setEditNotes(quote.notes ?? "")
    setEditTaxRate(
      quote.subtotal > 0
        ? Math.round((quote.taxAmount / quote.subtotal) * 10000) / 100
        : 0
    )
    setEditItems(
      quote.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        catalogItemId: undefined,
      }))
    )
    Promise.all([trpc.contacts.list.query(), trpc.catalog.list.query()]).then(
      ([contactsData, catalogData]) => {
        setContacts(contactsData as { id: string; name: string }[])
        setCatalogItems(catalogData as CatalogItemOption[])
      }
    )
    setEditing(true)
  }

  function updateEditItem(index: number, field: keyof EditItem, value: string | number) {
    setEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function addEditItem() {
    setEditItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])
  }

  function removeEditItem(index: number) {
    if (editItems.length <= 1) return
    setEditItems((prev) => prev.filter((_, i) => i !== index))
  }

  function applyCatalogItemToEditItem(index: number, catalogItemId: string) {
    setEditItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        return applyCatalogItemToLineItem(item, catalogItemId, catalogItems)
      })
    )
  }

  async function handleSaveEdit() {
    if (!quote) return
    setError(null)
    setActing(true)
    try {
      const updated = await trpc.quotes.update.mutate({
        id: quote.id,
        contactId: editContactId,
        expiryDate: editExpiryDate,
        notes: editNotes,
        taxRate: editTaxRate,
        items: editItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      })
      setQuote(updated as unknown as Quote)
      setEditing(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to update quote", da: "Kunne ikke opdatere tilbud" })
      )
    } finally {
      setActing(false)
    }
  }

  async function handleSend() {
    if (!quote) return
    setActing(true)
    try {
      const result = await trpc.quotes.send.mutate({ id: quote.id })
      // Reload full quote
      const updated = await trpc.quotes.get.query({ id: quoteId })
      setQuote(updated as unknown as Quote)
      if (result.emailSkipReason) {
        setError(
          tm({
            en: `Quote marked as sent — email not delivered: ${result.emailSkipReason}`,
            da: `Tilbud markeret som sendt — e-mail ikke leveret: ${result.emailSkipReason}`,
          })
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to send quote", da: "Kunne ikke sende tilbud" })
      )
    } finally {
      setActing(false)
    }
  }

  async function handleReject() {
    if (!quote) return
    setActing(true)
    try {
      await trpc.quotes.reject.mutate({ id: quote.id })
      const updated = await trpc.quotes.get.query({ id: quoteId })
      setQuote(updated as unknown as Quote)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to reject quote", da: "Kunne ikke afvise tilbud" })
      )
    } finally {
      setActing(false)
    }
  }

  async function handleConvertToInvoice() {
    if (!quote) return
    setActing(true)
    try {
      const invoice = await trpc.quotes.convertToInvoice.mutate({ id: quote.id })
      navigate({ to: "/invoices/$invoiceId", params: { invoiceId: invoice.id }, search: { emailWarning: undefined } })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({
              en: "Failed to convert quote to invoice",
              da: "Kunne ikke konvertere tilbud til faktura",
            })
      )
      setActing(false)
    }
  }

  async function handleDelete() {
    if (!quote) return
    setActing(true)
    try {
      await trpc.quotes.delete.mutate({ id: quote.id })
      navigate({ to: "/quotes" })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to delete quote", da: "Kunne ikke slette tilbud" })
      )
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{tm({ en: "Loading...", da: "Indlæser..." })}</p>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          {error ?? tm({ en: "Quote not found", da: "Tilbud blev ikke fundet" })}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/quotes" })}
        >
          {tm({ en: "Back to Quotes", da: "Tilbage til tilbud" })}
        </Button>
      </div>
    )
  }

  // Edit mode
  if (editing) {
    const editSubtotal = editItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const editTaxAmount = editSubtotal * editTaxRate / 100
    const editTotal = editSubtotal + editTaxAmount

    return (
      <div className="p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>
              {tm({ en: "Edit Quote", da: "Rediger tilbud" })} {quote.number}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{tm({ en: "Contact", da: "Kontakt" })} *</Label>
                <Select value={editContactId} onValueChange={setEditContactId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={tm({ en: "Select a contact", da: "Vælg en kontakt" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editExpiryDate">{tm({ en: "Expiry Date", da: "Udløbsdato" })} *</Label>
                <LocalizedDateField
                  id="editExpiryDate"
                  value={editExpiryDate}
                  onChange={setEditExpiryDate}
                  locale={locale}
                  placeholder={tm({ en: "Select a date", da: "Vælg en dato" })}
                  clearLabel={tm({ en: "Clear", da: "Ryd" })}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="grid gap-3">
              <Label>{tm({ en: "Line Items", da: "Linjer" })}</Label>
              <div className="rounded-md border">
                <div className="grid grid-cols-[180px_1fr_80px_100px_100px_40px] gap-2 p-3 border-b bg-muted/50 text-sm font-medium">
                  <span>{tm({ en: "Item", da: "Vare" })}</span>
                  <span>{tm({ en: "Description", da: "Beskrivelse" })}</span>
                  <span>{tm({ en: "Qty", da: "Antal" })}</span>
                  <span>{tm({ en: "Unit Price", da: "Enhedspris" })}</span>
                  <span>{tm({ en: "Total", da: "Total" })}</span>
                  <span />
                </div>
                {editItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[180px_1fr_80px_100px_100px_40px] gap-2 p-3 border-b last:border-0 items-center"
                  >
                    <Select
                      value={item.catalogItemId}
                      onValueChange={(value) => applyCatalogItemToEditItem(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            catalogItems.length > 0
                              ? tm({ en: "Select item", da: "Vælg vare" })
                              : tm({ en: "No saved items", da: "Ingen gemte varer" })
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogItems.map((catalogItem) => (
                          <SelectItem key={catalogItem.id} value={catalogItem.id}>
                            {catalogItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={tm({ en: "Description", da: "Beskrivelse" })}
                      value={item.description}
                      onChange={(e) => updateEditItem(index, "description", e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateEditItem(index, "quantity", parseFloat(e.target.value) || 0)
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateEditItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                    />
                    <span className="text-sm text-right pr-2">
                      {formatCurrency(item.quantity * item.unitPrice, quote.currency, locale)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeEditItem(index)}
                      disabled={editItems.length <= 1}
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEditItem}
                className="w-fit"
              >
                <Plus className="size-4" />
                {tm({ en: "Add Item", da: "Tilføj vare" })}
              </Button>
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-64 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tm({ en: "Subtotal", da: "Subtotal" })}</span>
                  <span>{formatCurrency(editSubtotal, quote.currency, locale)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground">{tm({ en: "Tax", da: "Moms" })}</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editTaxRate || ""}
                      onChange={(e) => setEditTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-16 h-7 text-xs"
                    />
                    <span className="text-muted-foreground text-xs">%</span>
                    <span className="ml-auto">{formatCurrency(editTaxAmount, quote.currency, locale)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>{tm({ en: "Total", da: "Total" })}</span>
                  <span>{formatCurrency(editTotal, quote.currency, locale)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="editNotes">{tm({ en: "Notes", da: "Noter" })}</Label>
              <Textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={tm({
                  en: "Terms and conditions, additional notes, etc.",
                  da: "Vilkår og betingelser, yderligere noter osv.",
                })}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false)
                setError(null)
              }}
            >
              {tm({ en: "Cancel", da: "Annuller" })}
            </Button>
            <Button type="button" disabled={acting} onClick={handleSaveEdit}>
              {acting
                ? tm({ en: "Saving...", da: "Gemmer..." })
                : tm({ en: "Save Changes", da: "Gem ændringer" })}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // View mode
  const contact = quote.contact

  return (
    <div className="p-6 max-w-3xl">
      {/* Back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/quotes" })}>
          <ArrowLeft className="size-4" />
          {tm({ en: "Back to Quotes", da: "Tilbage til tilbud" })}
        </Button>
        <div className="flex items-center gap-2">
          {quote.status === "draft" && (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="size-4" />
                {tm({ en: "Edit", da: "Rediger" })}
              </Button>
              <Button size="sm" disabled={acting} onClick={handleSend}>
                <Send className="size-4" />
                {acting ? tm({ en: "Sending...", da: "Sender..." }) : tm({ en: "Send", da: "Send" })}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={acting}>
                    <Trash2 className="size-4" />
                    {tm({ en: "Delete", da: "Slet" })}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tm({ en: "Delete quote", da: "Slet tilbud" })}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {tm({
                        en: `Are you sure you want to delete quote ${quote.number}? This action cannot be undone.`,
                        da: `Er du sikker på, at du vil slette tilbud ${quote.number}? Denne handling kan ikke fortrydes.`,
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tm({ en: "Cancel", da: "Annuller" })}</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete}>
                      {tm({ en: "Delete", da: "Slet" })}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {quote.status === "sent" && (
            <>
              <Button size="sm" disabled={acting} onClick={handleConvertToInvoice}>
                <ArrowRight className="size-4" />
                {acting
                  ? tm({ en: "Converting...", da: "Konverterer..." })
                  : tm({ en: "Convert to Invoice", da: "Konverter til faktura" })}
              </Button>
              <Button variant="outline" size="sm" disabled={acting} onClick={handleReject}>
                <XCircle className="size-4" />
                {acting
                  ? tm({ en: "Updating...", da: "Opdaterer..." })
                  : tm({ en: "Mark as Rejected", da: "Marker som afvist" })}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4" role="alert">
          {error}
        </p>
      )}

      {/* Quote content */}
      <Card>
        <CardContent className="p-6 grid gap-6">
          {/* Header */}
            <div className="flex items-start justify-between">
              <div>
              <h1 className="text-2xl font-bold">
                {tm({ en: "Quote", da: "Tilbud" })} {quote.number}
              </h1>
              <div className="mt-1">
                <StatusBadge status={quote.status} tm={tm} />
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  {tm({ en: "Issue Date:", da: "Udstedelsesdato:" })}
                </span>{" "}
                {formatDate(quote.issueDate, locale)}
              </p>
              <p>
                <span className="font-medium text-foreground">
                  {tm({ en: "Expiry Date:", da: "Udløbsdato:" })}
                </span>{" "}
                {formatDate(quote.expiryDate, locale)}
              </p>
            </div>
          </div>

          {/* Linked invoice(s) for accepted quotes */}
          {quote.status === "accepted" && quote.invoices.length > 0 && (
            <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3">
              <p className="text-sm font-medium">
                {tm({ en: "Converted to invoice:", da: "Konverteret til faktura:" })}{" "}
                {quote.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    to="/invoices/$invoiceId"
                    params={{ invoiceId: inv.id }}
                    search={{ emailWarning: undefined }}
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    {inv.number}
                  </Link>
                ))}
              </p>
            </div>
          )}

          {/* Quote To */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              {tm({ en: "Quote To", da: "Tilbud til" })}
            </h3>
            <p className="font-semibold">{contact.name}</p>
            {contact.company && <p className="text-sm">{contact.company}</p>}
            {contact.email && (
              <p className="text-sm text-muted-foreground">{contact.email}</p>
            )}
            {contact.address && <p className="text-sm">{contact.address}</p>}
            {(contact.city || contact.state || contact.zip) && (
              <p className="text-sm">
                {[contact.city, contact.state, contact.zip].filter(Boolean).join(", ")}
              </p>
            )}
            {contact.country && <p className="text-sm">{contact.country}</p>}
          </div>

          {/* Items Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tm({ en: "Description", da: "Beskrivelse" })}</TableHead>
                  <TableHead className="text-right w-[80px]">{tm({ en: "Qty", da: "Antal" })}</TableHead>
                  <TableHead className="text-right w-[120px]">{tm({ en: "Unit Price", da: "Enhedspris" })}</TableHead>
                  <TableHead className="text-right w-[120px]">{tm({ en: "Total", da: "Total" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice, quote.currency, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.total, quote.currency, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tm({ en: "Subtotal", da: "Subtotal" })}</span>
                <span>{formatCurrency(quote.subtotal, quote.currency, locale)}</span>
              </div>
              {quote.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tm({ en: "Tax", da: "Moms" })}</span>
                  <span>{formatCurrency(quote.taxAmount, quote.currency, locale)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>{tm({ en: "Total", da: "Total" })}</span>
                <span>{formatCurrency(quote.total, quote.currency, locale)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {tm({ en: "Notes", da: "Noter" })}
              </h3>
              <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
