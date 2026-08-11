package com.whiteLabel.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoCiclo;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.RoletaConfig;
import com.whiteLabel.backend.domain.RoletaGiroCredito;
import com.whiteLabel.backend.domain.RoletaNivel;
import com.whiteLabel.backend.domain.RoletaOpcao;
import com.whiteLabel.backend.domain.RoletaGiroStatus;
import com.whiteLabel.backend.domain.RoletaPremio;
import com.whiteLabel.backend.domain.RoletaProduto;
import com.whiteLabel.backend.domain.RoletaTipoPremio;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.dto.InfinitePayLinkRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkResponse;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PedidoItemRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.RoletaConfigRepository;
import com.whiteLabel.backend.repository.RoletaConviteRepository;
import com.whiteLabel.backend.repository.RoletaGiroCreditoRepository;
import com.whiteLabel.backend.repository.RoletaGiroRepository;
import com.whiteLabel.backend.repository.RoletaNivelRepository;
import com.whiteLabel.backend.repository.RoletaOpcaoRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
import com.whiteLabel.backend.repository.RoletaPremioRepository;
import com.whiteLabel.backend.repository.RoletaProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoSemanalRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import com.whiteLabel.backend.service.InfinitePayClient;
import com.whiteLabel.backend.service.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(RoletaControllerTest.InfinitePayTestConfig.class)
class RoletaControllerTest {

    private static final String WEBHOOK_SECRET = "test-payment-webhook-secret";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoletaConviteRepository roletaConviteRepository;

    @Autowired
    private RoletaGiroRepository roletaGiroRepository;

    @Autowired
    private RoletaGiroCreditoRepository roletaGiroCreditoRepository;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private RoletaNivelRepository roletaNivelRepository;

    @Autowired
    private RoletaOpcaoRepository roletaOpcaoRepository;

    @Autowired
    private RoletaPremioRepository roletaPremioRepository;

    @Autowired
    private RoletaProdutoRepository roletaProdutoRepository;

    @Autowired
    private RoletaParticipanteRepository roletaParticipanteRepository;

    @Autowired
    private RoletaConfigRepository roletaConfigRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private MissaoRepository missaoRepository;

    @Autowired
    private UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CapturingInfinitePayClient infinitePayClient;

    @BeforeEach
    void setUp() {
        limparDados();
        infinitePayClient.reset();
    }

    @AfterEach
    void tearDown() {
        limparDados();
        infinitePayClient.reset();
    }

