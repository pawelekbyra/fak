import { db } from '@/lib/db';

export type NotificationType = 'system' | 'comment' | 'like' | 'welcome' | 'profile_update';

interface SendNotificationOptions {
    fromUserId?: string | null;
    link?: string | null;
    text?: string;
}

export class NotificationService {
    /**
     * Sends a notification to a specific user.
     * Centralizes logic for text formatting based on notification type.
     */
    static async send(toUserId: string, type: NotificationType, options: SendNotificationOptions = {}) {
        const { fromUserId, link } = options;
        let text = options.text;

        // Default text generation if not provided
        if (!text) {
            switch (type) {
                case 'welcome':
                    text = 'Witaj w Zordon! Uzupełnij swój profil.';
                    break;
                case 'profile_update':
                    text = 'Twoje dane profilowe zostały zaktualizowane.';
                    break;
                case 'comment':
                    // Ideally, we'd fetch the username here if not passed in text,
                    // but for efficiency, the caller should construct the specific "User X replied..." message
                    // or we can fetch it if fromUserId is present.
                    // For now, providing a generic fallback.
                    text = 'Ktoś odpowiedział na Twój komentarz.';
                    break;
                case 'like':
                     text = 'Ktoś polubił Twój materiał.';
                     break;
                case 'system':
                    text = 'Nowa wiadomość systemowa.';
                    break;
            }
        }

        try {
            // Map internal business types to DB types compatible with NotificationPopup
            let dbType: 'system' | 'comment' | 'like' | 'follow' = 'system';
            if (type === 'comment') dbType = 'comment';
            if (type === 'like') dbType = 'like';
            // 'welcome' and 'profile_update' map to 'system'

            await db.createNotification({
                userId: toUserId,
                type: dbType,
                text: text!,
                link: link || null,
                fromUser: fromUserId ? { id: fromUserId } as any : null,
            });
        } catch (error) {
            console.error(`Failed to send ${type} notification to ${toUserId}:`, error);
            // We usually don't want to throw here to prevent blocking the main action (like commenting)
        }
    }

    /**
     * Helper specifically for welcome message to ensure consistency across the app.
     */
    static async sendWelcome(toUserId: string) {
        return this.send(toUserId, 'welcome', {
            text: 'Witaj w Polutku! Uzupełnij swój profil.', // Overriding with the exact requested text "Witaj w [Nazwa Aplikacji]..."
            link: '/profile' // Assuming link to profile
        });
    }

    /**
     * Helper for comment replies
     */
    static async sendCommentReply(toUserId: string, fromUserId: string, fromUsername: string, slideId: string) {
         if (toUserId === fromUserId) return; // No self-notifications

         return this.send(toUserId, 'comment', {
             fromUserId,
             text: `${fromUsername} odpowiedział na Twój komentarz`,
             link: `/?slideId=${slideId}&openComments=true` // Example deep link
         });
    }

    /**
     * Helper for profile updates
     */
    static async sendProfileUpdate(toUserId: string) {
        return this.send(toUserId, 'profile_update', {
            link: '/profile'
        });
    }
}
