import type { CSSProperties } from 'react';
import brechoDaCamiLogo from '../../assets/icons/brechodacamilogo.svg';

interface BrechoDaCamiLogoProps {
    alt?: string;
    className?: string;
    style?: CSSProperties;
}

export function BrechoDaCamiLogo({
    alt = 'Brechó da Cami',
    className,
    style,
}: BrechoDaCamiLogoProps) {
    return (
        <img
            src={brechoDaCamiLogo}
            alt={alt}
            className={className}
            style={style}
            draggable={false}
        />
    );
}