    @Test
    void shouldExposePublicRoletaStatus() throws Exception {
        RoletaNivel nivelComum = criarNivel("Grau Militar", 1, "#4b69ff", "1.00000000", true);
        RoletaNivel nivelRaro = criarNivel("Restrito", 2, "#8847ff", "0.20000000", true);
        criarNivel("Inativo", 3, "#d32ce6", "0.04000000", false);
        criarOpcao("Nivel 2", 2, 0, RoletaTipoPremio.DESCONTO_VALOR, "7.00", "7.00", 10, true);
        criarOpcao("Nivel 1", 1, 0, RoletaTipoPremio.DESCONTO_VALOR, "3.00", "3.00", 10, true);
        criarOpcao("Inativa", 1, 1, RoletaTipoPremio.DESCONTO_VALOR, "9.00", "9.00", 10, false);
        criarPremio("Premio Nivel 2", nivelRaro, 0, RoletaTipoPremio.DESCONTO_VALOR, "7.00", "2.00000000", true);
        criarPremio("Premio Nivel 1", nivelComum, 0, RoletaTipoPremio.DESCONTO_VALOR, "3.00", "1.00000000", true);
        criarPremio("Premio Inativo", nivelComum, 1, RoletaTipoPremio.DESCONTO_VALOR, "9.00", "1.00000000", false);

        mockMvc.perform(get("/api/roleta").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativa").value(true))
                .andExpect(jsonPath("$.metaGrupo").value(20))
                .andExpect(jsonPath("$.progressoGrupo").value(0))
                .andExpect(jsonPath("$.girosBonusGrupo").value(5))
                .andExpect(jsonPath("$.notificacoes.length()").value(0))
                .andExpect(jsonPath("$.girosTotaisObtidos").value(0))
                .andExpect(jsonPath("$.girosDisponiveis").value(0))
                .andExpect(jsonPath("$.niveis.length()").value(2))
                .andExpect(jsonPath("$.niveis[0].nome").value("Grau Militar"))
                .andExpect(jsonPath("$.niveis[0].chancePercentual").value(83.3333))
                .andExpect(jsonPath("$.niveis[0].quantidadePremiosAtivos").value(1))
                .andExpect(jsonPath("$.niveis[0].pesoRelativo").doesNotExist())
                .andExpect(jsonPath("$.niveis[1].nome").value("Restrito"))
                .andExpect(jsonPath("$.niveis[1].quantidadePremiosAtivos").value(1))
                .andExpect(jsonPath("$.opcoes.length()").value(0))
                .andExpect(jsonPath("$.premios.length()").value(2))
                .andExpect(jsonPath("$.premios[0].titulo").value("Premio Nivel 1"))
                .andExpect(jsonPath("$.premios[0].pesoInterno").doesNotExist())
                .andExpect(jsonPath("$.premios[1].titulo").value("Premio Nivel 2"))
                .andExpect(jsonPath("$.premiosEmJogo.length()").value(greaterThanOrEqualTo(1)));
    }

    @Test
    void shouldReturnEmptyPublicRoletaWithoutCreatingDefaultLevels() throws Exception {
        mockMvc.perform(get("/api/roleta").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis.length()").value(0))
                .andExpect(jsonPath("$.opcoes.length()").value(0))
                .andExpect(jsonPath("$.premios.length()").value(0));

        assertEquals(0, roletaNivelRepository.count());
        assertEquals(0, roletaOpcaoRepository.count());
        assertEquals(0, roletaPremioRepository.count());
        assertEquals(0, roletaConfigRepository.count());
    }

    @Test
    void shouldRequireAuthToSpin() throws Exception {
        mockMvc.perform(post("/api/roleta/girar").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectSpinWithoutActivePrizeLevels() throws Exception {
        Usuario usuario = criarUsuario("Cliente Sem Fatia", "551199992010");

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Roleta sem niveis ativos com premios"));

        assertEquals(0, roletaNivelRepository.count());
    }

    @Test
    void shouldCreateParticipantAndConsumeSpin() throws Exception {
        RoletaPremio premioConfigurado = criarPremioPadrao();
        Usuario usuario = criarUsuario("Cliente Roleta", "551199992001");

        mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.girosTotaisObtidos").value(8))
                .andExpect(jsonPath("$.girosDisponiveis").value(8))
                .andExpect(jsonPath("$.valorDisponivelResgate").value(0.00))
                .andExpect(jsonPath("$.valorTotalResgatado").value(0.00))
                .andExpect(jsonPath("$.codigoConvite").isNotEmpty())
                .andExpect(jsonPath("$.urlConvite").isNotEmpty())
                .andExpect(jsonPath("$.convitesConvertidos").value(0))
                .andExpect(jsonPath("$.girosPorConvite").value(2))
                .andExpect(jsonPath("$.girosPorConviteMin").value(2))
                .andExpect(jsonPath("$.girosPorConviteMax").value(5));

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premio.valorDesconto").exists())
                .andExpect(jsonPath("$.premioSorteado.valorPremio").value(10.00))
                .andExpect(jsonPath("$.premioSorteado.premioConfiguradoId").value(premioConfigurado.getId()))
                .andExpect(jsonPath("$.premioSorteado.nivelId").value(premioConfigurado.getNivel().getId()))
                .andExpect(jsonPath("$.nivelSorteado.id").value(premioConfigurado.getNivel().getId()))
                .andExpect(jsonPath("$.corNivel").value("#4b69ff"))
                .andExpect(jsonPath("$.premioConfiguradoSorteado.id").value(premioConfigurado.getId()))
                .andExpect(jsonPath("$.valor").value(10.00))
                .andExpect(jsonPath("$.girosDisponiveis").value(7))
                .andExpect(jsonPath("$.roleta.girosDisponiveis").value(7))
                .andExpect(jsonPath("$.roleta.girosTotaisObtidos").value(8))
                .andExpect(jsonPath("$.premioAtual.valorPremio").value(10.00))
                .andExpect(jsonPath("$.roleta.premioAtual.valorPremio").value(10.00))
                .andExpect(jsonPath("$.roleta.premioPendente.valorPremio").value(10.00))
                .andExpect(jsonPath("$.roleta.valorDisponivelResgate").value(0.00))
                .andExpect(jsonPath("$.roleta.progressoGrupo").value(1));
    }

    @Test
    void shouldNotIncreaseInitialSpinsWhenOpeningRoletaRepeatedly() throws Exception {
        Usuario usuario = criarUsuario("Cliente Reload Roleta", "551199992032");

        for (int tentativa = 0; tentativa < 10; tentativa++) {
            mockMvc.perform(get("/api/roleta")
                            .header("Authorization", bearer(usuario))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.girosTotaisObtidos").value(8))
                    .andExpect(jsonPath("$.girosDisponiveis").value(8));
        }

        var participante = roletaParticipanteRepository.findByUsuarioId(usuario.getId()).orElseThrow();
        assertEquals(8, participante.getGirosTotaisObtidos());
        assertEquals(8, participante.getGirosDisponiveis());
        assertEquals(1, roletaGiroCreditoRepository.countByChaveEvento("INICIAL:" + usuario.getId()));
    }

    @Test
    void shouldKeepSpinsStableOnRepeatedFocusAndReloadCalls() throws Exception {
        Usuario usuario = criarUsuario("Cliente Foco Roleta", "551199992033");

        mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.girosDisponiveis").value(8));

        for (int tentativa = 0; tentativa < 5; tentativa++) {
            mockMvc.perform(get("/api/roleta/convites")
                            .header("Authorization", bearer(usuario))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/roleta")
                            .header("Authorization", bearer(usuario))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.girosTotaisObtidos").value(8))
                    .andExpect(jsonPath("$.girosDisponiveis").value(8));
        }

        assertEquals(1, roletaGiroCreditoRepository.countByChaveEvento("INICIAL:" + usuario.getId()));
    }

    @Test
    void shouldCreateOnlyOneParticipantWhenRoletaRequestsArriveTogether() throws Exception {
        RoletaConfig config = new RoletaConfig();
        config.setId(1L);
        roletaConfigRepository.save(config);
        Usuario usuario = criarUsuario("Cliente Concorrente Roleta", "551199992038");
        String token = bearer(usuario);
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<Integer> statusFuture = executor.submit(() -> {
                largada.await();
                return mockMvc.perform(get("/api/roleta")
                                .header("Authorization", token)
                                .accept(MediaType.APPLICATION_JSON))
                        .andReturn()
                        .getResponse()
                        .getStatus();
            });
            Future<Integer> convitesFuture = executor.submit(() -> {
                largada.await();
                return mockMvc.perform(get("/api/roleta/convites")
                                .header("Authorization", token)
                                .accept(MediaType.APPLICATION_JSON))
                        .andReturn()
                        .getResponse()
                        .getStatus();
            });

            largada.countDown();

            assertEquals(200, statusFuture.get(5, TimeUnit.SECONDS));
            assertEquals(200, convitesFuture.get(5, TimeUnit.SECONDS));
        } finally {
            executor.shutdownNow();
        }

        assertEquals(1, roletaParticipanteRepository.count());
        assertEquals(1, roletaGiroCreditoRepository.countByChaveEvento("INICIAL:" + usuario.getId()));
        var participante = roletaParticipanteRepository.findByUsuarioId(usuario.getId()).orElseThrow();
        assertEquals(8, participante.getGirosTotaisObtidos());
        assertEquals(8, participante.getGirosDisponiveis());
    }

    @Test
    void shouldCreditExtraSpinPrizeThroughUniqueCreditEvent() throws Exception {
        RoletaNivel nivel = criarNivel("Premio Giro", 1, "#4b69ff", "1.00000000", true);
        criarPremio("Giro Extra", nivel, 0, RoletaTipoPremio.GIRO_EXTRA, "2.00", "1.00000000", true);
        Usuario usuario = criarUsuario("Cliente Premio Giro", "551199992037");

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.girosDisponiveis").value(9))
                .andExpect(jsonPath("$.roleta.girosTotaisObtidos").value(10));

        var giro = roletaGiroRepository.findAll().get(0);
        assertEquals(1, roletaGiroCreditoRepository.countByChaveEvento("PREMIO_GIRO:" + giro.getId()));
    }

    @Test
    void shouldRegisterInviteConversionOnlyOnce() throws Exception {
        Usuario indicador = criarUsuario("Indicador Roleta", "551199992002");
        Usuario indicado = criarUsuario("Indicado Roleta", "551199992003");

        String response = mockMvc.perform(get("/api/roleta/convites")
                        .header("Authorization", bearer(indicador))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoConvite").isNotEmpty())
                .andExpect(jsonPath("$.urlConvite").isNotEmpty())
                .andExpect(jsonPath("$.girosPorConviteMin").value(2))
                .andExpect(jsonPath("$.girosPorConviteMax").value(5))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String codigo = response.replaceAll(".*\"codigoConvite\":\"([^\"]+)\".*", "$1");

        String payload = """
                {
                  "codigoConvite": "%s"
                }
                """.formatted(codigo);

        mockMvc.perform(post("/api/roleta/convites")
                        .header("Authorization", bearer(indicado))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/roleta/convites")
                        .header("Authorization", bearer(indicado))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/roleta/convites")
                        .header("Authorization", bearer(indicador))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidadeConvertida").value(1))
                .andExpect(jsonPath("$.convitesConvertidos").value(1))
                .andExpect(jsonPath("$.girosPorConvite").value(2))
                .andExpect(jsonPath("$.girosPorConviteMin").value(2))
                .andExpect(jsonPath("$.girosPorConviteMax").value(5));

        mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(indicador))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.convitesConvertidos").value(1))
                .andExpect(jsonPath("$.girosDisponiveis").value(greaterThanOrEqualTo(10)))
                .andExpect(jsonPath("$.girosDisponiveis").value(lessThanOrEqualTo(13)))
                .andExpect(jsonPath("$.girosTotaisObtidos").value(greaterThanOrEqualTo(10)))
                .andExpect(jsonPath("$.girosTotaisObtidos").value(lessThanOrEqualTo(13)))
                .andExpect(jsonPath("$.girosPorConviteMin").value(2))
                .andExpect(jsonPath("$.girosPorConviteMax").value(5));

        var convite = roletaConviteRepository.findAll().get(0);
        assertTrue(convite.getGirosConcedidos() >= 2);
        assertTrue(convite.getGirosConcedidos() <= 5);
        assertTrue(convite.getConvertidoEm() != null);
        assertEquals(1, roletaGiroCreditoRepository.countByChaveEvento("CONVITE:" + convite.getId()));
        assertEquals(1, roletaGiroCreditoRepository.countByChaveEventoStartingWith("CONVITE:"));
        var participanteIndicador = roletaParticipanteRepository.findByUsuarioId(indicador.getId())
                .orElseThrow();
        assertEquals(8 + convite.getGirosConcedidos(), participanteIndicador.getGirosDisponiveis());
        assertEquals(8 + convite.getGirosConcedidos(), participanteIndicador.getGirosTotaisObtidos());
    }

    @Test
    void shouldRegisterWeeklyInviteMissionWhenRoletaInviteConverts() throws Exception {
        Missao missao = criarMissaoSemanalConvite();
        Usuario indicador = criarUsuario("Indicador Missao", "551199992030");
        Usuario indicado = criarUsuario("Indicado Missao", "551199992031");
        String codigo = codigoConvite(indicador);

        mockMvc.perform(post("/api/roleta/convites")
                        .header("Authorization", bearer(indicado))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigoConvite": "%s"
                                }
                                """.formatted(codigo))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        var progresso = usuarioMissaoSemanalRepository.findAll().stream()
                .filter(item -> item.getUsuario().getId().equals(indicador.getId()))
                .filter(item -> item.getMissao().getId().equals(missao.getId()))
                .findFirst()
                .orElseThrow();

        assertEquals(1, progresso.getProgressoAtual());
        assertTrue(progresso.getConcluida());
    }

    @Test
    void shouldCreditReferralCommissionWhenInvitedUserPaymentIsConfirmed() throws Exception {
        Usuario indicador = criarUsuario("Indicador Comissao", "551199992032");
        Usuario indicado = criarUsuario("Indicado Comissao", "551199992033");
        String codigo = codigoConvite(indicador);

        mockMvc.perform(post("/api/roleta/convites")
                        .header("Authorization", bearer(indicado))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigoConvite": "%s"
                                }
                                """.formatted(codigo))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        Produto produto = criarProduto("Produto Comissao");
        produto.setPrecoVenda(new BigDecimal("100.00"));
        produto = produtoRepository.save(produto);

        String checkoutResponse = mockMvc.perform(post("/api/checkout/produtos/{produtoId}", produto.getId())
                        .header("Authorization", bearer(indicado))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String checkoutId = objectMapper.readTree(checkoutResponse).path("checkoutId").asText();
        String payload = """
                {
                  "eventId": "evt_roleta_comissao",
                  "paymentId": "pay_roleta_comissao",
                  "checkoutId": "%s",
                  "status": "PAGO"
                }
                """.formatted(checkoutId);

        mockMvc.perform(post("/api/pagamentos/infinitepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGO"));

        assertEquals("5.00", roletaParticipanteRepository.findByUsuarioId(indicador.getId())
                .orElseThrow()
                .getValorDisponivelResgate()
                .toPlainString());
    }

    @Test
    void shouldReturnSameInviteCodeForSameUser() throws Exception {
        Usuario usuario = criarUsuario("Cliente Link", "551199992007");

        String primeiro = mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoConvite").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String segundo = mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String primeiroCodigo = primeiro.replaceAll(".*\"codigoConvite\":\"([^\"]+)\".*", "$1");
        String segundoCodigo = segundo.replaceAll(".*\"codigoConvite\":\"([^\"]+)\".*", "$1");

        assertEquals(primeiroCodigo, segundoCodigo);
        assertTrue(primeiro.contains("\"urlConvite\":\"http://localhost:5173/vip/roleta?ref="));
    }

    @Test
    void shouldRejectSelfInvite() throws Exception {
        Usuario usuario = criarUsuario("Cliente Self", "551199992008");
        String response = mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String codigo = response.replaceAll(".*\"codigoConvite\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(post("/api/roleta/convites")
                        .header("Authorization", bearer(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigoConvite": "%s"
                                }
                                """.formatted(codigo))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        assertEquals(0, roletaConviteRepository.count());
    }

    @Test
    void shouldPersistRescueValuesOnParticipant() throws Exception {
        criarPremioPadrao();
        Usuario usuario = criarUsuario("Cliente Valores", "551199992009");

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premioAtual.valorPremio").value(10.00))
                .andExpect(jsonPath("$.premioPendente.valorPremio").value(10.00))
                .andExpect(jsonPath("$.valorDisponivelResgate").value(0.00))
                .andExpect(jsonPath("$.valorTotalResgatado").value(0.00));

        assertEquals(1, roletaParticipanteRepository.count());
        assertEquals(0, roletaParticipanteRepository.findByUsuarioId(usuario.getId())
                .orElseThrow()
                .getValorDisponivelResgate()
                .compareTo(BigDecimal.ZERO));
    }

    @Test
    void shouldReplacePreviousPendingPrizeWhenSpinningAgain() throws Exception {
        criarPremioPadrao();
        Usuario usuario = criarUsuario("Cliente Substitui Premio", "551199992028");

        String primeiroGiro = mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premioAtual.status").value("PENDENTE"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long primeiroPremioId = objectMapper.readTree(primeiroGiro).path("premioAtual").path("id").asLong();

        String segundoGiro = mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premioAtual.status").value("PENDENTE"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long segundoPremioId = objectMapper.readTree(segundoGiro).path("premioAtual").path("id").asLong();

        assertEquals(RoletaGiroStatus.DESCARTADO, roletaGiroRepository.findById(primeiroPremioId)
                .orElseThrow()
                .getStatus());
        assertEquals(RoletaGiroStatus.PENDENTE, roletaGiroRepository.findById(segundoPremioId)
                .orElseThrow()
                .getStatus());
        long pendentes = roletaGiroRepository.findAll()
                .stream()
                .filter(giro -> giro.getUsuario().getId().equals(usuario.getId()))
                .filter(giro -> giro.getStatus() == RoletaGiroStatus.PENDENTE)
                .count();
        assertEquals(1, pendentes);
    }

    @Test
    void shouldCreateRoletaProductCheckoutWithCurrentPrizeDiscount() throws Exception {
        criarPremioPadrao();
        Usuario usuario = criarUsuario("Cliente Resgate", "551199992029");
        Produto produto = criarProduto("Calca Roleta Checkout");
        roletaProdutoRepository.save(new RoletaProduto(produto, 0));

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        var premioAtual = roletaGiroRepository.findTopByUsuarioIdAndStatusOrderByCriadoEmDesc(
                usuario.getId(),
                RoletaGiroStatus.PENDENTE
        ).orElseThrow();

        String response = mockMvc.perform(post("/api/roleta/produtos/{produtoId}/resgatar", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.checkoutUrl").value("https://checkout.infinitepay.com.br/teste-roleta"))
                .andExpect(jsonPath("$.status").value("AGUARDANDO_PAGAMENTO"))
                .andExpect(jsonPath("$.precoFinal").value(79.90))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long pedidoId = objectMapper.readTree(response).path("pedidoId").asLong();
        InfinitePayLinkRequest request = infinitePayClient.ultimaRequest;
        assertNotNull(request);
        assertEquals(7990L, request.items().get(0).price());
        assertEquals("Calca Roleta Checkout", request.items().get(0).description());

        var pedido = pedidoRepository.findById(pedidoId).orElseThrow();
        assertEquals("89.90", pedido.getPrecoOriginal().toPlainString());
        assertEquals("10.00", pedido.getDescontoAplicado().toPlainString());
        assertEquals("79.90", pedido.getPrecoFinal().toPlainString());

        Long roletaGiroId = jdbcTemplate.queryForObject(
                "select roleta_giro_id from pedidos where id = ?",
                Long.class,
                pedidoId
        );
        assertEquals(premioAtual.getId(), roletaGiroId);
    }

    @Test
    void shouldRejectRoletaCheckoutForProductOutsideRoleta() throws Exception {
        Usuario usuario = criarUsuario("Cliente Produto Fora", "551199992030");
        Produto produto = criarProduto("Produto Fora da Roleta");

        mockMvc.perform(post("/api/roleta/produtos/{produtoId}/resgatar", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Produto nao pertence aos produtos ativos da roleta"));

        assertEquals(0, pagamentoRepository.count());
        assertEquals(0, pedidoRepository.count());
    }

    @Test
    void shouldPreventUsingSameCurrentPrizeInMultipleCheckouts() throws Exception {
        criarPremioPadrao();
        Usuario usuario = criarUsuario("Cliente Reuso Premio", "551199992031");
        Produto produto = criarProduto("Saia Checkout");
        roletaProdutoRepository.save(new RoletaProduto(produto, 0));

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/roleta/produtos/{produtoId}/resgatar", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/roleta/produtos/{produtoId}/resgatar", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Premio atual ja esta vinculado a outro checkout"));

        assertEquals(1, pagamentoRepository.count());
        assertEquals(1, pedidoRepository.count());
    }

    @Test
    void shouldMarkCurrentPrizeAsUsedWhenRoletaCheckoutPaymentIsConfirmed() throws Exception {
        criarPremioPadrao();
        Usuario usuario = criarUsuario("Cliente Premio Usado", "551199992032");
        Produto produto = criarProduto("Vestido Pago");
        roletaProdutoRepository.save(new RoletaProduto(produto, 0));

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        String checkoutResponse = mockMvc.perform(post("/api/roleta/produtos/{produtoId}/resgatar", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var checkoutJson = objectMapper.readTree(checkoutResponse);
        String checkoutId = checkoutJson.path("checkoutId").asText();
        Long pedidoId = checkoutJson.path("pedidoId").asLong();
        Long roletaGiroId = jdbcTemplate.queryForObject(
                "select roleta_giro_id from pedidos where id = ?",
                Long.class,
                pedidoId
        );

        String payload = """
                {
                  "eventId": "evt_roleta_pago",
                  "paymentId": "pay_roleta_pago",
                  "checkoutId": "%s",
                  "status": "PAGO"
                }
                """.formatted(checkoutId);

        mockMvc.perform(post("/api/pagamentos/infinitepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGO"));

        assertEquals(RoletaGiroStatus.USADO, roletaGiroRepository.findById(roletaGiroId)
                .orElseThrow()
                .getStatus());
    }

    @Test
    void shouldRejectUserOnAdminRoleta() throws Exception {
        Usuario usuario = criarUsuario("Cliente Sem Admin", "551199992004");

        mockMvc.perform(get("/api/admin/roleta")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturnEmptyAdminRoletaWithoutCreatingDefaultLevels() throws Exception {
        Usuario admin = criarAdmin("551199992019");

        mockMvc.perform(get("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis.length()").value(0))
                .andExpect(jsonPath("$.opcoes.length()").value(0))
                .andExpect(jsonPath("$.premios.length()").value(0));

        assertEquals(0, roletaNivelRepository.count());
        assertEquals(0, roletaOpcaoRepository.count());
        assertEquals(0, roletaPremioRepository.count());
        assertEquals(0, roletaConfigRepository.count());
    }

    @Test
    void shouldNotExposeLegacyOptionsInAdminRoleta() throws Exception {
        Usuario admin = criarAdmin("551199992029");
        criarOpcao("Legado", 1, 0, RoletaTipoPremio.DESCONTO_VALOR, "5.00", "5.00", 10, true);

        mockMvc.perform(get("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.opcoes.length()").value(0));

        assertEquals(1, roletaOpcaoRepository.count());
    }

    @Test
    void shouldRejectAdminRoletaWithDuplicatedLevelOrder() throws Exception {
        Usuario admin = criarAdmin("551199992020");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "niveis": [
                                    {
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1,
                                      "ativo": true
                                    },
                                    {
                                      "nome": "Restrito",
                                      "corHex": "#8847ff",
                                      "ordem": 1,
                                      "pesoRelativo": 0.2,
                                      "ativo": true
                                    }
                                  ]
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ordem do nivel da roleta repetida: 1"));
    }

    @Test
    void shouldRejectAdminRoletaWithDuplicatedLevelName() throws Exception {
        Usuario admin = criarAdmin("551199992021");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "niveis": [
                                    {
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1,
                                      "ativo": true
                                    },
                                    {
                                      "nome": " grau militar ",
                                      "corHex": "#8847ff",
                                      "ordem": 2,
                                      "pesoRelativo": 0.2,
                                      "ativo": true
                                    }
                                  ]
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Nome do nivel da roleta repetido: grau militar"));
    }

    @Test
    void shouldIgnoreLegacyAdminOptionsPayload() throws Exception {
        Usuario admin = criarAdmin("551199992011");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "opcoes": [
                                    {
                                      "nivel": 1,
                                      "titulo": "Peso invalido",
                                      "tipoPremio": "DESCONTO_VALOR",
                                      "valorMinimo": 1.00,
                                      "valorMaximo": 1.00,
                                      "peso": 0,
                                      "ativa": true,
                                      "ordem": 0
                                    }
                                  ]
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.opcoes.length()").value(0));

        assertEquals(0, roletaOpcaoRepository.count());
    }

    @Test
    void shouldIgnoreLegacyInternalPrizeWeightAndGeneratePrizeTitle() throws Exception {
        Usuario admin = criarAdmin("551199992012");
        RoletaNivel nivel = criarNivel("Grau Militar", 1, "#4b69ff", "1.00000000", true);

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "premios": [
                                    {
                                      "nivelId": %d,
                                      "tipoPremio": "DESCONTO_VALOR",
                                      "valor": 1.00,
                                      "pesoInterno": 0,
                                      "ativo": true,
                                      "ordem": 0
                                    }
                                  ]
                                }
                                """.formatted(nivel.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premios.length()").value(0))
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(1))
                .andExpect(jsonPath("$.niveis[0].premios[0].titulo").value("R$ 1,00 OFF"))
                .andExpect(jsonPath("$.niveis[0].premios[0].pesoInterno").doesNotExist());

        assertEquals(new BigDecimal("1.00000000"), roletaPremioRepository.findAll().get(0).getPesoInterno());
    }

    @Test
    void shouldRejectAdminConfigWithInvalidDifficultyMultiplier() throws Exception {
        Usuario admin = criarAdmin("551199992014");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "multiplicadorDificuldadePadrao": 1.00
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Multiplicador de dificuldade deve ser maior que 1"));
    }

    @Test
    void shouldPreserveRawLevelWeightsFromAdminPayload() throws Exception {
        Usuario admin = criarAdmin("551199992017");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "multiplicadorDificuldadePadrao": 5.00,
                                  "niveis": [
                                    {
                                      "nome": "Peso Decimal",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1.2,
                                      "ativo": true
                                    },
                                    {
                                      "nome": "Peso Pequeno",
                                      "corHex": "#ffd700",
                                      "ordem": 2,
                                      "pesoRelativo": 0.00325,
                                      "ativo": true
                                    }
                                  ]
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis[0].pesoRelativo").value(1.2))
                .andExpect(jsonPath("$.niveis[1].pesoRelativo").value(0.00325))
                .andExpect(jsonPath("$.niveis[0].chancePercentual").value(99.7299))
                .andExpect(jsonPath("$.niveis[1].chancePercentual").value(0.2701));

        mockMvc.perform(get("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis[0].pesoRelativo").value(1.2))
                .andExpect(jsonPath("$.niveis[1].pesoRelativo").value(0.00325));

        List<RoletaNivel> niveis = roletaNivelRepository.findAllByOrderByOrdemAscIdAsc();
        assertEquals(new BigDecimal("1.20000000"), niveis.get(0).getPesoRelativo());
        assertEquals(new BigDecimal("0.00325000"), niveis.get(1).getPesoRelativo());
    }

    @Test
    void shouldKeepManualLevelWeightsWithoutAutomaticRedistribution() throws Exception {
        Usuario admin = criarAdmin("551199992016");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "multiplicadorDificuldadePadrao": 5.00,
                                  "usarPesosManuais": false,
                                  "niveis": [
                                    {
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1,
                                      "ativo": true
                                    },
                                    {
                                      "nome": "Restrito",
                                      "corHex": "#8847ff",
                                      "ordem": 2,
                                      "pesoRelativo": 0.2,
                                      "ativo": true
                                    },
                                    {
                                      "nome": "Classificado",
                                      "corHex": "#d32ce6",
                                      "ordem": 3,
                                      "pesoRelativo": 0.04,
                                      "ativo": true
                                    },
                                    {
                                      "nome": "Encoberto/Secreto",
                                      "corHex": "#eb4b4b",
                                      "ordem": 4,
                                      "pesoRelativo": 0.008,
                                      "ativo": true
                                    },
                                    {
                                      "nome": "Extremamente Raro/Ouro",
                                      "corHex": "#ffd700",
                                      "ordem": 5,
                                      "pesoRelativo": 0.00325,
                                      "ativo": true
                                    }
                                  ]
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis[0].pesoRelativo").value(1))
                .andExpect(jsonPath("$.niveis[1].pesoRelativo").value(0.2))
                .andExpect(jsonPath("$.niveis[2].pesoRelativo").value(0.04))
                .andExpect(jsonPath("$.niveis[3].pesoRelativo").value(0.008))
                .andExpect(jsonPath("$.niveis[4].pesoRelativo").value(0.00325))
                .andExpect(jsonPath("$.niveis[0].chancePercentual").value(79.9201))
                .andExpect(jsonPath("$.niveis[4].chancePercentual").value(0.2597));

        List<RoletaNivel> niveis = roletaNivelRepository.findAllByOrderByOrdemAscIdAsc();
        assertEquals(new BigDecimal("0.00325000"), niveis.get(4).getPesoRelativo());

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usarPesosManuais": false,
                                  "niveis": [
                                    {
                                      "id": %d,
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "ativo": true
                                    },
                                    {
                                      "id": %d,
                                      "nome": "Restrito",
                                      "corHex": "#8847ff",
                                      "ordem": 2,
                                      "ativo": true
                                    },
                                    {
                                      "id": %d,
                                      "nome": "Classificado",
                                      "corHex": "#d32ce6",
                                      "ordem": 3,
                                      "ativo": true
                                    },
                                    {
                                      "id": %d,
                                      "nome": "Encoberto/Secreto",
                                      "corHex": "#eb4b4b",
                                      "ordem": 4,
                                      "ativo": true
                                    },
                                    {
                                      "id": %d,
                                      "nome": "Extremamente Raro/Ouro",
                                      "corHex": "#ffd700",
                                      "ordem": 5,
                                      "ativo": true
                                    }
                                  ]
                                }
                                """.formatted(
                                niveis.get(0).getId(),
                                niveis.get(1).getId(),
                                niveis.get(2).getId(),
                                niveis.get(3).getId(),
                                niveis.get(4).getId()
                        ))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis[4].pesoRelativo").value(0.00325))
                .andExpect(jsonPath("$.niveis[4].chancePercentual").value(0.2597));

        assertEquals(
                new BigDecimal("0.00325000"),
                roletaNivelRepository.findAllByOrderByOrdemAscIdAsc().get(4).getPesoRelativo()
        );
    }

    @Test
    void shouldChoosePrizeUniformlyInsideSelectedLevelIgnoringInternalWeight() throws Exception {
        RoletaConfig config = new RoletaConfig();
        config.setId(1L);
        config.setGirosIniciais(200);
        config.setGiroDiarioQuantidade(0);
        roletaConfigRepository.save(config);

        RoletaNivel nivel = criarNivel("Nivel Unico", 1, "#4b69ff", "1.00000000", true);
        RoletaPremio premioPesoAlto = criarPremio(
                "Premio peso alto",
                nivel,
                0,
                RoletaTipoPremio.DESCONTO_VALOR,
                "3.00",
                "1000.00000000",
                true
        );
        RoletaPremio premioPesoBaixo = criarPremio(
                "Premio peso baixo",
                nivel,
                1,
                RoletaTipoPremio.DESCONTO_VALOR,
                "4.00",
                "1.00000000",
                true
        );
        Usuario usuario = criarUsuario("Cliente Premio Uniforme", "551199992018");

        Set<Long> premiosSorteados = new HashSet<>();
        for (int tentativa = 0; tentativa < 200 && premiosSorteados.size() < 2; tentativa++) {
            String response = mockMvc.perform(post("/api/roleta/girar")
                            .header("Authorization", bearer(usuario))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            JsonNode json = objectMapper.readTree(response);
            premiosSorteados.add(json.path("premioConfiguradoSorteado").path("id").asLong());
        }

        assertTrue(premiosSorteados.contains(premioPesoAlto.getId()));
        assertTrue(premiosSorteados.contains(premioPesoBaixo.getId()));
    }

    @Test
    void shouldRejectSpinWithoutAvailableSpins() throws Exception {
        criarPremioPadrao();
        RoletaConfig config = new RoletaConfig();
        config.setId(1L);
        config.setGirosIniciais(0);
        config.setGiroDiarioQuantidade(0);
        roletaConfigRepository.save(config);
        Usuario usuario = criarUsuario("Cliente Sem Giro", "551199992015");

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Usuario sem giros disponiveis"));
    }

    @Test
    void shouldCreditGroupGoalOnlyOnceForSameCycleAndParticipant() throws Exception {
        criarPremioPadrao();
        RoletaConfig config = new RoletaConfig();
        config.setId(1L);
        config.setMetaGrupo(1);
        config.setGirosBonusGrupo(5);
        config.setGiroDiarioQuantidade(0);
        roletaConfigRepository.save(config);
        Usuario usuarioQueGira = criarUsuario("Cliente Meta Grupo", "551199992034");
        Usuario usuarioJaCreditado = criarUsuario("Cliente Meta Ja Creditado", "551199992035");

        mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuarioQueGira))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuarioJaCreditado))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        var participanteJaCreditado = roletaParticipanteRepository
                .findByUsuarioId(usuarioJaCreditado.getId())
                .orElseThrow();
        roletaGiroCreditoRepository.save(new RoletaGiroCredito(
                participanteJaCreditado,
                "META_GRUPO:1:" + usuarioJaCreditado.getId(),
                5
        ));

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuarioQueGira))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roleta.progressoGrupo").value(0));

        var participanteQueGirou = roletaParticipanteRepository
                .findByUsuarioId(usuarioQueGira.getId())
                .orElseThrow();
        participanteJaCreditado = roletaParticipanteRepository
                .findByUsuarioId(usuarioJaCreditado.getId())
                .orElseThrow();

        assertEquals(12, participanteQueGirou.getGirosDisponiveis());
        assertEquals(13, participanteQueGirou.getGirosTotaisObtidos());
        assertEquals(8, participanteJaCreditado.getGirosDisponiveis());
        assertEquals(8, participanteJaCreditado.getGirosTotaisObtidos());
        assertEquals(2, roletaGiroCreditoRepository.countByChaveEventoStartingWith("META_GRUPO:1:"));
    }

    @Test
    void shouldCreditDailySpinOnlyOncePerDayAndOnlyWhenSpinning() throws Exception {
        criarPremioPadrao();
        RoletaConfig config = new RoletaConfig();
        config.setId(1L);
        config.setGirosIniciais(0);
        config.setGiroDiarioQuantidade(1);
        config.setGiroDiarioSomenteQuandoZerar(true);
        roletaConfigRepository.save(config);
        Usuario usuario = criarUsuario("Cliente Giro Diario", "551199992036");

        for (int tentativa = 0; tentativa < 3; tentativa++) {
            mockMvc.perform(get("/api/roleta")
                            .header("Authorization", bearer(usuario))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.girosTotaisObtidos").value(0))
                    .andExpect(jsonPath("$.girosDisponiveis").value(0))
                    .andExpect(jsonPath("$.giroDiarioDisponivel").value(true));
        }

        String chaveDiaria = "GIRO_DIARIO:" + usuario.getId() + ":" + LocalDate.now();
        assertEquals(0, roletaGiroCreditoRepository.countByChaveEvento(chaveDiaria));

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.girosDisponiveis").value(0))
                .andExpect(jsonPath("$.roleta.girosTotaisObtidos").value(1))
                .andExpect(jsonPath("$.roleta.giroDiarioDisponivel").value(false));

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Usuario sem giros disponiveis"));

        var participante = roletaParticipanteRepository.findByUsuarioId(usuario.getId()).orElseThrow();
        assertEquals(1, participante.getGirosTotaisObtidos());
        assertEquals(0, participante.getGirosDisponiveis());
        assertEquals(1, roletaGiroCreditoRepository.countByChaveEvento(chaveDiaria));
    }

    @Test
    void shouldAllowAdminToConfigureRoletaPrizesByLevel() throws Exception {
        Usuario admin = criarAdmin("551199992013");
        RoletaNivel nivel = criarNivel("Grau Militar", 1, "#4b69ff", "1.00000000", true);

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "premios": [
                                    {
                                      "nivelId": %d,
                                      "tipoPremio": "DESCONTO_VALOR",
                                      "valor": 6.00,
                                      "ativo": true,
                                      "ordem": 0
                                    }
                                  ]
                                }
                                """.formatted(nivel.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premios.length()").value(0))
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(1))
                .andExpect(jsonPath("$.niveis[0].premios[0].nivelId").value(nivel.getId()))
                .andExpect(jsonPath("$.niveis[0].premios[0].titulo").value("R$ 6,00 OFF"))
                .andExpect(jsonPath("$.niveis[0].premios[0].pesoInterno").doesNotExist());

        assertEquals(new BigDecimal("1.00000000"), roletaPremioRepository.findAll().get(0).getPesoInterno());

        mockMvc.perform(get("/api/roleta").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premios.length()").value(1))
                .andExpect(jsonPath("$.premios[0].titulo").value("R$ 6,00 OFF"))
                .andExpect(jsonPath("$.premios[0].pesoInterno").doesNotExist());
    }

    @Test
    void shouldSaveSimpleNestedPrizeValuesByLevelAndKeepThemAfterReload() throws Exception {
        Usuario admin = criarAdmin("551199992022");

        String response = mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "niveis": [
                                    {
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1,
                                      "ativo": true,
                                      "premios": [
                                        {
                                          "tipoPremio": "DESCONTO_VALOR",
                                          "valor": 10.00,
                                          "ordem": 0,
                                          "ativo": true
                                        },
                                        {
                                          "tipoPremio": "DESCONTO_PERCENTUAL",
                                          "valor": 15.50,
                                          "ordem": 1,
                                          "ativo": true
                                        }
                                      ]
                                    }
                                  ]
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(2))
                .andExpect(jsonPath("$.niveis[0].premios[0].titulo").value("R$ 10,00 OFF"))
                .andExpect(jsonPath("$.niveis[0].premios[0].pesoInterno").doesNotExist())
                .andExpect(jsonPath("$.niveis[0].premios[1].titulo").value("15,5% OFF"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        long nivelId = json.path("niveis").get(0).path("id").asLong();
        long premioValorId = json.path("niveis").get(0).path("premios").get(0).path("id").asLong();
        long premioPercentualId = json.path("niveis").get(0).path("premios").get(1).path("id").asLong();

        roletaPremioRepository.findAll().forEach(premio ->
                assertEquals(new BigDecimal("1.00000000"), premio.getPesoInterno()));

        mockMvc.perform(get("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(2))
                .andExpect(jsonPath("$.niveis[0].premios[0].id").value(premioValorId))
                .andExpect(jsonPath("$.niveis[0].premios[0].valor").value(10.00))
                .andExpect(jsonPath("$.niveis[0].premios[1].id").value(premioPercentualId))
                .andExpect(jsonPath("$.niveis[0].premios[1].valor").value(15.50));

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "niveis": [
                                    {
                                      "id": %d,
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "ativo": true,
                                      "premios": [
                                        {
                                          "id": %d,
                                          "tipoPremio": "DESCONTO_VALOR",
                                          "valor": 12.00,
                                          "ordem": 0,
                                          "ativo": true
                                        }
                                      ]
                                    }
                                  ]
                                }
                                """.formatted(nivelId, premioValorId))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(2))
                .andExpect(jsonPath("$.niveis[0].premios[0].titulo").value("R$ 12,00 OFF"))
                .andExpect(jsonPath("$.niveis[0].premios[0].ativo").value(true))
                .andExpect(jsonPath("$.niveis[0].premios[1].id").value(premioPercentualId))
                .andExpect(jsonPath("$.niveis[0].premios[1].ativo").value(false));
    }

    @Test
    void shouldRejectAdminPrizeTypesOutsideDiscounts() throws Exception {
        Usuario admin = criarAdmin("551199992023");
        RoletaNivel nivel = criarNivel("Grau Militar", 1, "#4b69ff", "1.00000000", true);

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "premios": [
                                    {
                                      "nivelId": %d,
                                      "tipoPremio": "GIRO_EXTRA",
                                      "valor": 1.00,
                                      "ativo": true,
                                      "ordem": 0
                                    }
                                  ]
                                }
                                """.formatted(nivel.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tipo de premio deve ser DESCONTO_VALOR ou DESCONTO_PERCENTUAL"));
    }

    @Test
    void shouldRejectAdminPrizeWithoutValue() throws Exception {
        Usuario admin = criarAdmin("551199992024");
        RoletaNivel nivel = criarNivel("Grau Militar", 1, "#4b69ff", "1.00000000", true);

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "premios": [
                                    {
                                      "nivelId": %d,
                                      "tipoPremio": "DESCONTO_VALOR",
                                      "ativo": true,
                                      "ordem": 0
                                    }
                                  ]
                                }
                                """.formatted(nivel.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Valor do premio e obrigatorio"));
    }

    @Test
    void shouldSaveNestedPrizesWithoutRemovingSelectedProducts() throws Exception {
        Usuario admin = criarAdmin("551199992025");
        Produto produto = criarProduto("Calca Cargo Verde");

        String setupResponse = mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d],
                                  "niveis": [
                                    {
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1,
                                      "ativo": true
                                    }
                                  ]
                                }
                                """.formatted(produto.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoIds[0]").value(produto.getId()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long nivelId = objectMapper.readTree(setupResponse).path("niveis").get(0).path("id").asLong();

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "niveis": [
                                    {
                                      "id": %d,
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1,
                                      "ativo": true,
                                      "premios": [
                                        {
                                          "tipoPremio": "DESCONTO_VALOR",
                                          "valor": 8.00,
                                          "ordem": 0,
                                          "ativo": true
                                        }
                                      ]
                                    }
                                  ]
                                }
                                """.formatted(nivelId))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoIds[0]").value(produto.getId()))
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(1))
                .andExpect(jsonPath("$.niveis[0].premios[0].titulo").value("R$ 8,00 OFF"));

        assertEquals(1, roletaProdutoRepository.count());
        assertEquals(1, roletaPremioRepository.count());
    }

    @Test
    void shouldPreservePrizesWhenUpdatingOnlySelectedProducts() throws Exception {
        Usuario admin = criarAdmin("551199992026");
        Produto produto = criarProduto("Blusa Xadrez");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "niveis": [
                                    {
                                      "nome": "Grau Militar",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1,
                                      "ativo": true,
                                      "premios": [
                                        {
                                          "tipoPremio": "DESCONTO_PERCENTUAL",
                                          "valor": 12.50,
                                          "ordem": 0,
                                          "ativo": true
                                        }
                                      ]
                                    }
                                  ]
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premios.length()").value(0))
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(1));

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d]
                                }
                                """.formatted(produto.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoIds[0]").value(produto.getId()))
                .andExpect(jsonPath("$.premios.length()").value(0))
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(1))
                .andExpect(jsonPath("$.niveis[0].premios[0].titulo").value("12,5% OFF"));

        assertEquals(1, roletaPremioRepository.count());
        assertEquals(1, roletaProdutoRepository.count());
    }

    @Test
    void shouldOnlyClearSelectedProductsWhenExplicitlyRequested() throws Exception {
        Usuario admin = criarAdmin("551199992027");
        Produto produto = criarProduto("Jaqueta Jeans");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d]
                                }
                                """.formatted(produto.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoIds[0]").value(produto.getId()));

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": []
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoIds[0]").value(produto.getId()));

        assertEquals(1, roletaProdutoRepository.count());

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "atualizarProdutos": true,
                                  "produtoIds": []
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoIds.length()").value(0));

        assertEquals(0, roletaProdutoRepository.count());
    }

    @Test
    void shouldAllowAdminToConfigureRoletaProducts() throws Exception {
        Usuario admin = criarAdmin("551199992005");
        Usuario usuario = criarUsuario("Cliente Produtos", "551199992006");
        Produto produto = criarProduto("Bone Sequence Pint");

        mockMvc.perform(put("/api/admin/roleta")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "ativa": true,
                                  "titulo": "Brecho da Cami",
                                  "metaGrupo": 20,
                                  "girosBonusGrupo": 2,
                                  "girosIniciais": 8,
                                  "giroDiarioQuantidade": 1,
                                  "giroDiarioSomenteQuandoZerar": true,
                                  "girosGanhosPorConvite": 1,
                                  "multiplicadorDificuldadePadrao": 5.00,
                                  "usarPesosManuais": true,
                                  "produtoIds": [%d],
                                  "niveis": [
                                    {
                                      "nome": "Grau Militar",
                                      "descricao": "Mais comum",
                                      "corHex": "#4b69ff",
                                      "ordem": 1,
                                      "pesoRelativo": 1.00,
                                      "ativo": true
                                    },
                                    {
                                      "nome": "Restrito",
                                      "descricao": "Cinco vezes mais dificil",
                                      "corHex": "#8847ff",
                                      "ordem": 2,
                                      "ativo": true
                                    }
                                  ]
                                }
                                """.formatted(produto.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoIds[0]").value(produto.getId()))
                .andExpect(jsonPath("$.multiplicadorDificuldadePadrao").value(5.00))
                .andExpect(jsonPath("$.usarPesosManuais").value(true))
                .andExpect(jsonPath("$.niveis.length()").value(2))
                .andExpect(jsonPath("$.niveis[0].pesoRelativo").value(1))
                .andExpect(jsonPath("$.niveis[1].pesoRelativo").value(0.2))
                .andExpect(jsonPath("$.niveis[0].chancePercentual").value(83.3333));

        mockMvc.perform(get("/api/roleta").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis.length()").value(2))
                .andExpect(jsonPath("$.niveis[1].chancePercentual").value(16.6667));

        mockMvc.perform(get("/api/roleta/produtos")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(produto.getId()))
                .andExpect(jsonPath("$[0].nome").value("Bone Sequence Pint"))
                .andExpect(jsonPath("$[0].precoCusto").doesNotExist());
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private Usuario criarAdmin(String telefone) {
        Usuario admin = new Usuario("Admin Roleta", telefone);
        admin.setEmail(telefone + "@admin.test");
        admin.setPassword("senha-ja-codificada");
        admin.setRole(UsuarioRole.ADMIN);
        return usuarioRepository.save(admin);
    }

    private String codigoConvite(Usuario usuario) throws Exception {
        String response = mockMvc.perform(get("/api/roleta/convites")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).path("codigoConvite").asText();
    }

    private Missao criarMissaoSemanalConvite() {
        Missao missao = new Missao(
                "Convide uma pessoa",
                "gift",
                1,
                MissaoTipoAcao.CONVIDAR_PESSOAS.name(),
                0,
                1
        );
        missao.setCiclo(MissaoCiclo.SEMANAL);

        return missaoRepository.save(missao);
    }

    private Produto criarProduto(String nome) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(BigDecimal.valueOf(89.90));
        produto.setPrecoCusto(BigDecimal.valueOf(30.00));
        produto.setImagemUrl("/uploads/produto-roleta.webp");
        produto.setTamanho("Unico");
        return produtoRepository.save(produto);
    }

    private RoletaPremio criarPremioPadrao() {
        RoletaNivel nivel = criarNivel("Grau Militar", 1, "#4b69ff", "1.00000000", true);
        return criarPremio(
                "R$ 10 OFF",
                nivel,
                0,
                RoletaTipoPremio.DESCONTO_VALOR,
                "10.00",
                "1.00000000",
                true
        );
    }

    private RoletaNivel criarNivel(
            String nome,
            Integer ordem,
            String corHex,
            String pesoRelativo,
            Boolean ativo
    ) {
        RoletaNivel nivel = new RoletaNivel();
        nivel.setNome(nome);
        nivel.setOrdem(ordem);
        nivel.setCorHex(corHex);
        nivel.setPesoRelativo(new BigDecimal(pesoRelativo));
        nivel.setAtivo(ativo);
        return roletaNivelRepository.save(nivel);
    }

    private RoletaOpcao criarOpcao(
            String titulo,
            Integer nivel,
            Integer ordem,
            RoletaTipoPremio tipoPremio,
            String valorMinimo,
            String valorMaximo,
            Integer peso,
            Boolean ativa
    ) {
        RoletaOpcao opcao = new RoletaOpcao();
        opcao.setTitulo(titulo);
        opcao.setNivel(nivel);
        opcao.setOrdem(ordem);
        opcao.setTipoPremio(tipoPremio);
        opcao.setValorMinimo(new BigDecimal(valorMinimo));
        opcao.setValorMaximo(new BigDecimal(valorMaximo));
        opcao.setPeso(peso);
        opcao.setAtiva(ativa);
        return roletaOpcaoRepository.save(opcao);
    }

    private RoletaPremio criarPremio(
            String titulo,
            RoletaNivel nivel,
            Integer ordem,
            RoletaTipoPremio tipoPremio,
            String valor,
            String pesoInterno,
            Boolean ativo
    ) {
        RoletaPremio premio = new RoletaPremio();
        premio.setTitulo(titulo);
        premio.setNivel(nivel);
        premio.setOrdem(ordem);
        premio.setTipoPremio(tipoPremio);
        premio.setValor(new BigDecimal(valor));
        premio.setPesoInterno(new BigDecimal(pesoInterno));
        premio.setAtivo(ativo);
        return roletaPremioRepository.save(premio);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }

    private String assinatura(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(
                WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        ));

        return "sha256=" + HexFormat.of()
                .formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    private void limparDados() {
        pagamentoRepository.deleteAll();
        pedidoItemRepository.deleteAll();
        pedidoRepository.deleteAll();
        roletaConviteRepository.deleteAll();
        roletaGiroRepository.deleteAll();
        roletaGiroCreditoRepository.deleteAll();
        roletaPremioRepository.deleteAll();
        roletaOpcaoRepository.deleteAll();
        roletaNivelRepository.deleteAll();
        roletaProdutoRepository.deleteAll();
        roletaParticipanteRepository.deleteAll();
        roletaConfigRepository.deleteAll();
        usuarioMissaoSemanalRepository.deleteAll();
        missaoRepository.deleteAll();
        produtoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    @TestConfiguration
    static class InfinitePayTestConfig {

        @Bean
        @Primary
        CapturingInfinitePayClient capturingInfinitePayClient() {
            return new CapturingInfinitePayClient();
        }
    }

    static class CapturingInfinitePayClient implements InfinitePayClient {

        private InfinitePayLinkRequest ultimaRequest;

        @Override
        public InfinitePayLinkResponse criarLink(InfinitePayLinkRequest request) {
            this.ultimaRequest = request;

            return new InfinitePayLinkResponse("https://checkout.infinitepay.com.br/teste-roleta");
        }

        private void reset() {
            ultimaRequest = null;
        }
    }
}
