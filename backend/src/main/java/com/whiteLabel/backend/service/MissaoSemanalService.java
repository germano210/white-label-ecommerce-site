package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoCiclo;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioMissaoSemanal;
import com.whiteLabel.backend.dto.MissaoSemanalResponse;
import com.whiteLabel.backend.dto.MissoesSemanaisResponse;
import com.whiteLabel.backend.dto.ResgateTentativasResponse;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoSemanalRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MissaoSemanalService {

    private final MissaoRepository missaoRepository;
    private final UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository;
    private final UsuarioRepository usuarioRepository;
    private final Clock clock;

    @Autowired
    public MissaoSemanalService(
            MissaoRepository missaoRepository,
            UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository,
            UsuarioRepository usuarioRepository
    ) {
        this(
                missaoRepository,
                usuarioMissaoSemanalRepository,
                usuarioRepository,
                Clock.systemDefaultZone()
        );
    }

    MissaoSemanalService(
            MissaoRepository missaoRepository,
            UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository,
            UsuarioRepository usuarioRepository,
            Clock clock
    ) {
        this.missaoRepository = missaoRepository;
        this.usuarioMissaoSemanalRepository = usuarioMissaoSemanalRepository;
        this.usuarioRepository = usuarioRepository;
        this.clock = clock;
    }

    @Transactional
    public MissoesSemanaisResponse listar() {
        Usuario usuario = buscarUsuarioAutenticado();
        sincronizarNivel(usuario);

        return montarResposta(usuario);
    }

    @Transactional
    public ResgateTentativasResponse resgatarTentativas() {
        Usuario usuario = buscarUsuarioAutenticado();
        CicloSemanal ciclo = cicloAtual();
        List<UsuarioMissaoSemanal> progressos = usuarioMissaoSemanalRepository
                .findByUsuarioIdAndSemanaInicio(usuario.getId(), ciclo.inicio());
        List<UsuarioMissaoSemanal> resgataveis = progressos.stream()
                .filter(UsuarioMissaoSemanal::getConcluida)
                .filter(progresso -> !progresso.getRecompensaResgatada())
                .filter(progresso -> progresso.getTentativasConcedidas() > 0)
                .toList();
        int tentativas = resgataveis.stream()
                .mapToInt(UsuarioMissaoSemanal::getTentativasConcedidas)
                .sum();

        if (tentativas <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nenhuma tentativa semanal disponivel para resgate"
            );
        }

        resgataveis.forEach(UsuarioMissaoSemanal::marcarRecompensaResgatada);
        usuarioMissaoSemanalRepository.saveAll(resgataveis);
        usuario.adicionarTentativas(tentativas);
        Usuario usuarioAtualizado = usuarioRepository.save(usuario);

        return new ResgateTentativasResponse(
                tentativas,
                usuarioAtualizado.getTentativas(),
                ciclo.fim(),
                montarMissoes(usuarioAtualizado, ciclo)
        );
    }

    @Transactional
    public void registrarAcao(Usuario usuario, String tipoAcao) {
        CicloSemanal ciclo = cicloAtual();
        List<Missao> missoes = missaoRepository
                .findAllByAtivaTrueAndCicloAndTipoAcaoOrderByIdAsc(
                        MissaoCiclo.SEMANAL,
                        tipoAcao
                );

        for (Missao missao : missoes) {
            UsuarioMissaoSemanal progresso = buscarOuCriar(usuario, missao, ciclo);

            if (progresso.getConcluida()
                    || MissaoTipoAcao.BONUS_DIARIO.name().equals(missao.getTipoAcao())) {
                continue;
            }

            progresso.incrementarAteMeta(missao.getMetaProgresso());
            concluirSeAtingiuMeta(progresso, missao);
            usuarioMissaoSemanalRepository.save(progresso);
        }
    }

    @Transactional
    public void sincronizarNivel(Usuario usuario) {
        CicloSemanal ciclo = cicloAtual();
        List<Missao> missoes = missaoRepository
                .findAllByAtivaTrueAndCicloAndTipoAcaoOrderByIdAsc(
                        MissaoCiclo.SEMANAL,
                        MissaoTipoAcao.ALCANCAR_NIVEL.name()
                );

        for (Missao missao : missoes) {
            UsuarioMissaoSemanal progresso = buscarOuCriar(usuario, missao, ciclo);

            if (progresso.getConcluida()) {
                continue;
            }

            progresso.definirProgresso(usuario.getNivel(), missao.getMetaProgresso());
            concluirSeAtingiuMeta(progresso, missao);
            usuarioMissaoSemanalRepository.save(progresso);
        }
    }

    private MissoesSemanaisResponse montarResposta(Usuario usuario) {
        CicloSemanal ciclo = cicloAtual();
        List<MissaoSemanalResponse> missoes = montarMissoes(usuario, ciclo);
        int tentativasDisponiveis = calcularTentativasDisponiveis(usuario, ciclo);
        int xpDisponivel = calcularXpDisponivel(usuario, ciclo);

        return new MissoesSemanaisResponse(
                ciclo.fim(),
                missoes,
                tentativasDisponiveis > 0,
                tentativasDisponiveis,
                xpDisponivel
        );
    }

    private List<MissaoSemanalResponse> montarMissoes(Usuario usuario, CicloSemanal ciclo) {
        List<Missao> missoes = missaoRepository
                .findAllByAtivaTrueAndCicloOrderByIdAsc(MissaoCiclo.SEMANAL);
        Map<Long, UsuarioMissaoSemanal> progressos = usuarioMissaoSemanalRepository
                .findByUsuarioIdAndSemanaInicioAndMissaoAtivaTrue(usuario.getId(), ciclo.inicio())
                .stream()
                .collect(Collectors.toMap(
                        progresso -> progresso.getMissao().getId(),
                        Function.identity()
                ));

        return missoes.stream()
                .map(missao -> MissaoSemanalResponse.from(missao, progressos.get(missao.getId())))
                .toList();
    }

    private int calcularTentativasDisponiveis(Usuario usuario, CicloSemanal ciclo) {
        return usuarioMissaoSemanalRepository
                .findByUsuarioIdAndSemanaInicio(usuario.getId(), ciclo.inicio())
                .stream()
                .filter(UsuarioMissaoSemanal::getConcluida)
                .filter(progresso -> !progresso.getRecompensaResgatada())
                .mapToInt(UsuarioMissaoSemanal::getTentativasConcedidas)
                .sum();
    }

    private int calcularXpDisponivel(Usuario usuario, CicloSemanal ciclo) {
        return usuarioMissaoSemanalRepository
                .findByUsuarioIdAndSemanaInicio(usuario.getId(), ciclo.inicio())
                .stream()
                .filter(UsuarioMissaoSemanal::getConcluida)
                .filter(progresso -> !progresso.getRecompensaResgatada())
                .mapToInt(UsuarioMissaoSemanal::getXpConcedido)
                .sum();
    }

    private UsuarioMissaoSemanal buscarOuCriar(
            Usuario usuario,
            Missao missao,
            CicloSemanal ciclo
    ) {
        return usuarioMissaoSemanalRepository
                .findByUsuarioIdAndMissaoIdAndSemanaInicio(
                        usuario.getId(),
                        missao.getId(),
                        ciclo.inicio()
                )
                .orElseGet(() -> new UsuarioMissaoSemanal(
                        usuario,
                        missao,
                        ciclo.inicio(),
                        ciclo.fim()
                ));
    }

    private void concluirSeAtingiuMeta(UsuarioMissaoSemanal progresso, Missao missao) {
        if (progresso.atingiuMeta(missao.getMetaProgresso())) {
            progresso.concluir(missao.getXpRecompensa(), missao.getTentativasRecompensa());
        }
    }

    private Usuario buscarUsuarioAutenticado() {
        UUID usuarioId = obterUsuarioAutenticadoId();

        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));
    }

    private UUID obterUsuarioAutenticadoId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao autenticado");
        }

        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token de autenticacao invalido",
                    exception
            );
        }
    }

    private CicloSemanal cicloAtual() {
        LocalDate hoje = LocalDate.now(clock);
        int diasDesdeSexta = Math.floorMod(
                hoje.getDayOfWeek().getValue() - DayOfWeek.FRIDAY.getValue(),
                7
        );
        LocalDateTime inicio = hoje.minusDays(diasDesdeSexta).atStartOfDay();

        return new CicloSemanal(inicio, inicio.plusWeeks(1));
    }

    private record CicloSemanal(LocalDateTime inicio, LocalDateTime fim) {
    }
}
