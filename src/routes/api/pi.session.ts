import { createFileRoute } from "@tanstack/react-router";
import { PI_API_BASE } from "@/lib/pi-config";

// Pi-ecosystem sign-in.
// Verifies a Pi Network access token against the Pi Platform API and, on
// success, mints a one-time token hash the browser exchanges for an app
// session. Pi is the ONLY identity provider for this app.
export const Route = createFileRoute("/api/pi/session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let accessToken: string | undefined;
        try {
          const body = (await request.json()) as { accessToken?: string };
          accessToken = body.accessToken;
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }
        if (!accessToken || typeof accessToken !== "string") {
          return new Response("Missing accessToken", { status: 400 });
        }

        const piRes = await fetch(`${PI_API_BASE}/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!piRes.ok) {
          console.error("[Pi] token validation failed", piRes.status);
          return Response.json({ error: "Pi token validation failed" }, { status: 401 });
        }
        const me = (await piRes.json()) as { uid: string; username: string };
        if (!me?.uid || !me?.username) {
          return Response.json({ error: "Pi token validation failed" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = `${me.uid}@pi.pitrade.app`;

        const created = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            display_name: me.username,
            pi_username: me.username,
            pi_uid: me.uid,
          },
        });
        if (created.error && !/already|exists|registered/i.test(created.error.message)) {
          console.error("[Pi] user provisioning failed", created.error.message);
          return Response.json({ error: "Could not open a trade desk" }, { status: 500 });
        }

        const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
        const tokenHash = link.data?.properties?.hashed_token;
        if (link.error || !tokenHash) {
          console.error("[Pi] session mint failed", link.error?.message);
          return Response.json({ error: "Could not start a session" }, { status: 500 });
        }

        return Response.json({ uid: me.uid, username: me.username, tokenHash });
      },
    },
  },
});
