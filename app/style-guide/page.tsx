import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/brand/Logo"
import {
  StatusBadge,
  type OrderStatus,
} from "@/components/brand/StatusBadge"

export const metadata = { title: "Style Guide — Mahalo Enterprise" }

const PALETTE = [
  { name: "navy-900", hex: "#0B1F4D", className: "bg-mahalo-navy-900" },
  { name: "navy-700", hex: "#142E6E", className: "bg-mahalo-navy-700" },
  { name: "blue-600", hex: "#2A5BC7", className: "bg-mahalo-blue-600" },
  { name: "cyan-500", hex: "#3FD0E0", className: "bg-mahalo-cyan-500" },
  { name: "cyan-300", hex: "#7FE3EE", className: "bg-mahalo-cyan-300" },
  { name: "surface", hex: "#F6F8FB", className: "bg-surface border" },
  { name: "border", hex: "#E2E8F0", className: "bg-border" },
  { name: "muted-fg", hex: "#5B6B85", className: "bg-muted-foreground" },
]

const STATUSES: OrderStatus[] = [
  "Pending",
  "Created",
  "Scheduled",
  "Installed",
  "Completed",
  "Cancelled",
]

export default function StyleGuidePage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 space-y-16">
      <header className="space-y-4">
        <p className="eyebrow">Internal</p>
        <h1 className="text-4xl font-bold tracking-tight text-mahalo-navy-900">
          Mahalo Enterprise — Style Guide
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Visual reference for tokens, typography, components, and order-status
          colors. Visible only in development.
        </p>
        <div className="pt-2">
          <Logo />
        </div>
      </header>

      <Section title="Brand gradient">
        <div className="bg-mahalo-gradient text-white rounded-xl p-10 shadow-lg">
          <p className="eyebrow text-mahalo-cyan-300">Hero / Primary CTA</p>
          <h2 className="text-3xl font-bold mt-2">
            Connecting families to better internet.
          </h2>
        </div>
      </Section>

      <Section title="Palette">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PALETTE.map((c) => (
            <div
              key={c.name}
              className="rounded-xl overflow-hidden border bg-card"
            >
              <div className={`${c.className} h-20`} />
              <div className="p-3 text-sm">
                <p className="font-semibold text-mahalo-navy-900">{c.name}</p>
                <p className="text-muted-foreground font-mono">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <p className="eyebrow">Eyebrow / Label</p>
          <h1 className="text-5xl font-bold tracking-tight text-mahalo-navy-900">
            H1 — 48px / 700
          </h1>
          <h2 className="text-3xl font-bold text-mahalo-navy-900">
            H2 — 32px / 700
          </h2>
          <h3 className="text-2xl font-semibold text-mahalo-navy-900">
            H3 — 24px / 600
          </h3>
          <p className="text-base leading-relaxed">
            Body — 16px / 400. The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-sm text-muted-foreground">
            Muted body — used for secondary text, helper copy.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg">
            Primary (gradient)
          </Button>
          <Button variant="solid" size="lg">
            Solid (navy)
          </Button>
          <Button variant="secondary" size="lg">
            Secondary
          </Button>
          <Button variant="ghost" size="lg">
            Ghost
          </Button>
          <Button variant="destructive" size="lg">
            Destructive
          </Button>
          <Button variant="outline" size="lg">
            Outline
          </Button>
        </div>
      </Section>

      <Section title="Order status badges">
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="Form sample">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">ZIP code</Label>
              <Input id="zip" inputMode="numeric" placeholder="12345" />
            </div>
            <Button variant="primary" className="w-full">
              Check Availability
            </Button>
          </CardContent>
        </Card>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-mahalo-navy-900 border-b pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}
