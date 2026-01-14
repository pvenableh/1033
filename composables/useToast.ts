import { toast as sonnerToast } from 'vue-sonner'

interface ToastOptions {
  title?: string
  description?: string
  color?: 'primary' | 'green' | 'red' | 'yellow' | 'blue' | 'gray' | string
  icon?: string
  timeout?: number
  id?: string | number
}

export function useToast() {
  const add = (options: ToastOptions) => {
    const { title, description, color, timeout = 5000, id } = options

    // Map NuxtUI colors to sonner toast types
    const toastFn = (() => {
      switch (color) {
        case 'red':
        case 'error':
          return sonnerToast.error
        case 'green':
        case 'success':
          return sonnerToast.success
        case 'yellow':
        case 'warning':
          return sonnerToast.warning
        case 'blue':
        case 'info':
          return sonnerToast.info
        default:
          return sonnerToast
      }
    })()

    const message = title || description || 'Notification'
    const toastOptions: any = {
      description: title ? description : undefined,
      duration: timeout,
    }

    if (id) {
      toastOptions.id = id
    }

    return toastFn(message, toastOptions)
  }

  const remove = (id: string | number) => {
    sonnerToast.dismiss(id)
  }

  const clear = () => {
    sonnerToast.dismiss()
  }

  return {
    add,
    remove,
    clear,
  }
}
