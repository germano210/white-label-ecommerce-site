import { useState } from 'react';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';
import { X } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export function WelcomeModal({ onClose }: Props) {
    const { userName, setUserName } = useDiscoveryStore();
    const [tempName, setTempName] = useState(userName);

    const handleSave = () => {
        setUserName(tempName);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                background: 'white', width: '100%', maxWidth: '350px',
                borderRadius: '28px', padding: '32px 24px', position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#CCC' }}>
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>✨</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--dark)', margin: 0 }}>
                        Bem-vinda à Via Brás!
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '8px' }}>
                        Como gostaria de ser chamada?
                    </p>
                </div>

                <input
                    type="text"
                    placeholder="Seu nome (opcional)"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    style={{
                        width: '100%', padding: '16px', borderRadius: '16px',
                        border: '1.5px solid #EEE', background: '#F9F9F9',
                        fontSize: '16px', outline: 'none', marginBottom: '20px',
                        fontFamily: 'var(--font-body)'
                    }}
                />

                <button
                    onClick={handleSave}
                    style={{
                        width: '100%', padding: '16px', borderRadius: '16px',
                        background: 'var(--terra)', color: 'white', border: 'none',
                        fontSize: '16px', fontWeight: 700, cursor: 'pointer'
                    }}
                >
                    Começar a Descobrir
                </button>
            </div>
        </div>
    );
}