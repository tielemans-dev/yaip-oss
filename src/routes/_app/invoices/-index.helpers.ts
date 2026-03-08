export async function loadInvoicesListData<T>(client: {
  list: () => Promise<T>
  markOverdue?: () => Promise<unknown>
}) {
  return client.list()
}
