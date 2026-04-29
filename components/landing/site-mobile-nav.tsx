"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";

import { publicNavItems } from "./nav-config";

export function SiteMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open menu"
            className="md:hidden"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Logo width={120} height={36} />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-surface hover:text-mahalo-blue-600"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 border-t pt-3">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              render={<Link href="/#hero" onClick={() => setOpen(false)} />}
            >
              Check Availability
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
