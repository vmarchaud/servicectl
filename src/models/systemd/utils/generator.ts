
import { TemplateOptions, SocketTemplateOptions } from '../types'

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
  service.environment.map(entry => {
    return `Environment= ${entry.key}=${entry.value}`
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

export const generateSocketFile = async (socket: SocketTemplateOptions): Promise<string> => {
  return `[Unit]
Description=Socket for worker of ${socket.Service}

[Socket]
Accept=no
${
  Object.entries(socket).map(([key, value]) => {
    return `${key}=${value}`
  }).join('\n')
}

[Install]
WantedBy=sockets.target
`
}
