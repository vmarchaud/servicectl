
import { TemplateOptions } from '../types'

export const generateServiceFile = async (service: TemplateOptions): Promise<string> => {
  return `[Unit]
${
  Object.entries(service.unit).map(([key, value]) => {
    return `${key}=${value}`
  }).join('\n')
}
After=network.target

[Service]
${
  Object.entries(service.service).map(([key, value]) => {
    return `${key}=${value}`
  }).join('\n')
}
${
  Object.entries(service.permissions).map(([key, value]) => {
    return `${key}=${value}`
  }).join('\n')
}
${
  Object.entries(service.exec).map(([key, value]) => {
    return `${key}=${value}`
  }).join('\n')
}
CPUAccounting=yes
MemoryAccounting=yes

[Install]
WantedBy=multi-user.target
`
}
