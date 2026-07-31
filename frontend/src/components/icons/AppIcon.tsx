import type { CSSProperties } from 'react';
import coracaoPreenchidoSvg from '../../assets/icons/coracao-preenchido.svg?raw';
import coracaoVazadoSvg from '../../assets/icons/coracao-vazado.svg?raw';
import explorarSvg from '../../assets/icons/explorar.svg?raw';
import forYouSvg from '../../assets/icons/foryou.svg?raw';
import menuHamburguerSvg from '../../assets/icons/menuHamburguer.svg?raw';
import perfilSvg from '../../assets/icons/perfil.svg?raw';
import usuarioSvg from '../../assets/icons/usuario.svg?raw';

export type AppIconName =
    | 'foryou'
    | 'explorar'
    | 'curtidas'
    | 'perfil'
    | 'usuario'
    | 'menu'
    | 'coracao-vazado'
    | 'coracao-preenchido';

interface AppIconProps {
    name: AppIconName;
    size?: number;
    title?: string;
    className?: string;
    style?: CSSProperties;
}

const iconSvgByName: Record<AppIconName, string> = {
    foryou: forYouSvg,
    explorar: explorarSvg,
    curtidas: coracaoVazadoSvg,
    perfil: perfilSvg,
    usuario: usuarioSvg,
    menu: menuHamburguerSvg,
    'coracao-vazado': coracaoVazadoSvg,
    'coracao-preenchido': coracaoPreenchidoSvg,
};

function normalizeSvg(svg: string, name: AppIconName) {
    const normalizedSvg = svg
        .replace(/\sfill=(["'])#(?:ffffff|fff|000000|000)\1/gi, ' fill="currentColor"')
        .replace(/\sstroke=(["'])#(?:ffffff|fff|000000|000)\1/gi, ' stroke="currentColor"')
        .replace(/<svg\s/i, '<svg width="100%" height="100%" aria-hidden="true" focusable="false" style="overflow: visible;" ');

    if (name === 'coracao-vazado') {
        return normalizedSvg.replace('viewBox="0 0 900 900"', 'viewBox="-55 0 1010 900"');
    }

    if (name === 'coracao-preenchido') {
        return normalizedSvg.replace('viewBox="0 0 900 900"', 'viewBox="-24 0 948 900"');
    }

    return normalizedSvg;
}

export function AppIcon({
    name,
    size = 16,
    title,
    className,
    style,
}: AppIconProps) {
    return (
        <span
            role={title ? 'img' : undefined}
            aria-label={title}
            aria-hidden={title ? undefined : true}
            className={className}
            style={{
                display: 'inline-flex',
                width: size,
                height: size,
                flex: '0 0 auto',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 0,
                ...style,
            }}
            dangerouslySetInnerHTML={{ __html: normalizeSvg(iconSvgByName[name], name) }}
        />
    );
}
