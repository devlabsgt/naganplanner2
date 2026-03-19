'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { urlBase64ToUint8Array } from '@/utils/vapid'
import { Bell, BellOff, Loader2, Check } from 'lucide-react'
import { useUser } from '@/components/(base)/providers/UserProvider'
import { useTheme } from 'next-themes'

export function PushNotificationToggle() {
    const user = useUser()
    const userId = user?.id
    const [mounted, setMounted] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)
    const { theme } = useTheme()
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = theme === 'dark'

    useEffect(() => {
        const checkStatus = async () => {
            // Check for both service Worker and userId
            if ('serviceWorker' in navigator && userId) {
                try {
                    const reg = await navigator.serviceWorker.getRegistration()
                    if (reg) {
                        const sub = await reg.pushManager.getSubscription()
                        if (sub) {
                            const subJson = JSON.parse(JSON.stringify(sub))

                            const { data } = await supabase
                                .from('push_subscriptions')
                                .select('id')
                                .match({ user_id: userId, endpoint: subJson.endpoint })
                                .maybeSingle()

                            if (data) {
                                setIsSubscribed(true)
                            } else {
                                await sub.unsubscribe()
                                setIsSubscribed(false)
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error checking push status:", e)
                }
            }
        }
        checkStatus()
    }, [userId, supabase])

    const handleToggle = async () => {
        if (!userId) return
        setLoading(true)
        try {
            if (!('serviceWorker' in navigator)) {
                alert("Tu navegador no soporta notificaciones push.")
                return
            }

            // Explicitly request permission first - better for iOS/Safari compliance
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission()
                if (permission !== 'granted') {
                    alert("Debes permitir las notificaciones para poder recibirlas.")
                    return
                }
            }

            // Register the service worker
            console.log("Iniciando registro de Service Worker...")
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
            await reg.update()

            const registration = await navigator.serviceWorker.ready
            console.log("Service Worker está listo.")

            if (isSubscribed) {
                const subscription = await registration.pushManager.getSubscription()
                if (subscription) {
                    const subscriptionJson = JSON.parse(JSON.stringify(subscription))

                    await supabase.from('push_subscriptions')
                        .delete()
                        .match({ user_id: userId, endpoint: subscriptionJson.endpoint })

                    await subscription.unsubscribe()
                }
                setIsSubscribed(false)
            } else {
                const rawVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                if (!rawVapidKey) throw new Error("VAPID public key not found")

                // Remove quotes if they exist
                const vapidKey = rawVapidKey.replace(/^["']|["']$/g, '')

                console.log("Suscribiendo al usuario...")
                const sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                })

                const subscriptionJson = JSON.parse(JSON.stringify(sub))
                console.log("Suscripción generada con éxito.")

                const { error } = await supabase.from('push_subscriptions').upsert({
                    user_id: userId,
                    endpoint: subscriptionJson.endpoint,
                    p256dh: subscriptionJson.keys.p256dh,
                    auth: subscriptionJson.keys.auth
                }, { onConflict: 'endpoint' })

                if (error) throw error

                setIsSubscribed(true)
            }
        } catch (error: any) {
            console.error("Detalles del fallo en Push:", error)
            alert(`Error: ${error.message || "Fallo al activar notificaciones"}`)
        } finally {
            setLoading(false)
        }
    }

    if (!mounted || !userId) return null;

    // Dinámicamente calcular colores para Dark Mode
    const bellColor = isSubscribed
        ? (isDark ? '#facc15' : '#eab308')
        : (isDark ? '#737373' : '#9ca3af');

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className="flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:opacity-80 active:scale-95 w-8 h-8 sm:w-9 sm:h-9"
            title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
        >
            {loading ? (
                <Loader2 className="animate-spin" style={{ width: '16px', height: '16px', color: '#d6a738' }} />
            ) : isSubscribed ? (
                <div style={{ position: 'relative', display: 'flex' }}>
                    <Bell strokeWidth={2.5} style={{ width: '19px', height: '19px', color: bellColor, fill: bellColor }} />
                    <div style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        width: '11px',
                        height: '11px',
                        backgroundColor: '#22c55e',
                        border: isDark ? '1.5px solid #000000' : '1.5px solid #ffffff',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Check strokeWidth={4} style={{ width: '6px', height: '6px', color: '#ffffff' }} />
                    </div>
                </div>
            ) : (
                <BellOff strokeWidth={2.5} style={{ width: '19px', height: '19px', color: bellColor }} />
            )}
        </button>
    )
}
