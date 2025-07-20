// Script de Registro do Service Worker - Calcule Sua Saúde v2.0.0
// Este arquivo deve ser incluído no HTML principal da aplicação

(function() {
    'use strict';

    // Verificar suporte a Service Workers
    if ('serviceWorker' in navigator) {
        console.log('[App] Service Worker suportado');
        
        // Registrar Service Worker quando a página carregar
        window.addEventListener('load', function() {
            registerServiceWorker();
        });
    } else {
        console.warn('[App] Service Worker não suportado neste navegador');
        showUnsupportedMessage();
    }

    async function registerServiceWorker() {
        try {
            // Registrar o Service Worker
            const registration = await navigator.serviceWorker.register('/service-worker-updated.js', {
                scope: '/'
            });

            console.log('[App] Service Worker registrado com sucesso:', registration);

            // Configurar eventos do Service Worker
            setupServiceWorkerEvents(registration);

            // Verificar atualizações
            checkForUpdates(registration);

            // Configurar Background Sync se suportado
            if ('sync' in registration) {
                console.log('[App] Background Sync suportado');
                setupBackgroundSync(registration);
            }

            // Configurar Periodic Sync se suportado
            if ('periodicSync' in registration) {
                console.log('[App] Periodic Sync suportado');
                setupPeriodicSync(registration);
            }

            // Configurar Push Notifications se suportado
            if ('pushManager' in registration) {
                console.log('[App] Push Notifications suportado');
                setupPushNotifications(registration);
            }

        } catch (error) {
            console.error('[App] Erro ao registrar Service Worker:', error);
            showRegistrationError(error);
        }
    }

    function setupServiceWorkerEvents(registration) {
        // Escutar mudanças no Service Worker
        registration.addEventListener('updatefound', () => {
            console.log('[App] Nova versão do Service Worker encontrada');
            
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[App] Nova versão instalada, aguardando ativação');
                    showUpdateAvailable();
                }
            });
        });

        // Escutar mensagens do Service Worker
        navigator.serviceWorker.addEventListener('message', event => {
            console.log('[App] Mensagem do Service Worker:', event.data);
            
            switch (event.data.type) {
                case 'SYNC_COMPLETE':
                    showSyncComplete();
                    break;
                case 'CACHE_UPDATED':
                    showCacheUpdated();
                    break;
                case 'OFFLINE_READY':
                    showOfflineReady();
                    break;
                default:
                    console.log('[App] Mensagem desconhecida:', event.data);
            }
        });

        // Escutar mudanças no estado do Service Worker
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[App] Service Worker controller mudou');
            window.location.reload();
        });
    }

    function checkForUpdates(registration) {
        // Verificar atualizações periodicamente
        setInterval(() => {
            registration.update();
        }, 60000); // Verificar a cada minuto

        // Verificar quando a aba ganha foco
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                registration.update();
            }
        });
    }

    async function setupBackgroundSync(registration) {
        try {
            // Registrar tags de sincronização
            await registration.sync.register('background-sync-calcule-saude');
            console.log('[App] Background sync registrado');
            
            // Configurar sincronização automática para operações falhadas
            window.addEventListener('online', () => {
                registration.sync.register('background-sync-calcule-saude');
            });
            
        } catch (error) {
            console.error('[App] Erro ao configurar Background Sync:', error);
        }
    }

    async function setupPeriodicSync(registration) {
        try {
            // Solicitar permissão para sincronização periódica
            const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
            
            if (status.state === 'granted') {
                await registration.periodicSync.register('periodic-sync-calcule-saude', {
                    minInterval: 24 * 60 * 60 * 1000 // 24 horas
                });
                console.log('[App] Periodic sync registrado');
            } else {
                console.log('[App] Permissão para periodic sync negada');
            }
            
        } catch (error) {
            console.error('[App] Erro ao configurar Periodic Sync:', error);
        }
    }

    async function setupPushNotifications(registration) {
        try {
            // Verificar se as notificações estão habilitadas
            if (Notification.permission === 'granted') {
                await subscribeToPush(registration);
            } else if (Notification.permission === 'default') {
                // Solicitar permissão quando necessário
                showNotificationPermissionPrompt(registration);
            }
            
        } catch (error) {
            console.error('[App] Erro ao configurar Push Notifications:', error);
        }
    }

    async function subscribeToPush(registration) {
        try {
            // Chave pública VAPID (deve ser substituída pela sua chave real)
            const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnRG-ATXBdRiMhfBvDeTdGP8LBSPItHI-GVGB5VehQKRiZOPs';
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            console.log('[App] Inscrito em push notifications:', subscription);
            
            // Enviar subscription para o servidor
            await sendSubscriptionToServer(subscription);
            
        } catch (error) {
            console.error('[App] Erro ao se inscrever em push notifications:', error);
        }
    }

    async function sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
            
            if (response.ok) {
                console.log('[App] Subscription enviada para o servidor');
            }
        } catch (error) {
            console.error('[App] Erro ao enviar subscription:', error);
        }
    }

    // Funções de UI para feedback ao usuário
    function showUpdateAvailable() {
        // Mostrar notificação de atualização disponível
        if (window.showUpdateNotification) {
            window.showUpdateNotification();
        } else {
            console.log('[App] Atualização disponível - recarregue a página');
        }
    }

    function showSyncComplete() {
        // Mostrar feedback de sincronização completa
        if (window.showSyncNotification) {
            window.showSyncNotification('Dados sincronizados com sucesso!');
        }
    }

    function showCacheUpdated() {
        // Mostrar feedback de cache atualizado
        console.log('[App] Cache atualizado');
    }

    function showOfflineReady() {
        // Mostrar feedback de modo offline pronto
        if (window.showOfflineNotification) {
            window.showOfflineNotification('App pronto para uso offline!');
        }
    }

    function showUnsupportedMessage() {
        // Mostrar mensagem para navegadores não suportados
        console.warn('[App] Algumas funcionalidades podem não estar disponíveis');
    }

    function showRegistrationError(error) {
        // Mostrar erro de registro
        console.error('[App] Erro no Service Worker:', error);
    }

    function showNotificationPermissionPrompt(registration) {
        // Mostrar prompt para permissão de notificações
        if (window.showNotificationPrompt) {
            window.showNotificationPrompt(async () => {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    await subscribeToPush(registration);
                }
            });
        }
    }

    // Função utilitária para converter chave VAPID
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Expor funções globais para uso na aplicação
    window.swRegistration = {
        // Forçar atualização do Service Worker
        forceUpdate: async function() {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
                window.location.reload();
            }
        },

        // Verificar status offline
        isOffline: function() {
            return !navigator.onLine;
        },

        // Registrar sincronização manual
        syncNow: async function() {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && 'sync' in registration) {
                await registration.sync.register('background-sync-calcule-saude');
            }
        },

        // Solicitar permissão para notificações
        requestNotificationPermission: async function() {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                        await subscribeToPush(registration);
                    }
                }
                return permission;
            }
            return 'unsupported';
        }
    };

    console.log('[App] Script de registro do Service Worker carregado');
})();

