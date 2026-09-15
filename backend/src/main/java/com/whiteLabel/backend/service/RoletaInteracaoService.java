package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.RoletaConfig;
import com.whiteLabel.backend.domain.RoletaGiro;
import com.whiteLabel.backend.domain.RoletaGiroCredito;
import com.whiteLabel.backend.domain.RoletaInteracao;
import com.whiteLabel.backend.domain.RoletaInteracaoTipo;
import com.whiteLabel.backend.domain.RoletaNivel;
import com.whiteLabel.backend.domain.RoletaParticipante;
import com.whiteLabel.backend.domain.RoletaPremio;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.RoletaNotificacaoResponse;
import com.whiteLabel.backend.repository.RoletaConfigRepository;
import com.whiteLabel.backend.repository.RoletaGiroCreditoRepository;
import com.whiteLabel.backend.repository.RoletaInteracaoRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class RoletaInteracaoService {

    private static final Long CONFIG_ID = 1L;
    private static final String NOME_ANONIMO = "Anônimo";

    private final RoletaInteracaoRepository roletaInteracaoRepository;
    private final RoletaMetaService roletaMetaService;
    private final RoletaConfigRepository roletaConfigRepository;
    private final RoletaParticipanteRepository roletaParticipanteRepository;
    private final RoletaGiroCreditoRepository roletaGiroCreditoRepository;

    public RoletaInteracaoService(
            RoletaInteracaoRepository roletaInteracaoRepository,
            RoletaMetaService roletaMetaService,
            RoletaConfigRepository roletaConfigRepository,
            RoletaParticipanteRepository roletaParticipanteRepository,
            RoletaGiroCreditoRepository roletaGiroCreditoRepository
    ) {
        this.roletaInteracaoRepository = roletaInteracaoRepository;
        this.roletaMetaService = roletaMetaService;
        this.roletaConfigRepository = roletaConfigRepository;
        this.roletaParticipanteRepository = roletaParticipanteRepository;
        this.roletaGiroCreditoRepository = roletaGiroCreditoRepository;
    }

    @Transactional(readOnly = true)
    public List<RoletaNotificacaoResponse> listarNotificacoes() {
        return roletaInteracaoRepository.findTop20ByOrderByCriadoEmDescIdDesc()
                .stream()
                .map(RoletaNotificacaoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listarUltimosEventos() {
        return roletaInteracaoRepository.findTop10ByOrderByCriadoEmDescIdDesc()
                .stream()
                .map(RoletaInteracao::getTextoSnapshot)
                .toList();
    }

    @Transactional
    public void registrarGiroRoleta(Usuario usuario, RoletaGiro giro) {
        registrar(
                RoletaInteracaoTipo.GIRAR_ROLETA,
                usuario,
                null,
                null,
                null,
                null,
                BigDecimal.ZERO,
                nomeUsuario(usuario) + " girou a roleta",
                true,
                chave("GIRAR_ROLETA", giro == null ? null : giro.getId())
        );
    }

    @Transactional
    public void registrarPremioRecebido(
            Usuario usuario,
            RoletaNivel nivel,
            RoletaPremio premio,
            RoletaGiro giro
    ) {
        String nomeNivel = nomeNivel(nivel);
        registrar(
                RoletaInteracaoTipo.RECEBER_PREMIO,
                usuario,
                null,
                null,
                nivel,
                premio,
                giro == null ? BigDecimal.ZERO : giro.getValorPremio(),
                nomeUsuario(usuario) + " tirou " + nomeNivel,
                false,
                chave("RECEBER_PREMIO", giro == null ? null : giro.getId())
        );
    }

    @Transactional
    public void registrarUsoPremio(Usuario usuario, RoletaGiro giro, Pedido pedido) {
        if (giro == null || pedido == null) {
            return;
        }

        registrar(
                RoletaInteracaoTipo.USAR_PREMIO,
                usuario,
                null,
                pedido.getProduto(),
                giro.getNivel(),
                giro.getPremio(),
                giro.getValorPremio(),
                nomeUsuario(usuario) + " usou um prêmio",
                false,
                "USAR_PREMIO:" + pedido.getId() + ":" + giro.getId()
        );
    }

    @Transactional
    public void registrarResgateItem(Pedido pedido) {
        if (pedido == null || pedido.getUsuario() == null || pedido.getProduto() == null) {
            return;
        }

        Produto produto = pedido.getProduto();
        registrar(
                RoletaInteracaoTipo.RESGATAR_ITEM,
                pedido.getUsuario(),
                null,
                produto,
                null,
                null,
                pedido.getValorTotal(),
                nomeUsuario(pedido.getUsuario()) + " resgatou " + nomeProduto(produto),
                true,
                chave("RESGATAR_ITEM", pedido.getId())
        );
    }

    @Transactional
    public void registrarIndicacaoConvertida(Usuario indicador, Usuario indicado) {
        if (indicador == null || indicado == null) {
            return;
        }

        registrar(
                RoletaInteracaoTipo.INDICACAO_CONVERTIDA,
                indicador,
                indicado,
                null,
                null,
                null,
                BigDecimal.ZERO,
                nomeUsuario(indicador) + " indicou " + nomeUsuario(indicado),
                true,
                chave("INDICACAO_CONVERTIDA", indicado.getId())
        );
    }

    @Transactional
    public void registrarSaque(Usuario usuario, BigDecimal valor) {
        registrar(
                RoletaInteracaoTipo.SACAR_VALOR,
                usuario,
                null,
                null,
                null,
                null,
                valor,
                nomeUsuario(usuario) + " sacou",
                true,
                null
        );
    }

    private void registrar(
            RoletaInteracaoTipo tipo,
            Usuario usuario,
            Usuario usuarioSecundario,
            Produto produto,
            RoletaNivel nivel,
            RoletaPremio premio,
            BigDecimal valor,
            String texto,
            boolean contaParaMeta,
            String chaveEvento
    ) {
        if (chaveEvento != null && roletaInteracaoRepository.findByChaveEvento(chaveEvento).isPresent()) {
            return;
        }

        RoletaInteracao interacao = new RoletaInteracao(
                tipo,
                usuario,
                nomeUsuarioSnapshot(usuario),
                usuarioSecundario,
                nomeUsuarioSnapshot(usuarioSecundario),
                produto,
                nomeProdutoNullable(produto),
                nivel,
                nomeNivelNullable(nivel),
                nivel == null ? null : nivel.getCorHex(),
                premio,
                valor,
                texto,
                contaParaMeta,
                chaveEvento
        );

        try {
            roletaInteracaoRepository.saveAndFlush(interacao);
        } catch (DataIntegrityViolationException exception) {
            if (chaveEvento != null && roletaInteracaoRepository.findByChaveEvento(chaveEvento).isPresent()) {
                return;
            }
            throw exception;
        }

        if (contaParaMeta) {
            registrarAcaoGrupo();
        }
    }

    private void registrarAcaoGrupo() {
        if (roletaMetaService.possuiMetasConfiguradas()) {
            roletaMetaService.registrarAcaoGrupo();
            return;
        }

        RoletaConfig config = roletaConfigRepository.findByIdForUpdate(CONFIG_ID).orElse(null);
        if (config == null) {
            return;
        }

        int meta = config.getMetaGrupo();
        int progresso = config.getProgressoGrupo() + 1;

        if (progresso >= meta) {
            config.setProgressoGrupo(progresso % meta);
            int ciclo = config.avancarCicloMetaGrupo();
            int bonus = config.getGirosBonusGrupo();
            if (bonus > 0) {
                List<RoletaParticipante> participantes = roletaParticipanteRepository.findAll();
                participantes.forEach(participante -> creditarGiros(
                        participante,
                        bonus,
                        "META_GRUPO:" + ciclo + ":" + participante.getUsuario().getId()
                ));
                roletaParticipanteRepository.saveAll(participantes);
            }
        } else {
            config.setProgressoGrupo(progresso);
        }

        roletaConfigRepository.save(config);
    }

    private void creditarGiros(
            RoletaParticipante participante,
            Integer quantidade,
            String chaveEvento
    ) {
        int total = Math.max(0, quantidade == null ? 0 : quantidade);
        if (total <= 0 || roletaGiroCreditoRepository.existsByChaveEvento(chaveEvento)) {
            return;
        }

        participante.adicionarGiros(total);
        roletaGiroCreditoRepository.save(new RoletaGiroCredito(
                participante,
                chaveEvento,
                total
        ));
    }

    private String chave(String tipo, Object id) {
        return id == null ? null : tipo + ":" + id;
    }

    private String nomeUsuario(Usuario usuario) {
        String nome = nomeUsuarioNullable(usuario);
        return nome == null ? NOME_ANONIMO : nome;
    }

    private String nomeUsuarioSnapshot(Usuario usuario) {
        return usuario == null ? null : nomeUsuario(usuario);
    }

    private String nomeUsuarioNullable(Usuario usuario) {
        if (usuario == null || usuario.getNome() == null || usuario.getNome().isBlank()) {
            return null;
        }
        return usuario.getNome().trim();
    }

    private String nomeProduto(Produto produto) {
        String nome = nomeProdutoNullable(produto);
        return nome == null ? "um item" : nome;
    }

    private String nomeProdutoNullable(Produto produto) {
        if (produto == null || produto.getNome() == null || produto.getNome().isBlank()) {
            return null;
        }
        return produto.getNome().trim();
    }

    private String nomeNivel(RoletaNivel nivel) {
        String nome = nomeNivelNullable(nivel);
        return nome == null ? "um prêmio" : nome;
    }

    private String nomeNivelNullable(RoletaNivel nivel) {
        if (nivel == null || nivel.getNome() == null || nivel.getNome().isBlank()) {
            return null;
        }
        return nivel.getNome().trim();
    }
}
