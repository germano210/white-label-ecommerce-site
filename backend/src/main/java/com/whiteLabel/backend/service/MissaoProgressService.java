package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioMissao;
import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MissaoProgressService {

    private final MissaoRepository missaoRepository;
    private final UsuarioMissaoRepository usuarioMissaoRepository;
    private final UsuarioService usuarioService;

    public MissaoProgressService(
            MissaoRepository missaoRepository,
            UsuarioMissaoRepository usuarioMissaoRepository,
            UsuarioService usuarioService
    ) {
        this.missaoRepository = missaoRepository;
        this.usuarioMissaoRepository = usuarioMissaoRepository;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public List<MissaoResponse> registrarAcao(Usuario usuario, String tipoAcao) {
        List<Missao> missoes = missaoRepository
                .findAllByAtivaTrueAndTipoAcaoOrderByIdAsc(tipoAcao);

        for (Missao missao : missoes) {
            UsuarioMissao progresso = buscarOuCriar(usuario, missao);

            if (progresso.getConcluida()) {
                continue;
            }

            progresso.incrementarAteMeta(missao.getMetaProgresso());

            if (progresso.atingiuMeta(missao.getMetaProgresso())) {
                int xpConcedido = missao.getValorBase() * missao.getPeso();
                progresso.concluir(xpConcedido);
                usuarioService.adicionarXp(usuario, missao.getValorBase(), missao.getPeso());
            }

            usuarioMissaoRepository.save(progresso);
        }

        return listarMissoesAtivas(usuario.getId());
    }

    @Transactional(readOnly = true)
    public List<MissaoResponse> listarMissoesAtivas(UUID usuarioId) {
        List<Missao> missoes = missaoRepository.findAllByAtivaTrueOrderByIdAsc();
        Map<Long, UsuarioMissao> progressos = buscarProgressos(usuarioId);

        return missoes.stream()
                .map(missao -> MissaoResponse.from(missao, progressos.get(missao.getId())))
                .toList();
    }

    private UsuarioMissao buscarOuCriar(Usuario usuario, Missao missao) {
        return usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(usuario.getId(), missao.getId())
                .orElseGet(() -> new UsuarioMissao(usuario, missao));
    }

    private Map<Long, UsuarioMissao> buscarProgressos(UUID usuarioId) {
        if (usuarioId == null) {
            return Map.of();
        }

        return usuarioMissaoRepository.findByUsuarioIdAndMissaoAtivaTrue(usuarioId)
                .stream()
                .collect(Collectors.toMap(
                        usuarioMissao -> usuarioMissao.getMissao().getId(),
                        Function.identity()
                ));
    }
}
