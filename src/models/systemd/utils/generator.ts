
import { TemplateOptions, ServiceTemplateOptions, UnitTemplateOptions } from '../types'

export const generateServiceFile = async (service: TemplateOptions): Promise<string> => {
  return `[Unit]
${
  Object.entries(service.unit).map(([key, value]) => {
    return `${key}=${value}`
  }).join('\n')
}

[Service]
${
  Object.entries(service.service).map(([key, value]) => {
    return `${key}=${value}`
  }).join('\n')
}

[Install]
WantedBy=multi-user.target
  `
}
