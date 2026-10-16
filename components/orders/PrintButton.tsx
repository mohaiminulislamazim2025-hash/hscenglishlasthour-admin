"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { IconPrinter } from "@/components/ui/icons";

export function PrintButton({ auto }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const timer = window.setTimeout(() => window.print(), 350);
      return () => window.clearTimeout(timer);
    }
  }, [auto]);

  return (
    <Button type="button" variant="secondary" size="md" onClick={() => window.print()}>
      <IconPrinter width={16} height={16} />
      Print invoice
    </Button>
  );
}
