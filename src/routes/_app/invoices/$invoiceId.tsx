import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { trpc } from "../../../trpc/client"
import { applyCatalogItemToLineItem, type CatalogItemOption } from "../../../lib/catalog"
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
import { Printer, Send, CheckCircle, Pencil, Trash2, Plus, ArrowLeft, Download } from "lucide-react"
import { downloadInvoicePdf } from "../../../lib/invoice-pdf"
import { useI18n } from "../../../lib/i18n/react"

export const Route = createFileRoute("/_app/invoices/$invoiceId")({
  validateSearch: (search: Record<string, unknown>) => ({
    emailWarning: typeof search.emailWarning === "string" ? search.emailWarning : undefined,
  }),
  component: InvoiceDetailPage,
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

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  sortOrder: number
}

type Invoice = {
  id: string
  number: string
  status: string
  issueDate: string
  dueDate: string
  subtotal: number
  taxAmount: number
  total: number
  currency: string
  notes: string | null
  contact: Contact
  items: InvoiceItem[]
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
  paid: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
}

function formatCurrency(amount: number, currency: string, locale?: string | null) {
  return formatCurrencyIntl(amount, currency, locale)
}

function formatDate(dateStr: string, locale?: string | null, timezone?: string | null) {
  return formatDateIntl(dateStr, locale, timezone)
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
              : config.label === "Paid"
                ? "Betalt"
                : "Forfalden",
      })}
    </Badge>
  )
}

