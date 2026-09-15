import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Heart } from 'lucide-react';
import {
    normalizeRoletaRarityText,
    type RoletaNotificationView,
} from '../../utils/roletaNotifications';
import './RoletaNotificationsStory.css';

export const ROLETA_NOTIFICATION_STORY_INTERVAL_MS = 3000;

interface RoletaNotificationsStoryProps {
    notifications: RoletaNotificationView[];
    className?: string;
    intervalMs?: number;
    ariaLabel?: string;
}

function getNotificationLevelStyle(levelName: string, levelColor: string): CSSProperties | null {
    const normalizedLevelName = normalizeRoletaRarityText(levelName);

    if (normalizedLevelName.includes('INCOMUM')) {
        return { color: '#7E7E7E', fontWeight: 500 };
    }

    if (normalizedLevelName.includes('COMUM')) {
        return { color: '#7E7E7E', fontWeight: 400 };
    }

    if (!levelColor) return null;

    return { color: levelColor };
}

function renderNotificationText(notification: RoletaNotificationView): ReactNode {
    if (
        notification.tipo !== 'RECEBER_PREMIO'
        || !notification.nivelNome
    ) {
        return notification.texto;
    }

    const levelStyle = getNotificationLevelStyle(notification.nivelNome, notification.nivelCorHex);
    if (!levelStyle) return notification.texto;

    const text = notification.texto;
    const lowerText = text.toLocaleLowerCase('pt-BR');
    const lowerLevel = notification.nivelNome.toLocaleLowerCase('pt-BR');
    const levelStart = lowerText.indexOf(lowerLevel);

    if (levelStart < 0) return text;

    const levelEnd = levelStart + notification.nivelNome.length;

    return (
        <>
            {text.slice(0, levelStart)}
            <span style={levelStyle}>
                {text.slice(levelStart, levelEnd)}
            </span>
            {text.slice(levelEnd)}
        </>
    );
}

export function RoletaNotificationsStory({
    notifications,
    className = '',
    intervalMs = ROLETA_NOTIFICATION_STORY_INTERVAL_MS,
    ariaLabel = 'Notificacoes da roleta',
}: RoletaNotificationsStoryProps) {
    const [activeNotificationIndex, setActiveNotificationIndex] = useState(0);
    const notificationsRailRef = useRef<HTMLDivElement | null>(null);
    const notificationChipRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const latestNotificationId = notifications[0]?.id ?? '';

    useEffect(() => {
        notificationChipRefs.current = notificationChipRefs.current.slice(0, notifications.length);

        if (notifications.length === 0) {
            setActiveNotificationIndex(0);
        }
    }, [notifications.length]);

    useEffect(() => {
        setActiveNotificationIndex(0);
    }, [latestNotificationId]);

    useEffect(() => {
        const notificationsRail = notificationsRailRef.current;
        const activeNotification = notificationChipRefs.current[activeNotificationIndex];

        if (!notificationsRail || !activeNotification) return;

        notificationsRail.scrollTo({
            left: activeNotification.offsetLeft - notificationsRail.offsetLeft,
            behavior: 'smooth',
        });
    }, [activeNotificationIndex, notifications.length]);

    useEffect(() => {
        if (notifications.length <= 1) return;

        const intervalId = window.setInterval(() => {
            setActiveNotificationIndex((currentIndex) => (
                currentIndex >= notifications.length - 1 ? 0 : currentIndex + 1
            ));
        }, intervalMs);

        return () => window.clearInterval(intervalId);
    }, [intervalMs, latestNotificationId, notifications.length]);

    if (notifications.length === 0) return null;

    return (
        <div
            ref={notificationsRailRef}
            className={`roleta-notifications-story${className ? ` ${className}` : ''}`}
            aria-label={ariaLabel}
        >
            {notifications.map((notification, index) => (
                <span
                    className={`roleta-notifications-story__chip${activeNotificationIndex === index ? ' roleta-notifications-story__chip--active' : ''}`}
                    key={`${notification.id}-${index}`}
                    ref={(element) => {
                        notificationChipRefs.current[index] = element;
                    }}
                    aria-current={activeNotificationIndex === index ? 'true' : undefined}
                >
                    <span>{renderNotificationText(notification)}</span>
                </span>
            ))}
        </div>
    );
}
