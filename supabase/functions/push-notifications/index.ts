import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Base64url utilities ──
function uint8ToBase64url(arr: Uint8Array): string {
  let bin = "";
  arr.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlToUint8(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ── VAPID JWT ──
async function createVapidJwt(
  endpoint: string,
  subject: string,
  privateKeyJwk: JsonWebKey
): Promise<string> {
  const origin = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", typ: "JWT" };
  const payload = { aud: origin, exp: now + 12 * 3600, sub: subject };

  const hB64 = uint8ToBase64url(new TextEncoder().encode(JSON.stringify(header)));
  const pB64 = uint8ToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = new TextEncoder().encode(`${hB64}.${pB64}`);

  const key = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const sigDer = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, signingInput)
  );

  // WebCrypto returns IEEE P1363 format (r || s, 64 bytes) – already correct for ES256 JWT
  const sigB64 = uint8ToBase64url(sigDer);
  return `${hB64}.${pB64}.${sigB64}`;
}

// ── Web Push payload encryption (RFC 8291 / aes128gcm) ──
async function encryptPayload(
  payloadText: string,
  p256dhB64: string,
  authB64: string
): Promise<{ body: Uint8Array; localPubKeyB64: string; salt: Uint8Array }> {
  // 1. Generate ephemeral ECDH key pair
  const localKP = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const localPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKP.publicKey));

  // 2. Import subscriber's p256dh public key
  const subPubRaw = base64urlToUint8(p256dhB64);
  const subPubKey = await crypto.subtle.importKey(
    "raw",
    subPubRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // 3. ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: subPubKey }, localKP.privateKey, 256)
  );

  // 4. Auth secret
  const authSecret = base64urlToUint8(authB64);

  // 5. Derive IKM via HKDF: salt=auth, ikm=shared, info="WebPush: info\0"+sub_pub+local_pub
  const ikmKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, [
    "deriveBits",
  ]);
  const infoStr = "WebPush: info\0";
  const infoBytes = new Uint8Array([
    ...new TextEncoder().encode(infoStr),
    ...subPubRaw,
    ...localPubRaw,
  ]);
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: authSecret, info: infoBytes },
      ikmKey,
      256
    )
  );

  // 6. Generate random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 7. Derive CEK and Nonce from IKM
  const prkKey = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, [
    "deriveBits",
  ]);
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const cekBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: cekInfo },
      prkKey,
      128
    )
  );
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonceBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      prkKey,
      96
    )
  );

  // 8. Encrypt: plaintext + 0x02 delimiter (single record, no padding)
  const plaintext = new TextEncoder().encode(payloadText);
  const padded = new Uint8Array(plaintext.length + 1);
  padded.set(plaintext);
  padded[plaintext.length] = 2; // record delimiter

  const cek = await crypto.subtle.importKey("raw", cekBits, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonceBits }, cek, padded)
  );

  // 9. Build aes128gcm body: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs, false);
  header[20] = 65;
  header.set(localPubRaw, 21);

  const body = new Uint8Array(header.length + encrypted.length);
  body.set(header);
  body.set(encrypted, header.length);

  return { body, localPubKeyB64: uint8ToBase64url(localPubRaw), salt };
}

// ── Send a single push notification ──
async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKeyB64: string,
  vapidPrivateKeyJwk: JsonWebKey,
  vapidSubject: string
): Promise<{ ok: boolean; status: number }> {
  const jwt = await createVapidJwt(subscription.endpoint, vapidSubject, vapidPrivateKeyJwk);
  const { body } = await encryptPayload(payload, subscription.p256dh, subscription.auth);

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt},k=${vapidPublicKeyB64}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body,
  });

  return { ok: res.ok, status: res.status };
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authErr,
    } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();
    const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

    switch (action) {
      // ── Setup: generate VAPID keys (auto or admin) ──
      case "setup": {
        const keyPair = await crypto.subtle.generateKey(
          { name: "ECDSA", namedCurve: "P-256" },
          true,
          ["sign"]
        );
        const pubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey));
        const privJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

        const publicKeyB64 = uint8ToBase64url(pubRaw);
        const privateKeyJson = JSON.stringify(privJwk);

        // Upsert push_config
        await supabaseAdmin.from("push_config").upsert({
          id: "default",
          vapid_public_key: publicKeyB64,
          vapid_private_key: privateKeyJson,
        });

        return new Response(JSON.stringify({ publicKey: publicKeyB64 }), { headers: jsonHeaders });
      }

      // ── Get public key (auto-setup if missing) ──
      case "get-public-key": {
        let { data: config } = await supabaseAdmin
          .from("push_config")
          .select("vapid_public_key")
          .eq("id", "default")
          .maybeSingle();

        if (!config) {
          // Auto-generate keys
          const keyPair = await crypto.subtle.generateKey(
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["sign"]
          );
          const pubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey));
          const privJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
          const publicKeyB64 = uint8ToBase64url(pubRaw);

          await supabaseAdmin.from("push_config").upsert({
            id: "default",
            vapid_public_key: publicKeyB64,
            vapid_private_key: JSON.stringify(privJwk),
          });

          return new Response(JSON.stringify({ publicKey: publicKeyB64 }), {
            headers: jsonHeaders,
          });
        }

        return new Response(JSON.stringify({ publicKey: config.vapid_public_key }), {
          headers: jsonHeaders,
        });
      }

      // ── Register push subscription ──
      case "register": {
        const { subscription } = params;
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
          return new Response(JSON.stringify({ error: "Invalid subscription" }), {
            status: 400,
            headers: jsonHeaders,
          });
        }

        // Get user's tenant_id
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
          {
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            tenant_id: roleData?.tenant_id,
          },
          { onConflict: "user_id,endpoint" }
        );

        return new Response(JSON.stringify({ ok: !error }), { headers: jsonHeaders });
      }

      // ── Send push notification to a user ──
      case "send": {
        const { target_user_id, title, body: msgBody, url } = params;
        if (!target_user_id) {
          return new Response(JSON.stringify({ error: "Missing target_user_id" }), {
            status: 400,
            headers: jsonHeaders,
          });
        }

        // Get VAPID config
        const { data: config } = await supabaseAdmin
          .from("push_config")
          .select("*")
          .eq("id", "default")
          .maybeSingle();

        if (!config) {
          return new Response(JSON.stringify({ sent: 0, error: "Push not configured" }), {
            headers: jsonHeaders,
          });
        }

        const vapidPrivateKeyJwk: JsonWebKey = JSON.parse(config.vapid_private_key);
        const vapidSubject = "mailto:noreply@petgrooming.app";

        // Get target subscriptions
        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", target_user_id);

        if (!subs || subs.length === 0) {
          return new Response(JSON.stringify({ sent: 0 }), { headers: jsonHeaders });
        }

        const payload = JSON.stringify({
          title: title || "PetGrooming",
          body: msgBody || "",
          url: url || "/dashboard",
        });

        let sent = 0;
        for (const sub of subs) {
          try {
            const result = await sendPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              payload,
              config.vapid_public_key,
              vapidPrivateKeyJwk,
              vapidSubject
            );
            if (result.ok) sent++;
            // Remove expired subscriptions
            if (result.status === 410 || result.status === 404) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
            }
          } catch (e) {
            console.error("Push send error:", e);
          }
        }

        return new Response(JSON.stringify({ sent }), { headers: jsonHeaders });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: jsonHeaders,
        });
    }
  } catch (err) {
    console.error("Push notifications error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
