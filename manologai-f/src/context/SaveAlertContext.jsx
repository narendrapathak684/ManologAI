import { createContext, useContext, useEffect, useMemo, useState } from "react";

const SaveAlertContext = createContext(null);

export function SaveAlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!alert) return undefined;

    const timeoutId = window.setTimeout(() => {
      setAlert(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [alert]);

  const value = useMemo(
    () => ({
      alert,
      showSaveAlert(options = {}) {
        if (typeof options === "string") {
          setAlert({
            title: "Saved",
            message: options,
          });
          return;
        }

        setAlert({
          title: options.title || "Saved",
          message: options.message || "Saved successfully.",
        });
      },
      clearSaveAlert() {
        setAlert(null);
      },
    }),
    [alert]
  );

  return (
    <SaveAlertContext.Provider value={value}>
      {children}
    </SaveAlertContext.Provider>
  );
}

export function useSaveAlert() {
  const context = useContext(SaveAlertContext);

  if (!context) {
    throw new Error("useSaveAlert must be used within a SaveAlertProvider.");
  }

  return context;
}
