import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { useEventListener } from "./useEventListener";

type setValue<T> = Dispatch<SetStateAction<T>>;

declare global {
  interface WindowEventMap {
    "local-storage": CustomEvent;
  }
}

export default function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, setValue<T>] {
  const readValue = useCallback((): T => {
    try {
      if (typeof window === "undefined") return initialValue; // ✅ SSR guard
      const item = window.localStorage.getItem(key);
      return item != null ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localstorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // ✅ don’t read localStorage during SSR render
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue: setValue<T> = useCallback(
    (value) => {
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(newValue));
          window.dispatchEvent(new Event("local-storage"));
        }

        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  const handleStorageChange = useCallback(
    (event: StorageEvent | CustomEvent) => {
      if ((event as StorageEvent)?.key && (event as StorageEvent).key !== key) return;
      setStoredValue(readValue());
    },
    [key, readValue]
  );

  useEventListener("storage", handleStorageChange);
  useEventListener("local-storage", handleStorageChange);

  return [storedValue, setValue];
}
