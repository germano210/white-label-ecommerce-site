import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AppIcon } from '../components/icons/AppIcon';
import { appIconMap } from '../constants/iconMap';
import { useAuthStore, type AuthUser } from '../store/useAuthStore';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';
import { appRoutes } from '../utils/appRoutes';

type ProfileRecord = Partial<AuthUser> & Record<string, unknown>;

interface ProfileResponse {
    usuario?: ProfileRecord | null;
    user?: ProfileRecord | null;
}

function readStringField(record: ProfileRecord | null, keys: string[]) {
    if (!record) return '';

    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }

    return '';
}

function readNumberField(record: ProfileRecord | null, keys: string[]) {
    if (!record) return null;

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

function isProfileRecord(value: unknown): value is ProfileRecord {
    return typeof value === 'object' && value !== null;
}

function extractProfileResponse(data: unknown): ProfileRecord {
    if (!isProfileRecord(data)) return {};

    if (isProfileRecord(data.usuario)) return data.usuario;
    if (isProfileRecord(data.user)) return data.user;
    return data;
}

function normalizeProfileUser(profile: ProfileRecord): AuthUser {
    const name = readStringField(profile, ['nome', 'name']) || 'Cliente';
    const phone = readStringField(profile, ['telefone', 'phone']);

    return {
        ...profile,
        name,
        nome: name,
        phone,
        telefone: phone,
    };
}

function getDisplayName(user: AuthUser | null) {
    return readStringField(user, ['nome', 'name']) || 'Cliente';
}

function getDisplayPhone(user: AuthUser | null) {
    return readStringField(user, ['telefone', 'phone']);
}

function getLevelState(user: AuthUser | null) {
    const level = readNumberField(user, ['level', 'nivel', 'lvl']);
    const xpAtual = readNumberField(user, ['xpAtual', 'xp_atual', 'xp']);
    const xpParaProximoNivel = readNumberField(user, [
        'xpParaProximoNivel',
        'xp_para_proximo_nivel',
        'xpProximoNivel',
        'xp_proximo_nivel',
    ]);
    const currentLevel = level && level > 0 ? Math.floor(level) : 1;
    const progress = xpAtual !== null && xpParaProximoNivel && xpParaProximoNivel > 0
        ? Math.min(Math.max(xpAtual / xpParaProximoNivel, 0), 1)
        : 0;

    return {
        currentLevel,
        nextLevel: currentLevel + 1,
        progress,
    };
}

function getInviteLinkFromUser(user: AuthUser | null) {
    const directLink = readStringField(user, [
        'linkIndicacao',
        'link_indicacao',
        'indicacaoLink',
        'referralLink',
        'conviteLink',
    ]);

    if (directLink) return new URL(directLink, window.location.origin).toString();

    const inviteCode = readStringField(user, [
        'codigoIndicacao',
        'codigo_indicacao',
        'indicacaoCodigo',
        'referralCode',
        'conviteCodigo',
    ]);
    const inviteUrl = new URL(appRoutes.indique, window.location.origin);

    if (inviteCode) inviteUrl.searchParams.set('ref', inviteCode);
    return inviteUrl.toString();
}

async function copyInviteLink(text: string) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

export function PerfilScreen() {
    const storedUser = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const updateUser = useAuthStore((state) => state.updateUser);
    const logout = useAuthStore((state) => state.logout);
    const [profileUser, setProfileUser] = useState<AuthUser | null>(storedUser);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [showLevelHelp, setShowLevelHelp] = useState(false);
    const [inviteStatus, setInviteStatus] = useState('');
    const hasAuthenticatedSession = Boolean(storedUser || token);

    useEffect(() => {
        setProfileUser(storedUser);
    }, [storedUser]);

    useEffect(() => {
        const previousBodyBackground = document.body.style.backgroundColor;
        const previousHtmlBackground = document.documentElement.style.backgroundColor;

        document.body.style.backgroundColor = '#e6e6e6';
        document.documentElement.style.backgroundColor = '#e6e6e6';

        return () => {
            document.body.style.backgroundColor = previousBodyBackground;
            document.documentElement.style.backgroundColor = previousHtmlBackground;
        };
    }, []);

    useEffect(() => {
        if (!hasAuthenticatedSession) return;

        let isActive = true;

        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            setProfileError('');

            try {
                const { data } = await api.get<ProfileRecord | ProfileResponse>(apiRoutes.usuarios.me);
                const normalizedUser = normalizeProfileUser(extractProfileResponse(data));

                if (!isActive) return;
                setProfileUser(normalizedUser);
                updateUser(normalizedUser);
            } catch {
                if (isActive) {
                    setProfileError('Não foi possível atualizar seu perfil agora.');
                }
            } finally {
                if (isActive) setIsLoadingProfile(false);
            }
        };

        void fetchProfile();

        return () => {
            isActive = false;
        };
    }, [hasAuthenticatedSession, updateUser]);

    const levelState = useMemo(() => getLevelState(profileUser), [profileUser]);

    const handleInviteShare = async () => {
        if (!profileUser) return;

        const inviteLink = getInviteLinkFromUser(profileUser);
        const shareText = 'Indique e Ganhe';

        setInviteStatus('');

        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareText,
                    text: 'Ganhe dinheiro e chances, indicando para outras pessoas.',
                    url: inviteLink,
                });
                setInviteStatus('Link pronto para compartilhar.');
                return;
            }

            await copyInviteLink(inviteLink);
            setInviteStatus('Link copiado.');
        } catch {
            setInviteStatus('Não foi possível compartilhar agora.');
        }
    };

    const handleLogout = () => {
        logout();
        setProfileUser(null);
        setProfileError('');
        setInviteStatus('');
        setShowLevelHelp(false);
    };

    return (
        <main style={screenStyle}>
            <section style={windowStyle} aria-label="Perfil">
                {hasAuthenticatedSession && (
                    <button
                        type="button"
                        onClick={handleLogout}
                        style={logoutButtonStyle}
                    >
                        Sair
                    </button>
                )}
                <div style={contentStyle}>
                    {!hasAuthenticatedSession ? (
                        <div style={emptyStateStyle}>
                            <AppIcon name={appIconMap.usuario} size={54} />
                            <h1 style={nameStyle}>Entre para ver seu perfil.</h1>
                        </div>
                    ) : (
                        <>
                            <div style={avatarStyle}>
                                <AppIcon name={appIconMap.usuario} size={18} />
                            </div>

                            <h1 style={nameStyle}>{getDisplayName(profileUser)}</h1>
                            {getDisplayPhone(profileUser) && (
                                <p style={phoneStyle}>{getDisplayPhone(profileUser)}</p>
                            )}

                            <button
                                type="button"
                                aria-label="Como funciona o level"
                                onClick={() => setShowLevelHelp((isVisible) => !isVisible)}
                                style={infoButtonStyle}
                            >
                                i
                            </button>

                            <p
                                aria-hidden={!showLevelHelp}
                                style={{
                                    ...levelHelpStyle,
                                    opacity: showLevelHelp ? 0.7 : 0,
                                }}
                            >
                                Seu level aumenta conforme você completa missões, curte itens e participa das ações da loja.
                            </p>

                            <section style={levelSectionStyle} aria-label="Progresso de level">
                                <div style={levelLabelsStyle}>
                                    <strong style={currentLevelStyle}>Lvl. {levelState.currentLevel}</strong>
                                    <span style={nextLevelStyle}>Lvl. {levelState.nextLevel}</span>
                                </div>
                                <div style={xpTrackStyle}>
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            ...xpFillStyle,
                                            width: `${Math.round(levelState.progress * 100)}%`,
                                        }}
                                    />
                                </div>
                            </section>

                            <button
                                type="button"
                                onClick={() => void handleInviteShare()}
                                style={inviteButtonStyle}
                            >
                                Indique e Ganhe
                            </button>
                            <p style={inviteDescriptionStyle}>
                                Ganhe dinheiro e chances, indicando para outras pessoas.
                            </p>

                            {isLoadingProfile && <p style={statusStyle}>Atualizando perfil...</p>}
                            {profileError && <p role="alert" style={errorStyle}>{profileError}</p>}
                            {inviteStatus && <p role="status" style={statusStyle}>{inviteStatus}</p>}
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}

const screenStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    boxSizing: 'border-box',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '430px',
    height: '100dvh',
    margin: '0 auto',
    overflow: 'hidden',
    background: '#e6e6e6',
    color: '#000000',
    fontFamily: "'DM Sans', sans-serif",
    padding: '7px 4px 7px',
};

const windowStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '9px',
    background: '#ffffff',
};

const logoutButtonStyle: CSSProperties = {
    position: 'absolute',
    top: '30px',
    left: '17px',
    zIndex: 2,
    border: 0,
    background: 'transparent',
    color: '#000000',
    cursor: 'pointer',
    padding: 0,
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1,
};

const contentStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '35px 34px 28px',
    textAlign: 'center',
};

const emptyStateStyle: CSSProperties = {
    display: 'flex',
    minHeight: '55dvh',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#000000',
};

const avatarStyle: CSSProperties = {
    display: 'grid',
    width: '22px',
    height: '22px',
    margin: '0 auto 6px',
    placeItems: 'center',
    color: '#000000',
};

const nameStyle: CSSProperties = {
    margin: 0,
    color: '#000000',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.08,
};

const phoneStyle: CSSProperties = {
    margin: '5px 0 0',
    color: '#000000',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1,
    opacity: 0.62,
};

const infoButtonStyle: CSSProperties = {
    position: 'relative',
    top: '27px',
    display: 'grid',
    width: '12px',
    height: '12px',
    margin: '28px auto 0',
    placeItems: 'center',
    border: 0,
    borderRadius: '999px',
    background: '#000000',
    color: '#ffffff',
    cursor: 'pointer',
    padding: 0,
    fontSize: '8px',
    fontWeight: 700,
    lineHeight: 1,
};

