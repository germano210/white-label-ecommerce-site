package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.RoletaConfig;
import com.whiteLabel.backend.domain.RoletaConvite;
import com.whiteLabel.backend.domain.RoletaConviteStatus;
import com.whiteLabel.backend.domain.RoletaGiroCredito;
import com.whiteLabel.backend.domain.RoletaParticipante;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.repository.RoletaConfigRepository;
import com.whiteLabel.backend.repository.RoletaConviteRepository;
import com.whiteLabel.backend.repository.RoletaGiroCreditoRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Optional;

@Service
public class RoletaIndicacaoRecompensaService {

    private static final Long CONFIG_ID = 1L;

    private final RoletaConfigRepository roletaConfigRepository;
    private final RoletaParticipanteRepository roletaParticipanteRepository;
    private final RoletaConviteRepository roletaConviteRepository;
    private final RoletaGiroCreditoRepository roletaGiroCreditoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MissaoSemanalService missaoSemanalService;
    private final RoletaInteracaoService roletaInteracaoService;
    private final SecureRandom secureRandom;

    public RoletaIndicacaoRecompensaService(
            RoletaConfigRepository roletaConfigRepository,
            RoletaParticipanteRepository roletaParticipanteRepository,
            RoletaConviteRepository roletaConviteRepository,
            RoletaGiroCreditoRepository roletaGiroCreditoRepository,
            UsuarioRepository usuarioRepository,
            MissaoSemanalService missaoSemanalService,
            RoletaInteracaoService roletaInteracaoService
    ) {
        this.roletaConfigRepository = roletaConfigRepository;
        this.roletaParticipanteRepository = roletaParticipanteRepository;
        this.roletaConviteRepository = roletaConviteRepository;
        this.roletaGiroCreditoRepository = roletaGiroCreditoRepository;
        this.usuarioRepository = usuarioRepository;
        this.missaoSemanalService = missaoSemanalService;
        this.roletaInteracaoService = roletaInteracaoService;
        this.secureRandom = new SecureRandom();
    }

    @Transactional
    public void processarConversao(IndicacaoConversao conversao) {
        if (conversao == null
                || conversao.indicador() == null
                || conversao.indicado() == null
                || mesmoUsuario(conversao.indicador(), conversao.indicado())) {
            return;
        }

        RoletaConfig config = obterConfig();
        RoletaParticipante participanteIndicador = garantirParticipanteIndicador(
                conversao.indicador(),
                config,
                conversao.codigo()
        );
        RoletaConvite convite = buscarOuCriarConvite(conversao, config);
        String chaveEvento = "CONVITE:" + conversao.indicado().getId();

        if (jaCreditouConvite(chaveEvento, convite)) {
            return;
        }

        boolean creditado = creditarGiros(
                participanteIndicador,
                convite.getGirosConcedidos(),
                chaveEvento
        );
        if (creditado) {
            participanteIndicador.incrementarConvitesConvertidos();
            roletaParticipanteRepository.save(participanteIndicador);
            missaoSemanalService.registrarAcao(
                    conversao.indicador(),
                    MissaoTipoAcao.CONVIDAR_PESSOAS.name()
            );
            roletaInteracaoService.registrarIndicacaoConvertida(
                    conversao.indicador(),
                    conversao.indicado()
            );
        }
    }

    private RoletaConvite buscarOuCriarConvite(IndicacaoConversao conversao, RoletaConfig config) {
        Optional<RoletaConvite> existente =
                roletaConviteRepository.findByUsuarioIndicadoId(conversao.indicado().getId());
        if (existente.isPresent()) {
            RoletaConvite convite = existente.get();
            convite.sincronizarComIndicacaoCentral(
                    conversao.codigo(),
                    conversao.indicador()
            );
            if (convite.getGirosConcedidos() <= 0) {
                convite.setGirosConcedidos(sortearGirosPorConvite(config));
            }
            return roletaConviteRepository.save(convite);
        }

        try {
            return roletaConviteRepository.saveAndFlush(new RoletaConvite(
                    conversao.codigo(),
                    conversao.indicador(),
                    conversao.indicado(),
                    RoletaConviteStatus.CONVERTIDO,
                    sortearGirosPorConvite(config)
            ));
        } catch (DataIntegrityViolationException exception) {
            return roletaConviteRepository.findByUsuarioIndicadoId(conversao.indicado().getId())
                    .orElseThrow(() -> exception);
        }
    }

    private RoletaParticipante garantirParticipanteIndicador(
            Usuario indicador,
            RoletaConfig config,
            String codigo
    ) {
        RoletaParticipante participante = roletaParticipanteRepository
                .findByUsuarioIdForUpdate(indicador.getId())
                .orElseGet(() -> criarParticipanteIndicador(indicador, codigo));

        boolean recebeuInicial = creditarGiros(
                participante,
                config.getGirosIniciais(),
                "INICIAL:" + indicador.getId()
        );
        if (recebeuInicial) {
            roletaParticipanteRepository.save(participante);
        }

        return participante;
    }

    private RoletaParticipante criarParticipanteIndicador(Usuario indicador, String codigo) {
        Usuario usuarioBloqueado = usuarioRepository.findByIdForUpdate(indicador.getId())
                .orElse(indicador);
        try {
            return roletaParticipanteRepository.saveAndFlush(new RoletaParticipante(
                    usuarioBloqueado,
                    codigoConvite(usuarioBloqueado, codigo),
                    0
            ));
        } catch (DataIntegrityViolationException exception) {
            return roletaParticipanteRepository.findByUsuarioId(indicador.getId())
                    .orElseThrow(() -> exception);
        }
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

    private boolean jaCreditouConvite(String chaveEvento, RoletaConvite convite) {
        return roletaGiroCreditoRepository.existsByChaveEvento(chaveEvento)
                || (convite.getId() != null
                && roletaGiroCreditoRepository.existsByChaveEvento("CONVITE:" + convite.getId()));
    }

    private int sortearGirosPorConvite(RoletaConfig config) {
        int minimo = config.getGirosPorConviteMin();
        int maximo = config.getGirosPorConviteMax();
        if (maximo <= minimo) {
            return minimo;
        }

        return secureRandom.nextInt(maximo - minimo + 1) + minimo;
    }

    private RoletaConfig obterConfig() {
        return roletaConfigRepository.findById(CONFIG_ID)
                .orElseGet(() -> {
                    RoletaConfig config = new RoletaConfig();
                    config.setId(CONFIG_ID);
                    return roletaConfigRepository.save(config);
                });
    }

    private String codigoConvite(Usuario usuario, String codigoRecebido) {
        if (usuario.getCodigoIndicacao() != null && !usuario.getCodigoIndicacao().isBlank()) {
            return usuario.getCodigoIndicacao();
        }

        return codigoRecebido;
    }

    private boolean mesmoUsuario(Usuario indicador, Usuario indicado) {
        return indicador.getId() != null && indicador.getId().equals(indicado.getId());
    }
}
