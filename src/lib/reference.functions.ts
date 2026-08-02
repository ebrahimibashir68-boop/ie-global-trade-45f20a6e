// Public reference-data lookups (HS classification, duty rates, control lists).
// These read public tables through the publishable key and are safe to call
// from public routes and loaders.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { estimateLandedCost } from "./trade/compliance";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const searchHsCodes = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ q: z.string().max(120) }).parse(input))
  .handler(async ({ data }) => {
    const term = data.q.trim();
    const sb = publicClient();
    let query = sb.from("hs_codes").select("code, chapter, description, unit, keywords").limit(25);
    if (term) query = query.or(`description.ilike.%${term}%,code.ilike.${term}%`);
    const { data: rows, error } = await query.order("code");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const lookupDuty = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({
      hsCode: z.string().max(20),
      destination: z.string().length(2),
      value: z.number().nonnegative(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rates, error } = await sb
      .from("duty_rates")
      .select("destination_country, hs_prefix, duty_pct, vat_pct, note")
      .eq("destination_country", data.destination);
    if (error) throw new Error(error.message);
    return estimateLandedCost(data.value, data.hsCode, data.destination, rates ?? []);
  });

export const listControlLists = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [controlled, denied] = await Promise.all([
    sb.from("controlled_goods").select("id, hs_prefix, regime, description, severity").order("hs_prefix"),
    sb.from("denied_parties").select("id, name, country_code, list_source, reason").order("name"),
  ]);
  return {
    controlled: controlled.data ?? [],
    denied: denied.data ?? [],
  };
});
