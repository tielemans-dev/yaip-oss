import { describe, expect, it, vi } from "vitest"

import { loadInvoicesListData } from "../_app/invoices/-index.helpers"

describe("invoices index performance helpers", () => {
  it("loads the list without calling markOverdue first", async () => {
    const markOverdue = vi.fn()
    const list = vi.fn().mockResolvedValue([{ id: "inv-1" }])

    const result = await loadInvoicesListData({
      list,
      markOverdue,
    })

    expect(result).toEqual([{ id: "inv-1" }])
    expect(list).toHaveBeenCalledTimes(1)
    expect(markOverdue).not.toHaveBeenCalled()
  })
})
