import { createFileRoute } from "@tanstack/react-router";

// Server route: verifies a Pi Network access token by calling the Pi
// Platform API. No Pi API key is required for /v2/me.
export const Route = createFileRoute("/api/pi/verify")({
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

        const piRes = await fetch("https://api.minepi.com/v2/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!piRes.ok) {
          const text = await piRes.text().catch(() => "");
          console.error("[Pi] token validation failed", piRes.status, text);
          return new Response(
            JSON.stringify({ error: "Pi token validation failed" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        const me = (await piRes.json()) as { uid: string; username: string };
        return Response.json({ uid: me.uid, username: me.username });
      },
    },
  },
});
