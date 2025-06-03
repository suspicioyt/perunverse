class NotificationSystem {
    constructor(config = {}) {
        this.container = document.getElementById('notification-container');
        this.maxNotifications = config.maxNotifications || 6;
        this.defaultDuration = config.defaultDuration || 5000;
        this.queue = [];
        this.activeNotifications = new Map();
        this.soundEnabled = config.soundEnabled || false; // Domyślnie dźwięki wyłączone
        this.icons = {
            error: '<i class="fas fa-times-circle"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            reload: '<i class="fas fa-sync-alt"></i>',
            update: '<i class="fas fa-arrow-circle-up"></i>',
            quick: '<i class="fas fa-bolt"></i>',
            debug: '<i class="fas fa-bug"></i>',
            alert: '<i class="fas fa-bell"></i>'
        };
        this.touchStartX = 0;
        this.touchMoveX = 0;
    }

    notify(options) {
        const settings = {
            text: '',
            type: 'info',
            duration: this.defaultDuration,
            title: '',
            persistent: false,
            actions: [],
            sound: false, // Domyślnie dźwięk wyłączony
            priority: 0,
            id: Date.now() + Math.random(),
            onClose: null,
            ...options
        };

        if (this.activeNotifications.size >= this.maxNotifications) {
            this.queue.push(settings);
            this.queue.sort((a, b) => b.priority - a.priority);
            return settings.id;
        }

        return this.createNotification(settings);
    }

    quickNotify(title, type = 'quick', duration = 3000) {
        return this.notify({
            title,
            text: '',
            type,
            duration,
            sound: false
        });
    }

    createNotification(settings) {
        const notification = document.createElement('div');
        notification.classList.add('notification', settings.type);
        notification.dataset.id = settings.id;
        notification.dataset.priority = settings.priority;
        this.activeNotifications.set(settings.id, notification);

        // Header
        const header = document.createElement('div');
        header.classList.add('notification-header');
        header.style.animation = 'fadeIn 0.25s ease-out';

        const titleSpan = document.createElement('span');
        titleSpan.classList.add('notification-title');
        const icon = document.createElement('span');
        icon.classList.add('notification-icon');
        icon.innerHTML = this.icons[settings.type];
        titleSpan.appendChild(icon);
        titleSpan.appendChild(document.createTextNode(settings.title || settings.type.charAt(0).toUpperCase() + settings.type.slice(1)));

        const closeBtn = document.createElement('button');
        closeBtn.classList.add('notification-close');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.onclick = () => this.removeNotification(settings.id);

        header.appendChild(titleSpan);
        if (!settings.persistent) header.appendChild(closeBtn);

        // Content
        let content = null;
        if (settings.text) {
            content = document.createElement('div');
            content.classList.add('notification-content');
            content.textContent = settings.text;
            content.style.animation = 'fadeIn 0.25s ease-out 0.1s both';
        }

        // Progress
        let progress = null;
        if (!settings.persistent) {
            progress = document.createElement('div');
            progress.classList.add('notification-progress');
            progress.style.animationDuration = `${settings.duration}ms`;
            notification.appendChild(progress);
        }

        // Actions
        if (settings.actions.length > 0) {
            const actionContainer = document.createElement('div');
            actionContainer.classList.add('notification-actions');
            settings.actions.forEach((action, index) => {
                const btn = document.createElement('button');
                btn.classList.add('notification-action');
                btn.textContent = action.label;
                btn.style.animation = `fadeIn 0.25s ease-out ${0.2 + index * 0.1}s both`;
                btn.onclick = () => {
                    action.callback(settings.id);
                    if (action.close !== false) this.removeNotification(settings.id);
                };
                actionContainer.appendChild(btn);
            });
            notification.appendChild(actionContainer);
        }

        notification.appendChild(header);
        if (content) notification.appendChild(content);
        notification.style.animation = 'slideIn 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)';

        // Insert based on priority
        const notifications = Array.from(this.container.children);
        const insertBefore = notifications.find(n => 
            parseInt(n.dataset.priority) < settings.priority);
        this.container.insertBefore(notification, insertBefore || null);

        // Sound (tylko jeśli włączony)
        if (settings.sound) this.playSound(settings.type);

        // Auto-remove and interactions
        if (!settings.persistent) {
            notification.timeout = setTimeout(() => 
                this.removeNotification(settings.id), settings.duration);

            notification.onmouseenter = () => {
                clearTimeout(notification.timeout);
                if (progress) progress.style.animationPlayState = 'paused';
            };

            notification.onmouseleave = () => {
                if (progress) progress.style.animationPlayState = 'running';
                notification.timeout = setTimeout(() => 
                    this.removeNotification(settings.id), settings.duration);
            };
        }

        // Touch support
        notification.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        });

        notification.addEventListener('touchmove', (e) => {
            this.touchMoveX = e.touches[0].clientX;
            const diff = this.touchMoveX - this.touchStartX;
            if (diff > 0) {
                notification.style.transform = `translateX(${diff}px)`;
            }
        });

        notification.addEventListener('touchend', () => {
            const diff = this.touchMoveX - this.touchStartX;
            if (diff > 120) {
                this.removeNotification(settings.id);
            } else {
                notification.style.transition = 'transform 0.25s ease-out';
                notification.style.transform = 'translateX(0)';
                setTimeout(() => notification.style.transition = '', 250);
            }
        });

        return settings.id;
    }

    removeNotification(id) {
        const notification = this.activeNotifications.get(id);
        if (!notification) return;

        notification.style.animation = 'slideOut 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)';
        clearTimeout(notification.timeout);
        
        notification.addEventListener('animationend', () => {
            notification.remove();
            this.activeNotifications.delete(id);
            const settings = this.queue.find(q => q.id === id);
            if (settings?.onClose) settings.onClose(id);
            if (this.queue.length > 0) {
                this.createNotification(this.queue.shift());
            }
        }, { once: true });
    }

    clearAll() {
        this.activeNotifications.forEach((_, id) => this.removeNotification(id));
        this.queue = [];
    }

    playSound(type) {
        const sounds = {
            error: 'https://www.soundjay.com/buttons/beep-01a.mp3',
            success: 'https://www.soundjay.com/buttons/beep-07.mp3',
            warning: 'https://www.soundjay.com/buttons/beep-02.mp3',
            info: 'https://www.soundjay.com/buttons/beep-06.mp3',
            reload: 'https://www.soundjay.com/buttons/beep-08b.mp3',
            update: 'https://www.soundjay.com/buttons/beep-09.mp3',
            quick: 'https://www.soundjay.com/buttons/beep-10.mp3',
            debug: 'https://www.soundjay.com/buttons/beep-03.mp3',
            alert: 'https://www.soundjay.com/buttons/beep-04.mp3'
        };
        const audio = new Audio(sounds[type]);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    }
}

