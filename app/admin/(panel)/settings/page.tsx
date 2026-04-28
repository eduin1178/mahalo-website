import { CustomSettingsSection } from "@/components/admin/settings/custom-settings-section";
import { KnownSettingsForm } from "@/components/admin/settings/known-settings-form";
import { requireRole } from "@/lib/clerk/require-role";
import { getAllSettingsCached } from "@/lib/settings/get";
import { KNOWN_SETTING_KEYS } from "@/lib/settings/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireRole("admin");

  const all = await getAllSettingsCached();
  const map = new Map(all.map((row) => [row.key, row]));
  const knownSet = new Set<string>(KNOWN_SETTING_KEYS);

  const notificationEmail = map.get("notification_email")?.value ?? "";
  const webhookUrl = map.get("webhook_url")?.value ?? "";
  const customRows = all.filter((row) => !knownSet.has(row.key));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
          Configuration
        </p>
        <h1 className="text-3xl font-bold text-mahalo-navy-900">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Notification destinations used by the order pipeline.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-mahalo-navy-900">
          Notifications
        </h2>
        <KnownSettingsForm
          notificationEmail={notificationEmail}
          webhookUrl={webhookUrl}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-mahalo-navy-900">
            Custom settings
          </h2>
          <p className="text-xs text-muted-foreground">
            Free-form key-value pairs. Useful for ad-hoc flags consumed by
            server actions.
          </p>
        </div>
        <CustomSettingsSection rows={customRows} />
      </section>
    </div>
  );
}
