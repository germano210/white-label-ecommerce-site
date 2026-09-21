import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type UIEvent } from 'react';
import {
    normalizeRoletaRarityText,
    type RoletaNotificationView,
} from '../../utils/roletaNotifications';
import './RoletaNotificationsStory.css';

export const ROLETA_NOTIFICATION_STORY_INTERVAL_MS = 3000;
const ROLETA_NOTIFICATION_SCROLL_SPEED_PX_PER_SECOND = 36;
const ROLETA_NOTIFICATION_RESUME_DELAY_MS = 2000;
const ROLETA_NOTIFICATION_MANUAL_SYNC_DELAY_MS = 220;
const ROLETA_NOTIFICATION_LOOP_COPIES = 7;
const ROLETA_NOTIFICATION_MIDDLE_LOOP_COPY = Math.floor(ROLETA_NOTIFICATION_LOOP_COPIES / 2);

interface RoletaNotificationsStoryProps {
    notifications: RoletaNotificationView[];
    className?: string;
    speedPxPerSecond?: number;
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
    speedPxPerSecond = ROLETA_NOTIFICATION_SCROLL_SPEED_PX_PER_SECOND,
    ariaLabel = 'Notificacoes da roleta',
}: RoletaNotificationsStoryProps) {
    const [activeNotificationIndex, setActiveNotificationIndex] = useState(0);
    const [displayNotifications, setDisplayNotifications] = useState<RoletaNotificationView[]>([]);
    const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
    const notificationsRailRef = useRef<HTMLDivElement | null>(null);
    const notificationChipRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const activeNotificationIdRef = useRef('');
    const activeNotificationIndexRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastAnimationFrameTimeRef = useRef<number | null>(null);
    const resumeAutoplayTimeoutRef = useRef<number | null>(null);
    const manualSyncTimeoutRef = useRef<number | null>(null);
    const programmaticScrollTimeoutRef = useRef<number | null>(null);
    const autoplayScrollLeftRef = useRef<number | null>(null);
    const isAutoplayPausedRef = useRef(false);
    const isProgrammaticScrollRef = useRef(false);
    const shouldLoop = displayNotifications.length > 1;
    const renderedNotifications = shouldLoop
        ? Array.from({ length: displayNotifications.length * ROLETA_NOTIFICATION_LOOP_COPIES }, (_, renderIndex) => (
            displayNotifications[renderIndex % displayNotifications.length]
        ))
        : displayNotifications;
    const middleLoopStartIndex = shouldLoop
        ? displayNotifications.length * ROLETA_NOTIFICATION_MIDDLE_LOOP_COPY
        : 0;

    const getNotificationLeft = (notificationElement: HTMLSpanElement, railElement: HTMLDivElement) => (
        notificationElement.offsetLeft - railElement.offsetLeft
    );

    const jumpToNotificationIndex = (notificationIndex: number) => {
        const notificationsRail = notificationsRailRef.current;
        const targetNotification = notificationChipRefs.current[notificationIndex];

        if (!notificationsRail || !targetNotification) return;

        notificationsRail.scrollLeft = getNotificationLeft(targetNotification, notificationsRail);
        autoplayScrollLeftRef.current = notificationsRail.scrollLeft;
    };

    const setActiveIndex = (notificationIndex: number) => {
        activeNotificationIndexRef.current = notificationIndex;
        setActiveNotificationIndex(notificationIndex);
    };

    const pauseAutoplayTemporarily = () => {
        if (!isAutoplayPausedRef.current) {
            isAutoplayPausedRef.current = true;
            setIsAutoplayPaused(true);
        }

        if (resumeAutoplayTimeoutRef.current) {
            window.clearTimeout(resumeAutoplayTimeoutRef.current);
        }

        isProgrammaticScrollRef.current = false;
        lastAnimationFrameTimeRef.current = null;
        autoplayScrollLeftRef.current = null;

        resumeAutoplayTimeoutRef.current = window.setTimeout(() => {
            isAutoplayPausedRef.current = false;
            setIsAutoplayPaused(false);
        }, ROLETA_NOTIFICATION_RESUME_DELAY_MS);
    };

    const getNearestRenderedNotificationIndex = (notificationsRail: HTMLDivElement) => {
        const railLeft = notificationsRail.getBoundingClientRect().left;
        const railCenter = railLeft + 12;
        let nearestIndex = activeNotificationIndex;
        let nearestDistance = Number.POSITIVE_INFINITY;

        Array.from(notificationsRail.children).forEach((child, childIndex) => {
            if (!(child instanceof HTMLElement)) return;

            const childRect = child.getBoundingClientRect();
            const distance = Math.abs(childRect.left - railCenter);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = childIndex;
            }
        });

        return nearestIndex;
    };

    const normalizeLoopPosition = (renderIndex: number) => {
        if (!shouldLoop || displayNotifications.length === 0) return renderIndex;

        const baseIndex = renderIndex % displayNotifications.length;
        const middleIndex = middleLoopStartIndex + baseIndex;

        if (
            renderIndex < middleLoopStartIndex
            || renderIndex >= middleLoopStartIndex + displayNotifications.length
        ) {
            jumpToNotificationIndex(middleIndex);
            return middleIndex;
        }

        return renderIndex;
    };

    const updateActiveIndexFromRail = (notificationsRail: HTMLDivElement) => {
        const nextIndex = normalizeLoopPosition(getNearestRenderedNotificationIndex(notificationsRail));

        if (nextIndex !== activeNotificationIndexRef.current) {
            setActiveIndex(nextIndex);
        }
    };

    const normalizeAutoplayLoopPosition = (notificationsRail: HTMLDivElement) => {
        if (!shouldLoop || displayNotifications.length === 0) return;

        const loopStartNotification = notificationChipRefs.current[middleLoopStartIndex];
        const nextLoopStartNotification = notificationChipRefs.current[
            middleLoopStartIndex + displayNotifications.length
        ];

        if (!loopStartNotification || !nextLoopStartNotification) return;

        const loopStart = getNotificationLeft(loopStartNotification, notificationsRail);
        const nextLoopStart = getNotificationLeft(nextLoopStartNotification, notificationsRail);
        const loopWidth = nextLoopStart - loopStart;

        if (loopWidth <= 0) return;

        let nextScrollLeft = autoplayScrollLeftRef.current ?? notificationsRail.scrollLeft;

        while (nextScrollLeft >= nextLoopStart) {
            nextScrollLeft -= loopWidth;
        }

        while (nextScrollLeft < loopStart) {
            nextScrollLeft += loopWidth;
        }

        if (nextScrollLeft !== notificationsRail.scrollLeft) {
            notificationsRail.scrollLeft = nextScrollLeft;
        }

        autoplayScrollLeftRef.current = nextScrollLeft;
    };

    const scheduleManualSyncFromRail = (notificationsRail: HTMLDivElement) => {
        if (manualSyncTimeoutRef.current) {
            window.clearTimeout(manualSyncTimeoutRef.current);
        }

        manualSyncTimeoutRef.current = window.setTimeout(() => {
            updateActiveIndexFromRail(notificationsRail);
        }, ROLETA_NOTIFICATION_MANUAL_SYNC_DELAY_MS);
    };

    const handleManualScroll = (event: UIEvent<HTMLDivElement>) => {
        if (isProgrammaticScrollRef.current) return;

        pauseAutoplayTemporarily();
        scheduleManualSyncFromRail(event.currentTarget);
    };

    useEffect(() => {
        setDisplayNotifications((currentQueue) => {
            if (notifications.length === 0) return [];
            if (currentQueue.length === 0) return notifications;

            const incomingNotificationsById = new Map(
                notifications.map((notification) => [notification.id, notification]),
            );
            const currentNotificationIds = new Set(currentQueue.map((notification) => notification.id));
            const updatedCurrentQueue = currentQueue
                .filter((notification) => incomingNotificationsById.has(notification.id))
                .map((notification) => incomingNotificationsById.get(notification.id) ?? notification);
            const newNotifications = notifications.filter((notification) => (
                !currentNotificationIds.has(notification.id)
            ));

            return [...updatedCurrentQueue, ...newNotifications];
        });
    }, [notifications]);

    useEffect(() => {
        notificationChipRefs.current = notificationChipRefs.current.slice(0, renderedNotifications.length);

        if (displayNotifications.length === 0) {
            setActiveNotificationIndex(0);
            activeNotificationIdRef.current = '';
            return;
        }

        const activeBaseIndex = activeNotificationIdRef.current
            ? displayNotifications.findIndex((notification) => notification.id === activeNotificationIdRef.current)
            : 0;
        const nextBaseIndex = activeBaseIndex >= 0 ? activeBaseIndex : 0;

        setActiveIndex(
            shouldLoop ? middleLoopStartIndex + nextBaseIndex : nextBaseIndex,
        );
    }, [displayNotifications, middleLoopStartIndex, renderedNotifications.length, shouldLoop]);

    useEffect(() => () => {
        if (animationFrameRef.current) {
            window.cancelAnimationFrame(animationFrameRef.current);
        }

        if (resumeAutoplayTimeoutRef.current) {
            window.clearTimeout(resumeAutoplayTimeoutRef.current);
        }

        if (manualSyncTimeoutRef.current) {
            window.clearTimeout(manualSyncTimeoutRef.current);
        }

        if (programmaticScrollTimeoutRef.current) {
            window.clearTimeout(programmaticScrollTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        if (displayNotifications.length === 0) return;

        const activeBaseNotification = displayNotifications[
            activeNotificationIndex % displayNotifications.length
        ];

        if (activeBaseNotification) {
            activeNotificationIdRef.current = activeBaseNotification.id;
        }
    }, [activeNotificationIndex, displayNotifications]);

    useEffect(() => {
        const notificationsRail = notificationsRailRef.current;
        const activeNotification = notificationChipRefs.current[activeNotificationIndexRef.current];

        if (!notificationsRail || !activeNotification) return;

        isProgrammaticScrollRef.current = true;
        notificationsRail.scrollLeft = getNotificationLeft(activeNotification, notificationsRail);
        autoplayScrollLeftRef.current = notificationsRail.scrollLeft;

        if (programmaticScrollTimeoutRef.current) {
            window.clearTimeout(programmaticScrollTimeoutRef.current);
        }

        programmaticScrollTimeoutRef.current = window.setTimeout(() => {
            isProgrammaticScrollRef.current = false;
        }, 80);
    }, [displayNotifications.length]);

    useEffect(() => {
        if (displayNotifications.length <= 1 || isAutoplayPaused) return;

        const animate = (currentTime: number) => {
            const notificationsRail = notificationsRailRef.current;

            if (!notificationsRail) {
                animationFrameRef.current = window.requestAnimationFrame(animate);
                return;
            }

            const lastTime = lastAnimationFrameTimeRef.current ?? currentTime;
            const deltaSeconds = Math.min((currentTime - lastTime) / 1000, 0.08);
            lastAnimationFrameTimeRef.current = currentTime;

            isProgrammaticScrollRef.current = true;
            autoplayScrollLeftRef.current = (
                autoplayScrollLeftRef.current ?? notificationsRail.scrollLeft
            ) + (speedPxPerSecond * deltaSeconds);
            notificationsRail.scrollLeft = autoplayScrollLeftRef.current;
            normalizeAutoplayLoopPosition(notificationsRail);
            updateActiveIndexFromRail(notificationsRail);
            autoplayScrollLeftRef.current = notificationsRail.scrollLeft;

            if (programmaticScrollTimeoutRef.current) {
                window.clearTimeout(programmaticScrollTimeoutRef.current);
            }

            programmaticScrollTimeoutRef.current = window.setTimeout(() => {
                isProgrammaticScrollRef.current = false;
            }, 80);

            animationFrameRef.current = window.requestAnimationFrame(animate);
        };

        animationFrameRef.current = window.requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            lastAnimationFrameTimeRef.current = null;
        };
    }, [isAutoplayPaused, speedPxPerSecond, displayNotifications.length]);

    if (displayNotifications.length === 0) return null;

    return (
        <div
            ref={notificationsRailRef}
            className={`roleta-notifications-story${className ? ` ${className}` : ''}`}
            aria-label={ariaLabel}
            onScroll={handleManualScroll}
            onPointerDown={pauseAutoplayTemporarily}
            onPointerMove={pauseAutoplayTemporarily}
            onPointerUp={pauseAutoplayTemporarily}
            onPointerCancel={pauseAutoplayTemporarily}
            onWheel={pauseAutoplayTemporarily}
        >
            {renderedNotifications.map((notification, index) => (
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
