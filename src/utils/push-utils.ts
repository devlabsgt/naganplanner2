import webpush from "web-push";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Helper local para instanciar el cliente con privilegios
function getAdminClient() {
  return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function sendPushToUsers(userIds: string[], payload: { title: string; body: string; url?: string }) {
    const supabaseAdmin = getAdminClient();

    const pubKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/^["']|["']$/g, '');
    const privKey = (process.env.VAPID_PRIVATE_KEY || "").replace(/^["']|["']$/g, '');

    webpush.setVapidDetails(
        "mailto:soporte@cermad.com",
        pubKey,
        privKey
    );

    const { data: subscriptions, error } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

    if (error) {
        console.error("Error fetching subscriptions for push:", error);
        return;
    }

    if (!subscriptions || subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
        icon: "/icon-192x192.png"
    });

    const sendPromises = subscriptions.map(async (sub) => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
            },
        };

        try {
            await webpush.sendNotification(pushSubscription, pushPayload);
        } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                console.warn(`Deleting invalid subscription: ${sub.id}`);
                await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
            } else {
                console.error("Error sending push to endpoint", sub.id, err);
            }
        }
    });

    await Promise.all(sendPromises);
}

export async function sendPushToRoles(roles: string[], payload: { title: string; body: string; url?: string }) {
    const supabaseAdmin = getAdminClient();

    const { data: profiles, error } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .in("rol", roles);

    if (error || !profiles) {
        console.error("Error fetching profiles by role:", error);
        return;
    }

    const userIds = profiles.map((p) => p.id);
    if (userIds.length > 0) {
        await sendPushToUsers(userIds, payload);
    }
}