// Inicjalizacja
const notifier = new NotificationSystem({
    maxNotifications: 6,
    defaultDuration: 5000,
    soundEnabled: false // Domyślnie dźwięki wyłączone
});
const notificationSwitch = settingSwitches.find(s => s.switchId === "07");
// Funkcja wrapper dla pełnych powiadomień
function notification(text, type = 'info', options = {}) {
    if(notificationSwitch && notificationSwitch.value) {
        return notifier.notify({ text, type, ...options });
    }
}

// Funkcja wrapper dla szybkich powiadomień
function quickNotification(title, type = 'quick', duration = 3000) {
    if(notificationSwitch && notificationSwitch.value) {
        return notifier.quickNotify(title, type, duration);
    }
}

// notification("Błąd krytyczny", "error", { 
    // priority: 2,
    // sound: true, // Dźwięk włączony
    // actions: [{ 
        // label: "Retry", 
        // callback: () => console.log("Retrying...") 
    // }],
    // onClose: (id) => console.log(`Notification ${id} closed`)
// });
// 
// notification("Sukces!", "success", {
    // duration: 3000,
    // title: "Operacja zakończona",
    // sound: true // Dźwięk włączony
// });
// 
// notification("Uwaga", "warning", {
    // persistent: true,
    // actions: [
        // { label: "OK", callback: (id) => console.log("OK clicked", id) },
        // { label: "Cancel", callback: () => console.log("Cancelled"), close: false }
    // ]
// });
// 

// notification("Odśwież stronę", "reload", {
    // actions: [{ label: "Reload", callback: () => location.reload() }]
// });
// 
// notification("Dostępna aktualizacja", "update", {
    // duration: 4000,
    // title: "Nowa wersja",
    // sound: true // Dźwięk włączony
// });
// 
// notification("Debug info", "debug", {
    // text: "Some technical details here",
    // priority: 1
// });
// 
// notification("Pilne!", "alert", {
    // sound: true, // Dźwięk włączony
    // persistent: true,
    // actions: [{ label: "Dismiss", callback: (id) => notifier.removeNotification(id) }]
// });
// 
// quickNotification("Szybka informacja");
// quickNotification("Błąd!", "error", 2000);
// quickNotification("Odświeżono", "reload", 2500);