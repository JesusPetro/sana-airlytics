'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface MobileNavContextValue {
  mobileOpen: boolean;
  toggle:     () => void;
  close:      () => void;
}

const MobileNavContext = createContext<MobileNavContextValue>({
  mobileOpen: false,
  toggle:     () => {},
  close:      () => {},
});

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{
      mobileOpen,
      toggle: () => setMobileOpen((v) => !v),
      close:  () => setMobileOpen(false),
    }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export const useMobileNav = () => useContext(MobileNavContext);
