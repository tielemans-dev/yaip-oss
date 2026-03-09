export function createLiveBindingProxy<T extends object>(getTarget: () => T): T {
  return new Proxy({} as T, {
    get(_target, property, _receiver) {
      const target = getTarget()
      const value = Reflect.get(target, property)

      if (typeof value === "function") {
        return value.bind(target)
      }

      return value
    },
    has(_target, property) {
      return property in getTarget()
    },
    ownKeys() {
      return Reflect.ownKeys(getTarget())
    },
    getOwnPropertyDescriptor(_target, property) {
      const descriptor = Object.getOwnPropertyDescriptor(getTarget(), property)

      if (!descriptor) {
        return undefined
      }

      return {
        ...descriptor,
        configurable: true,
      }
    },
  })
}
