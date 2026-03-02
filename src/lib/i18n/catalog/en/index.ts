import { enAuthMessages } from "./auth"
import { enCatalogMessages } from "./catalog"
import { enContactsMessages } from "./contacts"
import { enDashboardMessages } from "./dashboard"
import { enEmailMessages } from "./email"
import { enInvitationMessages } from "./invitation"
import { enNavMessages } from "./nav"
import { enPdfMessages } from "./pdf"
import { enRootMessages } from "./root"
import { enSetupMessages } from "./setup"
import { enStatusMessages } from "./status"
import { enUiMessages } from "./ui"
import { enUserMessages } from "./user"

export const enCatalog = {
  ...enAuthMessages,
  ...enCatalogMessages,
  ...enContactsMessages,
  ...enDashboardMessages,
  ...enEmailMessages,
  ...enInvitationMessages,
  ...enNavMessages,
  ...enPdfMessages,
  ...enRootMessages,
  ...enSetupMessages,
  ...enStatusMessages,
  ...enUiMessages,
  ...enUserMessages,
} as const
