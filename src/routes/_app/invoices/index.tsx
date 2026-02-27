import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { trpc } from "../../../trpc/client"
import {
  formatCurrency as formatCurrencyIntl,
  formatDate as formatDateIntl,
} from "../../../lib/i18n/format"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
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
import { Plus, Trash2, FileText } from "lucide-react"
import { useI18n } from "../../../lib/i18n/react"

export const Route = createFileRoute("/_app/invoices/")({
  component: InvoicesListPage,
})

type Invoice = {
  id: string
  number: string
  status: string
  issueDate: string
  dueDate: string
  total: number
  currency: string
  contact: { name: string }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  paid: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
}

function formatCurrency(amount: number, currency: string) {
  return formatCurrencyIntl(amount, currency)
}

function formatDate(dateStr: string, locale?: string) {
  return formatDateIntl(dateStr, locale, undefined, { month: "short" })
}

function StatusBadge({ status, tm }: { status: string; tm: (messages: { en: string } & Record<string, string | undefined>) => string }) {
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

function InvoicesListPage() {
  const { tm, locale } = useI18n()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadInvoices() {
    try {
      await trpc.invoices.markOverdue.mutate()
      const data = await trpc.invoices.list.query()
      setInvoices(data as unknown as Invoice[])
    } catch {
      // Auth or org errors handled by layout
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await trpc.invoices.delete.mutate({ id })
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    } catch {
      // Silently fail
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{tm({ en: "Invoices", da: "Fakturaer" })}</h1>
        </div>
        <p className="text-muted-foreground">{tm({ en: "Loading...", da: "Indlæser..." })}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{tm({ en: "Invoices", da: "Fakturaer" })}</h1>
        <Button asChild>
          <Link to="/invoices/new">
            <Plus />
            {tm({ en: "New Invoice", da: "Ny faktura" })}
          </Link>
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">{tm({ en: "No invoices yet", da: "Ingen fakturaer endnu" })}</h2>
          <p className="text-muted-foreground mb-4">
            {tm({
              en: "Create your first invoice to start billing your clients.",
              da: "Opret din første faktura for at begynde at fakturere dine kunder.",
            })}
          </p>
          <Button asChild>
            <Link to="/invoices/new">
              <Plus />
              {tm({ en: "Create Invoice", da: "Opret faktura" })}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tm({ en: "Number", da: "Nummer" })}</TableHead>
                <TableHead>{tm({ en: "Contact", da: "Kontakt" })}</TableHead>
                <TableHead>{tm({ en: "Issue Date", da: "Udstedelsesdato" })}</TableHead>
                <TableHead>{tm({ en: "Due Date", da: "Forfaldsdato" })}</TableHead>
                <TableHead className="text-right">{tm({ en: "Total", da: "Total" })}</TableHead>
                <TableHead>{tm({ en: "Status", da: "Status" })}</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: "/invoices/$invoiceId",
                      params: { invoiceId: invoice.id },
                      search: { emailWarning: undefined },
                    })
                  }
                >
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.contact.name}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate, locale)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate, locale)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} tm={tm} />
                  </TableCell>
                  <TableCell>
                    {invoice.status === "draft" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled={deleting === invoice.id}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
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
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(invoice.id)}
                            >
                              {tm({ en: "Delete", da: "Slet" })}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
