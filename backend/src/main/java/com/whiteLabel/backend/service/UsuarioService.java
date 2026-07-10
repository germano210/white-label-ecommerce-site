package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Slf4j
@Service
public class UsuarioService {

    private static final double CHANCE_BONUS_CRITICO = 0.20;
    private static final double MULTIPLICADOR_BONUS_CRITICO = 1.5;

    private final UsuarioRepository usuarioRepository;
    private final MissaoSemanalService missaoSemanalService;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            MissaoSemanalService missaoSemanalService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.missaoSemanalService = missaoSemanalService;
    }

    /**
     * Aplica uma progressao hibrida baseada em RPE e JND: nos niveis 1 a 6,
     * a curva usa crescimento 1.5 para manter reforcos frequentes e surpresa positiva;
     * nos niveis 7 a 9, a curva usa crescimento 2.0 para revelar grind de forma gradual;
     * a partir do nivel 10, a curva usa crescimento 2.5 para criar atraso perceptivo de JND,
     * onde o usuario precisa de esforco muito maior para notar a proxima mudanca relevante.
     */
    @Transactional
    public Usuario adicionarXp(Usuario usuario, Integer valorBase, Integer peso) {
        Objects.requireNonNull(usuario, "usuario nao pode ser nulo");
        Objects.requireNonNull(valorBase, "valorBase nao pode ser nulo");
        Objects.requireNonNull(peso, "peso nao pode ser nulo");

        int xpGanho = valorBase * peso;
        if (Math.random() <= CHANCE_BONUS_CRITICO) {
            xpGanho = (int) (xpGanho * MULTIPLICADOR_BONUS_CRITICO);
            log.info(
                    "Bonus Critico de RPE ativado para usuario {} com ganho final de {} XP",
                    usuario.getId(),
                    xpGanho
            );
        }

        int novoXp = usuario.getXp() + xpGanho;
        int nivelAnterior = usuario.getNivel();

        usuario.setXp(novoXp);
        while (usuario.getXp() >= calcularXpNecessarioParaProximoNivel(usuario.getNivel())) {
            usuario.setNivel(usuario.getNivel() + 1);
        }

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        if (usuarioAtualizado.getNivel() > nivelAnterior) {
            missaoSemanalService.sincronizarNivel(usuarioAtualizado);
        }

        return usuarioAtualizado;
    }

    private double calcularXpNecessarioParaProximoNivel(Integer nivelAtual) {
        int nivel = Math.max(1, nivelAtual == null ? 1 : nivelAtual);

        if (nivel <= 6) {
            return 100 * Math.pow(nivel, 1.5);
        }

        if (nivel <= 9) {
            return 100 * Math.pow(nivel, 2.0);
        }

        return 100 * Math.pow(nivel, 2.5);
    }
}
