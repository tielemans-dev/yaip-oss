import { getRuntimeCapabilities } from "../../lib/runtime/extensions"
import { publicProcedure, router } from "../init"

export const runtimeRouter = router({
  capabilities: publicProcedure.query(() => getRuntimeCapabilities()),
})
