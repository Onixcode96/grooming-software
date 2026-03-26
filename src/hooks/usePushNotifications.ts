import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PushState {
  isSupported: boolean;
  isPwaInstalled: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  loading: boolean;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    isPwaInstalled: false,
    permission: "unsupported",
    isSubscribed: false,
    loading: true,
  });

  useEffect(() => {
    const check = async () => {
      const isSupported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      const isPwaInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;

      const permission = isSupported ? Notification.permission : "unsupported";

      let isSubscribed = false;
      if (isSupported && permission === "granted") {
        try {
          const reg = await navigator.serviceWorker.getRegistration("/sw.js");
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            isSubscribed = !!sub;
          }
        } catch {
          // ignore
        }
      }

      setState({ isSupported, isPwaInstalled, permission, isSubscribed, loading: false });
    };

    check();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // 2. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((s) => ({ ...s, permission }));
        return false;
      }

      // 3. Get VAPID public key from edge function
      const { data: keyData, error: keyError } = await supabase.functions.invoke(
        "push-notifications",
        { body: { action: "get-public-key" } }
      );

      if (keyError || !keyData?.publicKey) {
        console.error("Failed to get VAPID key:", keyError);
        return false;
      }

      // 4. Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // 5. Register subscription on server
      const subJson = subscription.toJSON();
      const { error: regError } = await supabase.functions.invoke("push-notifications", {
        body: {
          action: "register",
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
        },
      });

      if (regError) {
        console.error("Failed to register subscription:", regError);
        return false;
      }

      setState((s) => ({ ...s, permission: "granted", isSubscribed: true }));
      return true;
    } catch (err) {
      console.error("Push subscription error:", err);
      return false;
    }
  }, []);

  const shouldShowBanner = !state.loading && (
    !state.isPwaInstalled ||
    (state.isSupported && state.permission !== "granted") ||
    (state.isSupported && !state.isSubscribed)
  );

  return {
    ...state,
    subscribe,
    shouldShowBanner,
  };
};

// Send push notification (fire-and-forget utility)
export const sendPushNotification = async (
  targetUserId: string,
  title: string,
  body: string,
  url?: string
) => {
  try {
    await supabase.functions.invoke("push-notifications", {
      body: {
        action: "send",
        target_user_id: targetUserId,
        title,
        body: body.substring(0, 200),
        url: url || "/dashboard",
      },
    });
  } catch {
    // Push is best-effort, don't block the caller
  }
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}
