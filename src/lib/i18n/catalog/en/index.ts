import { enAuthMessages } from "./auth"
import { enCatalogMessages } from "./catalog"
import { enDashboardMessages } from "./dashboard"
import { enEmailMessages } from "./email"
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
  ...enDashboardMessages,
  ...enEmailMessages,
  ...enNavMessages,
  ...enPdfMessages,
  ...enRootMessages,
  ...enSetupMessages,
  ...enStatusMessages,
  ...enUiMessages,
  ...enUserMessages,
} as const
