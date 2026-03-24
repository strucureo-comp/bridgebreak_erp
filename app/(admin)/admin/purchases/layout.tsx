import type { ReactNode } from 'react';

export default function PurchasesLayout({ children }: { children: ReactNode }) {
  return <div className="purchases-ui-standard">{children}</div>;
}
