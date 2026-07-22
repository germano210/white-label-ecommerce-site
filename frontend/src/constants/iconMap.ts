import type { AppIconName } from '../components/icons/AppIcon';

export const appIconMap = {
    foryou: 'foryou',
    explorar: 'explorar',
    curtidas: 'curtidas',
    perfil: 'perfil',
    usuario: 'usuario',
    menu: 'menu',
    'coracao-vazado': 'coracao-vazado',
    'coracao-preenchido': 'coracao-preenchido',
} as const satisfies Record<AppIconName, AppIconName>;
