
import * as dbus from 'dbus-next'

const systemBus = dbus.systemBus()

export const getSystemBus = () => systemBus