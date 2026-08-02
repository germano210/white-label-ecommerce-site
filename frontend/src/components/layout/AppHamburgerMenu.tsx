/**
 * AppHamburgerMenu mantém o menu principal fora do fluxo de swipe.
 * Ele fica fixo no shell mobile da aplicação, troca a cor do hambúrguer conforme
 * a rota atual e navega por URLs reais sem depender do produto renderizado.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { appIconMap } from '../../constants/iconMap';
import { useAuthStore, type AuthUser } from '../../store/useAuthStore';
import { appRoutes } from '../../utils/appRoutes';
import { AppIcon, type AppIconName } from '../icons/AppIcon';

function readNumberField(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        const value = record[key];
        const numberValue = typeof value === 'number'
            ? value
            : typeof value === 'string'
                ? Number(value)
                : NaN;

        if (Number.isFinite(numberValue)) return numberValue;
    }

    return null;
}

function getUserLevelProgress(user: AuthUser | null) {
    const record = user as Record<string, unknown> | null;

    if (!record) {
        return {
            level: 1,
            progressRatio: 0,
        };
    }

    const level = readNumberField(record, ['level', 'nivel', 'lvl']);
    const xpAtual = readNumberField(record, ['xpAtual', 'xp_atual', 'xp', 'experienciaAtual']);
    const xpParaProximoNivel = readNumberField(record, [
        'xpParaProximoNivel',
        'xp_para_proximo_nivel',
        'xpProximoNivel',
        'xp_proximo_nivel',
    ]);
    const progressRatio = xpAtual !== null && xpParaProximoNivel && xpParaProximoNivel > 0
        ? Math.min(Math.max(xpAtual / xpParaProximoNivel, 0), 1)
        : 0;

    return {
        level: level && level > 0 ? Math.floor(level) : 1,
        progressRatio,
    };
}

function isMenuRouteActive(pathname: string, path: string) {
    if (path === appRoutes.curtidas) return pathname.startsWith('/curtidas');
    return pathname === path || (path === appRoutes.forYou && pathname === appRoutes.root);
}

interface AppHamburgerMenuProps {
    contained?: boolean;
}

export function AppHamburgerMenu({ contained = false }: AppHamburgerMenuProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const authUser = useAuthStore((state) => state.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const profileProgress = useMemo(() => getUserLevelProgress(authUser), [authUser]);
    const isForYouRoute = isMenuRouteActive(location.pathname, appRoutes.forYou);
    const menuButtonColor = isMenuOpen || !isForYouRoute ? '#000000' : '#FFFFFF';
    const shellStyle = contained ? containedMenuShellStyle : menuShellStyle;
    const buttonStyle = contained ? containedMenuButtonStyle : menuButtonStyle;
    const panelStyle = contained ? containedMenuPanelStyle : menuPanelStyle;

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const handleNavigate = (path: string) => {
        setIsMenuOpen(false);
        navigate(path);
    };

    return (
        <div style={shellStyle}>
            <button
                type="button"
                aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={isMenuOpen}
                onClick={(event) => {
                    event.stopPropagation();
                    setIsMenuOpen((isOpen) => !isOpen);
                }}
                style={{
                    ...buttonStyle,
                    color: menuButtonColor,
                }}
            >
                <AppIcon name={appIconMap.menu} size={20} />
                <span aria-hidden="true" style={menuButtonNotificationDotStyle} />
            </button>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        key="app-side-menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => setIsMenuOpen(false)}
                        style={menuLayerStyle}
                    >
                        <motion.aside
                            aria-label="Menu principal"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 370, damping: 34 }}
                            onClick={(event) => event.stopPropagation()}
                            style={panelStyle}
                        >
                            <div style={menuContentStyle}>
                                <nav style={menuListStyle}>
                                    <SideMenuItem
                                        icon={appIconMap.foryou}
                                        label="For You"
                                        path={appRoutes.forYou}
                                        isActive={isMenuRouteActive(location.pathname, appRoutes.forYou)}
                                        onNavigate={handleNavigate}
                                    />
                                    <SideMenuItem
                                        icon={appIconMap.explorar}
                                        label="Explorar"
                                        path={appRoutes.explorar}
                                        isActive={isMenuRouteActive(location.pathname, appRoutes.explorar)}
                                        onNavigate={handleNavigate}
                                    />
                                    <SideMenuItem
                                        icon={appIconMap.curtidas}
                                        label="Curtidas"
                                        path={appRoutes.curtidas}
                                        isActive={isMenuRouteActive(location.pathname, appRoutes.curtidas)}
                                        onNavigate={handleNavigate}
                                    />
                                    <ProfileMenuItem
                                        level={profileProgress.level}
                                        progressRatio={profileProgress.progressRatio}
                                        isActive={isMenuRouteActive(location.pathname, appRoutes.perfil)}
                                        onNavigate={() => handleNavigate(appRoutes.perfil)}
                                    />
                                </nav>

                                <button
                                    type="button"
                                    onClick={() => handleNavigate(appRoutes.indique)}
                                    style={inviteButtonStyle}
                                >
                                    Indique e Ganhe
                                </button>
                                <p style={inviteHintStyle}>
                                    Resgate 3 tentativas para cada perfil criado com a sua indicação.
                                </p>

                                <section style={tipsBlockStyle}>
                                    <div style={tipsHeaderStyle}>
                                        <AlertTriangle size={13} strokeWidth={1.6} />
                                        <strong>DICAS!</strong>
                                    </div>
                                    <p style={tipsTextStyle}>
                                        Complete missões, aumente o nível da sua conta e curta itens que você ama para liberar recompensas.
                                    </p>
                                </section>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface SideMenuItemProps {
    icon: AppIconName;
    label: string;
    path: string;
    isActive: boolean;
    onNavigate: (path: string) => void;
}

function SideMenuItem({
    icon,
    label,
    path,
    isActive,
    onNavigate,
}: SideMenuItemProps) {
    const color = isActive ? '#687152' : '#000000';

    return (
        <button
            type="button"
            onClick={() => onNavigate(path)}
            style={{
                ...sideMenuItemStyle,
                color,
            }}
        >
            <AppIcon name={icon} size={15} />
            <span style={sideMenuItemLabelStyle}>{label.toUpperCase()}</span>
        </button>
    );
}

interface ProfileMenuItemProps {
    level: number;
    progressRatio: number;
    isActive: boolean;
    onNavigate: () => void;
}

function ProfileMenuItem({
    level,
    progressRatio,
    isActive,
    onNavigate,
}: ProfileMenuItemProps) {
    const color = isActive ? '#687152' : '#000000';

    return (
        <button
            type="button"
            onClick={onNavigate}
            style={{
                ...sideMenuItemStyle,
                alignItems: 'flex-start',
                color,
            }}
        >
            <AppIcon name={appIconMap.perfil} size={15} style={{ marginTop: '1px' }} />
            <span style={profileMenuTextStyle}>
                <span style={sideMenuItemLabelStyle}>PERFIL</span>
                <span style={profileLevelStyle}>Lvl. {level}</span>
                <span style={profileXpTrackStyle} aria-label="Progresso de nível">
                    <span
                        style={{
                            ...profileXpFillStyle,
                            width: `${Math.round(progressRatio * 100)}%`,
                        }}
                    />
                </span>
            </span>
        </button>
    );
}

const menuShellStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: '50%',
    zIndex: 45,
    width: '100%',
    maxWidth: '430px',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
};

const containedMenuShellStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 45,
    overflow: 'hidden',
    borderRadius: 'inherit',
    pointerEvents: 'none',
};

const menuButtonStyle: CSSProperties = {
    position: 'absolute',
    top: '37px',
    right: '17px',
    zIndex: 3,
    display: 'grid',
    width: '30px',
    height: '30px',
    placeItems: 'center',
    border: 0,
    borderRadius: '999px',
    background: 'transparent',
    boxShadow: 'none',
    cursor: 'pointer',
    padding: 0,
    pointerEvents: 'auto',
};

const containedMenuButtonStyle: CSSProperties = {
    ...menuButtonStyle,
    top: '27px',
    right: '10px',
};

const menuButtonNotificationDotStyle: CSSProperties = {
    position: 'absolute',
    top: '6px',
    right: '4px',
    width: '5px',
    height: '5px',
    borderRadius: '999px',
    background: '#687152',
};

const menuLayerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    overflow: 'hidden',
    background: 'transparent',
    cursor: 'default',
    pointerEvents: 'auto',
};

const menuPanelStyle: CSSProperties = {
    position: 'absolute',
    top: '7px',
    right: '4px',
    bottom: '7px',
    left: '40%',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px 8px 0 0',
    background: '#FFFFFF',
    color: '#000000',
    padding: '54px 18px 26px 28px',
    boxShadow: 'none',
    cursor: 'default',
};

const containedMenuPanelStyle: CSSProperties = {
    ...menuPanelStyle,
    top: 0,
    right: 0,
    bottom: 0,
    left: '40%',
};

const menuContentStyle: CSSProperties = {
    display: 'flex',
    width: '128px',
    maxWidth: '128px',
    height: '100%',
    minHeight: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
};

const menuListStyle: CSSProperties = {
    position: 'static',
    display: 'flex',
    width: '128px',
    maxWidth: 'none',
    height: 'auto',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '23px',
    margin: 0,
    padding: 0,
    background: 'transparent',
    backdropFilter: 'none',
    zIndex: 'auto',
};

const sideMenuItemStyle: CSSProperties = {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    alignItems: 'center',
    columnGap: '8px',
    border: 0,
    background: 'transparent',
    color: '#000000',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
};

const sideMenuItemLabelStyle: CSSProperties = {
    overflow: 'hidden',
    fontSize: '9.5px',
    fontWeight: 500,
    letterSpacing: '0',
    lineHeight: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const profileMenuTextStyle: CSSProperties = {
    display: 'flex',
    width: '100%',
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
};

const profileLevelStyle: CSSProperties = {
    marginTop: '4px',
    color: '#000000',
    fontSize: '6.5px',
    fontWeight: 500,
    lineHeight: 1,
};

const profileXpTrackStyle: CSSProperties = {
    width: '64px',
    height: '2px',
    marginTop: '4px',
    overflow: 'hidden',
    borderRadius: '999px',
    background: '#cacfbe',
};

const profileXpFillStyle: CSSProperties = {
    display: 'block',
    height: '100%',
    borderRadius: 'inherit',
    background: '#687152',
};

const inviteButtonStyle: CSSProperties = {
    width: '124px',
    minHeight: '24px',
    marginTop: '28px',
    border: 0,
    borderRadius: '8px',
    background: '#687152',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '6.5px',
    fontWeight: 800,
    lineHeight: 1,
};

const inviteHintStyle: CSSProperties = {
    width: '124px',
    margin: '8px 0 0',
    color: '#687152',
    fontSize: '5.6px',
    fontWeight: 500,
    lineHeight: 1.16,
    textAlign: 'center',
};

const tipsBlockStyle: CSSProperties = {
    width: '128px',
    marginTop: 'auto',
    color: '#000000',
};

const tipsHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#000000',
    fontSize: '9px',
    fontWeight: 500,
    lineHeight: 1,
};

const tipsTextStyle: CSSProperties = {
    margin: '7px 0 0',
    color: '#000000',
    fontSize: '6.1px',
    fontWeight: 400,
    lineHeight: 1.2,
};