function InvoiceDetailPage() {
  const { tm, locale } = useI18n()
  const { invoiceId } = Route.useParams()
  const { emailWarning } = Route.useSearch()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(emailWarning
    ? tm({
        en: `Invoice marked as sent — email not delivered: ${emailWarning}`,
        da: `Faktura markeret som sendt — e-mail ikke leveret: ${emailWarning}`,
      })
    : null)
  const [acting, setActing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [orgSettings, setOrgSettings] = useState<{
    companyName?: string | null
    companyEmail?: string | null
    companyPhone?: string | null
    companyAddress?: string | null
    companyLogo?: string | null
    locale?: string | null
    timezone?: string | null
  }>({})

  // Edit state
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItemOption[]>([])
  const [editContactId, setEditContactId] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editTaxRate, setEditTaxRate] = useState(0)
  const [editItems, setEditItems] = useState<EditItem[]>([])

  useEffect(() => {
    Promise.all([
      trpc.invoices.get.query({ id: invoiceId }),
      trpc.settings.get.query(),
    ])
      .then(([data, settings]) => {
        setInvoice(data as unknown as Invoice)
        setOrgSettings({
          companyName: settings.companyName,
          companyEmail: settings.companyEmail,
          companyPhone: settings.companyPhone,
          companyAddress: settings.companyAddress,
          companyLogo: settings.companyLogo,
          locale: settings.locale,
          timezone: settings.timezone,
        })
      })
      .catch(() =>
        setError(tm({ en: "Invoice not found", da: "Faktura blev ikke fundet" }))
      )
      .finally(() => setLoading(false))
  }, [invoiceId])

  function startEditing() {
    if (!invoice) return
    setEditContactId(invoice.contact.id)
    setEditDueDate(new Date(invoice.dueDate).toISOString().split("T")[0])
    setEditNotes(invoice.notes ?? "")
    setEditTaxRate(
      invoice.subtotal > 0
        ? Math.round((invoice.taxAmount / invoice.subtotal) * 10000) / 100
        : 0
    )
    setEditItems(
      invoice.items.map((item) => ({
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
    if (!invoice) return
    setError(null)
    setActing(true)
    try {
      const updated = await trpc.invoices.update.mutate({
        id: invoice.id,
        contactId: editContactId,
        dueDate: editDueDate,
        notes: editNotes,
        taxRate: editTaxRate,
        items: editItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      })
      setInvoice(updated as unknown as Invoice)
      setEditing(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to update invoice", da: "Kunne ikke opdatere faktura" })
      )
    } finally {
      setActing(false)
    }
  }

  async function handleSend() {
    if (!invoice) return
    setActing(true)
    try {
      const result = await trpc.invoices.send.mutate({ id: invoice.id })
      // Reload full invoice
      const updated = await trpc.invoices.get.query({ id: invoiceId })
      setInvoice(updated as unknown as Invoice)
      if (result.emailSkipReason) {
        setError(
          tm({
            en: `Invoice marked as sent — email not delivered: ${result.emailSkipReason}`,
            da: `Faktura markeret som sendt — e-mail ikke leveret: ${result.emailSkipReason}`,
          })
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to send invoice", da: "Kunne ikke sende faktura" })
      )
    } finally {
      setActing(false)
    }
  }

  async function handleMarkPaid() {
    if (!invoice) return
    setActing(true)
    try {
      await trpc.invoices.markPaid.mutate({ id: invoice.id })
      const updated = await trpc.invoices.get.query({ id: invoiceId })
      setInvoice(updated as unknown as Invoice)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to mark as paid", da: "Kunne ikke markere som betalt" })
      )
    } finally {
      setActing(false)
    }
  }

  async function handleDelete() {
    if (!invoice) return
    setActing(true)
    try {
      await trpc.invoices.delete.mutate({ id: invoice.id })
      navigate({ to: "/invoices" })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to delete invoice", da: "Kunne ikke slette faktura" })
      )
      setActing(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{tm({ en: "Loading...", da: "Indlæser..." })}</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          {error ?? tm({ en: "Invoice not found", da: "Faktura blev ikke fundet" })}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/invoices" })}
        >
          {tm({ en: "Back to Invoices", da: "Tilbage til fakturaer" })}
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
              {tm({ en: "Edit Invoice", da: "Rediger faktura" })} {invoice.number}
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
                <Label htmlFor="editDueDate">{tm({ en: "Due Date", da: "Forfaldsdato" })} *</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
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
                      {formatCurrency(item.quantity * item.unitPrice, invoice.currency, locale)}
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
                  <span>{formatCurrency(editSubtotal, invoice.currency, locale)}</span>
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
                    <span className="ml-auto">{formatCurrency(editTaxAmount, invoice.currency, locale)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>{tm({ en: "Total", da: "Total" })}</span>
                  <span>{formatCurrency(editTotal, invoice.currency, locale)}</span>
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
                  en: "Payment terms, thank you note, etc.",
                  da: "Betalingsbetingelser, takkenote osv.",
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
  const contact = invoice.contact

  return (
    <div className="p-6 max-w-3xl">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Back button and actions */}
      <div className="flex items-center justify-between mb-6 no-print">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/invoices" })}>
          <ArrowLeft className="size-4" />
          {tm({ en: "Back to Invoices", da: "Tilbage til fakturaer" })}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="size-4" />
            {tm({ en: "Print", da: "Udskriv" })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={downloading}
            onClick={async () => {
              if (!invoice) return
              setDownloading(true)
              try {
                await downloadInvoicePdf(invoice, orgSettings)
              } catch {
                setError(tm({ en: "Failed to generate PDF", da: "Kunne ikke generere PDF" }))
              } finally {
                setDownloading(false)
              }
            }}
          >
            <Download className="size-4" />
            {downloading ? tm({ en: "Generating...", da: "Genererer..." }) : "PDF"}
          </Button>
          {invoice.status === "draft" && (
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
                    <AlertDialogTitle>{tm({ en: "Delete invoice", da: "Slet faktura" })}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {tm({
                        en: `Are you sure you want to delete invoice ${invoice.number}? This action cannot be undone.`,
                        da: `Er du sikker på, at du vil slette faktura ${invoice.number}? Denne handling kan ikke fortrydes.`,
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
          {invoice.status === "sent" && (
            <Button size="sm" disabled={acting} onClick={handleMarkPaid}>
              <CheckCircle className="size-4" />
              {acting
                ? tm({ en: "Updating...", da: "Opdaterer..." })
                : tm({ en: "Mark as Paid", da: "Marker som betalt" })}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4 no-print" role="alert">
          {error}
        </p>
      )}

      {/* Invoice content (printable) */}
      <div className="print-area">
        <Card>
          <CardContent className="p-6 grid gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {tm({ en: "Invoice", da: "Faktura" })} {invoice.number}
                </h1>
                <div className="mt-1">
                  <StatusBadge status={invoice.status} tm={tm} />
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {orgSettings.companyLogo && (
                  <img
                    src={orgSettings.companyLogo}
                    alt={tm({ en: "Company logo", da: "Virksomhedslogo" })}
                    className="ml-auto mb-2 h-12 w-auto max-w-40 object-contain"
                  />
                )}
                <p>
                  <span className="font-medium text-foreground">
                    {tm({ en: "Issue Date:", da: "Udstedelsesdato:" })}
                  </span>{" "}
                  {formatDate(invoice.issueDate, locale, orgSettings.timezone)}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    {tm({ en: "Due Date:", da: "Forfaldsdato:" })}
                  </span>{" "}
                  {formatDate(invoice.dueDate, locale, orgSettings.timezone)}
                </p>
              </div>
            </div>

            {/* Bill To */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {tm({ en: "Bill To", da: "Fakturer til" })}
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
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice, invoice.currency, locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total, invoice.currency, locale)}
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
                  <span>{formatCurrency(invoice.subtotal, invoice.currency, locale)}</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tm({ en: "Tax", da: "Moms" })}</span>
                    <span>{formatCurrency(invoice.taxAmount, invoice.currency, locale)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>{tm({ en: "Total", da: "Total" })}</span>
                  <span>{formatCurrency(invoice.total, invoice.currency, locale)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {tm({ en: "Notes", da: "Noter" })}
                </h3>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
