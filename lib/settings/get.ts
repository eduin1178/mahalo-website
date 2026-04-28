import { cache } from "react";

import { getAllSettings, getSetting } from "@/lib/settings/queries";

export const getSettingCached = cache(async (key: string) => getSetting(key));

export const getAllSettingsCached = cache(async () => getAllSettings());
