package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.RoletaGiroCredito;
import com.whiteLabel.backend.domain.RoletaMeta;
import com.whiteLabel.backend.domain.RoletaMetaStatus;
import com.whiteLabel.backend.domain.RoletaParticipante;
import com.whiteLabel.backend.dto.RoletaMetaRequest;
import com.whiteLabel.backend.dto.RoletaMetaResponse;
import com.whiteLabel.backend.repository.RoletaGiroCreditoRepository;
import com.whiteLabel.backend.repository.RoletaMetaRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class RoletaMetaService {

    private static final Set<RoletaMetaStatus> STATUS_IGNORADOS_META_ATUAL = Set.of(
            RoletaMetaStatus.CONCLUIDA,
            RoletaMetaStatus.PAUSADA
    );

    private final RoletaMetaRepository roletaMetaRepository;
    private final RoletaParticipanteRepository roletaParticipanteRepository;
    private final RoletaGiroCreditoRepository roletaGiroCreditoRepository;
    private final Clock clock;

    public RoletaMetaService(
            RoletaMetaRepository roletaMetaRepository,
            RoletaParticipanteRepository roletaParticipanteRepository,
            RoletaGiroCreditoRepository roletaGiroCreditoRepository
    ) {
        this.roletaMetaRepository = roletaMetaRepository;
        this.roletaParticipanteRepository = roletaParticipanteRepository;
        this.roletaGiroCreditoRepository = roletaGiroCreditoRepository;
        this.clock = Clock.systemDefaultZone();
    }

    @Transactional(readOnly = true)
    public List<RoletaMetaResponse> listarAdmin() {
        return roletaMetaRepository.findAllByOrderByOrdemAscIdAsc()
                .stream()
                .map(RoletaMetaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<RoletaMetaResponse> obterMetaAtual() {
        return roletaMetaRepository.findMetasAtivasDisponiveis(STATUS_IGNORADOS_META_ATUAL)
                .stream()
                .findFirst()
                .map(RoletaMetaResponse::from);
    }

    @Transactional(readOnly = true)
    public boolean possuiMetasConfiguradas() {
        return roletaMetaRepository.count() > 0;
    }

    @Transactional
    public RoletaMetaResponse criar(RoletaMetaRequest request) {
        validarRequest(request);
        RoletaMeta meta = new RoletaMeta();
        meta.setStatus(RoletaMetaStatus.NAO_INICIADA);
        aplicarDadosObrigatorios(meta, request);
        return RoletaMetaResponse.from(roletaMetaRepository.save(meta));
    }

    @Transactional
    public RoletaMetaResponse atualizar(Long id, RoletaMetaRequest request) {
        validarRequest(request);
        RoletaMeta meta = buscarMeta(id);
        boolean concluida = meta.getStatus() == RoletaMetaStatus.CONCLUIDA;

        if (request.titulo() != null) {
            meta.setTitulo(validarTitulo(request.titulo()));
        }
        if (request.descricao() != null) {
            meta.setDescricao(request.descricao());
        }
        if (request.ordem() != null) {
            meta.setOrdem(validarInteiroNaoNegativo(request.ordem(), "Ordem"));
        }
        if (request.ativa() != null) {
            aplicarAtiva(meta, request.ativa());
        }
        if (request.quantidadeAlvo() != null) {
            validarAlteracaoNumericaMetaConcluida(
                    concluida,
                    request.quantidadeAlvo(),
                    meta.getQuantidadeAlvo(),
                    "Quantidade alvo"
            );
            meta.setQuantidadeAlvo(validarInteiroPositivo(request.quantidadeAlvo(), "Quantidade alvo"));
        }
        if (request.girosRecompensa() != null) {
            validarAlteracaoNumericaMetaConcluida(
                    concluida,
                    request.girosRecompensa(),
                    meta.getGirosRecompensa(),
                    "Giros recompensa"
            );
            meta.setGirosRecompensa(validarInteiroPositivo(request.girosRecompensa(), "Giros recompensa"));
        }

        return RoletaMetaResponse.from(roletaMetaRepository.save(meta));
    }

    @Transactional
    public RoletaMetaResponse desativar(Long id) {
        RoletaMeta meta = buscarMeta(id);
        aplicarAtiva(meta, false);
        return RoletaMetaResponse.from(roletaMetaRepository.save(meta));
    }

    @Transactional
    public RoletaMetaResponse reiniciar(Long id) {
        RoletaMeta meta = buscarMeta(id);
        meta.reiniciar();
        return RoletaMetaResponse.from(roletaMetaRepository.save(meta));
    }

    @Transactional
    public Optional<RoletaMetaResponse> registrarAcaoGrupo() {
        Optional<RoletaMeta> metaAtual = buscarMetaAtualForUpdate();
        if (metaAtual.isEmpty()) {
            return Optional.empty();
        }

        RoletaMeta meta = metaAtual.get();
        LocalDateTime agora = LocalDateTime.now(clock);
        meta.iniciar(agora);
        meta.setProgressoAtual(meta.getProgressoAtual() + 1);

        if (meta.getProgressoAtual() >= meta.getQuantidadeAlvo()) {
            meta.concluir(agora);
            roletaMetaRepository.save(meta);
            roletaMetaRepository.flush();
            concederGirosDaMeta(meta);
            iniciarProximaMeta(agora);
        }

        return Optional.of(RoletaMetaResponse.from(roletaMetaRepository.save(meta)));
    }

    private void aplicarDadosObrigatorios(RoletaMeta meta, RoletaMetaRequest request) {
        meta.setTitulo(validarTitulo(request.titulo()));
        meta.setDescricao(request.descricao());
        meta.setQuantidadeAlvo(validarInteiroPositivo(request.quantidadeAlvo(), "Quantidade alvo"));
        meta.setGirosRecompensa(validarInteiroPositivo(request.girosRecompensa(), "Giros recompensa"));
        meta.setOrdem(validarInteiroNaoNegativo(request.ordem(), "Ordem"));
        aplicarAtiva(meta, request.ativa());
    }

    private void aplicarAtiva(RoletaMeta meta, Boolean ativa) {
        boolean ativaAtual = meta.getAtiva();
        boolean novaAtiva = ativa == null || ativa;
        meta.setAtiva(novaAtiva);
        if (meta.getStatus() == RoletaMetaStatus.CONCLUIDA) {
            return;
        }
        if (!novaAtiva) {
            meta.setStatus(RoletaMetaStatus.PAUSADA);
            return;
        }
        if (ativaAtual && meta.getStatus() != RoletaMetaStatus.PAUSADA) {
            return;
        }
        meta.setStatus(meta.getProgressoAtual() > 0
                ? RoletaMetaStatus.EM_ANDAMENTO
                : RoletaMetaStatus.NAO_INICIADA);
    }

    private void validarAlteracaoNumericaMetaConcluida(
            boolean concluida,
            Integer novoValor,
            Integer valorAtual,
            String campo
    ) {
        if (concluida && !novoValor.equals(valorAtual)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    campo + " nao pode ser alterado em meta concluida"
            );
        }
    }

    private Optional<RoletaMeta> buscarMetaAtualForUpdate() {
        return roletaMetaRepository.findMetasAtivasDisponiveisForUpdate(STATUS_IGNORADOS_META_ATUAL)
                .stream()
                .findFirst();
    }

    private void iniciarProximaMeta(LocalDateTime agora) {
        buscarMetaAtualForUpdate().ifPresent(proxima -> {
            proxima.iniciar(agora);
            roletaMetaRepository.save(proxima);
        });
    }

    private void concederGirosDaMeta(RoletaMeta meta) {
        int giros = meta.getGirosRecompensa();
        if (giros <= 0) {
            return;
        }

        List<RoletaParticipante> participantes = roletaParticipanteRepository.findAll();
        participantes.forEach(participante -> {
            boolean creditado = creditarGiros(
                    participante,
                    giros,
                    "META_GRUPO:" + meta.getId() + ":" + participante.getUsuario().getId()
            );
            if (creditado) {
                roletaParticipanteRepository.save(participante);
            }
        });
    }

    private boolean creditarGiros(
            RoletaParticipante participante,
            Integer quantidade,
            String chaveEvento
    ) {
        int giros = Math.max(0, quantidade == null ? 0 : quantidade);
        if (giros <= 0 || chaveEvento == null || chaveEvento.isBlank()) {
            return false;
        }
        if (roletaGiroCreditoRepository.existsByChaveEvento(chaveEvento)) {
            return false;
        }

        try {
            roletaGiroCreditoRepository.saveAndFlush(new RoletaGiroCredito(
                    participante,
                    chaveEvento,
                    giros
            ));
        } catch (DataIntegrityViolationException exception) {
            return false;
        }

        participante.adicionarGiros(giros);
        return true;
    }

    private RoletaMeta buscarMeta(Long id) {
        return roletaMetaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Meta da roleta nao encontrada"
                ));
    }

    private void validarRequest(RoletaMetaRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da meta sao obrigatorios");
        }
    }

    private String validarTitulo(String titulo) {
        if (titulo == null || titulo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Titulo da meta e obrigatorio");
        }

        return titulo.trim();
    }

    private int validarInteiroPositivo(Integer valor, String campo) {
        if (valor == null || valor < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, campo + " deve ser maior que zero");
        }

        return valor;
    }

    private int validarInteiroNaoNegativo(Integer valor, String campo) {
        if (valor == null || valor < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, campo + " nao pode ser negativa");
        }

        return valor;
    }
}
