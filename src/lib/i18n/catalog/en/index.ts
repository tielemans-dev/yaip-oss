import { enAuthMessages } from "./auth"
import { enBillingMessages } from "./billing"
import { enCatalogMessages } from "./catalog"
import { enContactsMessages } from "./contacts"
import { enDashboardMessages } from "./dashboard"
import { enDocFormMessages } from "./doc-form"
import { enEmailMessages } from "./email"
import { enInvoicesMessages } from "./invoices"
import { enInvitationMessages } from "./invitation"
import { enNavMessages } from "./nav"
import { enPdfMessages } from "./pdf"
import { enQuotesMessages } from "./quotes"
import { enRootMessages } from "./root"
import { enSetupMessages } from "./setup"
import { enStatusMessages } from "./status"
import { enUiMessages } from "./ui"
import { enUserMessages } from "./user"

export const enCatalog = {
  ...enAuthMessages,
  ...enBillingMessages,
  ...enCatalogMessages,
  ...enContactsMessages,
  ...enDashboardMessages,
  ...enDocFormMessages,
  ...enEmailMessages,
  ...enInvoicesMessages,
  ...enInvitationMessages,
  ...enNavMessages,
  ...enPdfMessages,
  ...enQuotesMessages,
  ...enRootMessages,
  ...enSetupMessages,
  ...enStatusMessages,
  ...enUiMessages,
  ...enUserMessages,
} as const
