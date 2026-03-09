import {
  setRuntimeExtensions,
  type RuntimeExtension,
} from "./extensions"
import {
  resetRuntimeServices,
  setRuntimeServices,
  type RuntimeServices,
} from "./services"
import {
  resetRuntimePlatform,
  setRuntimePlatform,
  type RuntimePlatform,
} from "./platform"

export function bootstrapYaipRuntime(input: {
  platform?: RuntimePlatform
  extensions?: RuntimeExtension[]
  services?: Partial<RuntimeServices>
}) {
  if (input.platform) {
    setRuntimePlatform(input.platform)
  }

  if (input.extensions) {
    setRuntimeExtensions(input.extensions)
  }

  if (input.services) {
    setRuntimeServices(input.services)
  }
}

export function resetYaipRuntimeForTests() {
  resetRuntimePlatform()
  setRuntimeExtensions([])
  resetRuntimeServices()
}
