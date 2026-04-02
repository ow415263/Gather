import { useCallback, useEffect, useRef, useState } from 'react'

type StateUpdater<T> = T | ((prev: T) => T)

const isBrowser = typeof window !== 'undefined'

const readValue = <T,>(key: string, defaultValue: T): T => {
  if (!isBrowser) {
    return defaultValue
  }

  try {
    const stored = window.localStorage.getItem(key)
    if (stored === null) {
      window.localStorage.setItem(key, JSON.stringify(defaultValue))
      return defaultValue
    }
    return JSON.parse(stored) as T
  } catch (error) {
    console.warn('[storage] Failed to read key, using default', { key, error })
    return defaultValue
  }
}

const writeValue = <T,>(key: string, value: T) => {
  if (!isBrowser) {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('[storage] Failed to persist key', { key, error })
  }
}

export function useLocalKV<T>(key: string, defaultValue: T) {
  const defaultRef = useRef(defaultValue)
  const [value, setValue] = useState<T>(() => readValue(key, defaultValue))

  useEffect(() => {
    defaultRef.current = defaultValue
  }, [defaultValue])

  useEffect(() => {
    writeValue(key, value)
  }, [key, value])

  useEffect(() => {
    if (!isBrowser) {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== key) {
        return
      }

      try {
        if (event.newValue === null) {
          setValue(defaultRef.current)
        } else {
          setValue(JSON.parse(event.newValue))
        }
      } catch (error) {
        console.warn('[storage] Failed to sync key, resetting to default', { key, error })
        setValue(defaultRef.current)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key])

  const setStoredValue = useCallback((updater: StateUpdater<T>) => {
    setValue(previous => {
      const nextValue = typeof updater === 'function'
        ? (updater as (prev: T) => T)(previous)
        : updater

      writeValue(key, nextValue)
      return nextValue
    })
  }, [key])

  return [value, setStoredValue] as const
}