const levelHelpStyle: CSSProperties = {
    maxWidth: '260px',
    minHeight: '28px',
    margin: '7px auto 0',
    color: '#000000',
    fontSize: '10px',
    fontWeight: 500,
    lineHeight: 1.35,
    transition: 'opacity 0.16s ease',
};

const levelSectionStyle: CSSProperties = {
    width: '82%',
    maxWidth: '340px',
    margin: '8px auto 0',
};

const levelLabelsStyle: CSSProperties = {
    position: 'relative',
    height: '17px',
    marginBottom: '4px',
};

const currentLevelStyle: CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#000000',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1,
};

const nextLevelStyle: CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: 0,
    color: '#000000',
    fontSize: '9px',
    fontWeight: 400,
    lineHeight: 1,
    opacity: 0.45,
};

const xpTrackStyle: CSSProperties = {
    width: '100%',
    height: '8px',
    overflow: 'hidden',
    borderRadius: '999px',
    background: '#cacfbe',
};

const xpFillStyle: CSSProperties = {
    display: 'block',
    height: '100%',
    borderRadius: 'inherit',
    background: '#687152',
};

const inviteButtonStyle: CSSProperties = {
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    width: 'min(85dvw, 366px)',
    minHeight: '54px',
    margin: '46px 0 0',
    alignItems: 'center',
    justifyContent: 'center',
    border: 0,
    borderRadius: '13px',
    background: '#687152',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '0 22px',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1,
};

const inviteDescriptionStyle: CSSProperties = {
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(80dvw, 344px)',
    margin: '9px 0 0',
    color: '#000000',
    fontSize: '10px',
    fontWeight: 400,
    lineHeight: 1.25,
    opacity: 0.58,
};

const statusStyle: CSSProperties = {
    margin: '14px auto 0',
    color: '#000000',
    fontSize: '10px',
    fontWeight: 700,
    lineHeight: 1.25,
    opacity: 0.62,
};

const errorStyle: CSSProperties = {
    margin: '14px auto 0',
    color: '#8a372f',
    fontSize: '10px',
    fontWeight: 800,
    lineHeight: 1.25,
};
