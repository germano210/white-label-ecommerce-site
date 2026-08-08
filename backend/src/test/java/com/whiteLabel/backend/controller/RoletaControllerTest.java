package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.RoletaConfig;
import com.whiteLabel.backend.domain.RoletaNivel;
import com.whiteLabel.backend.domain.RoletaOpcao;
import com.whiteLabel.backend.domain.RoletaPremio;
import com.whiteLabel.backend.domain.RoletaTipoPremio;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.RoletaConfigRepository;
import com.whiteLabel.backend.repository.RoletaConviteRepository;
import com.whiteLabel.backend.repository.RoletaGiroRepository;
import com.whiteLabel.backend.repository.RoletaNivelRepository;
import com.whiteLabel.backend.repository.RoletaOpcaoRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
import com.whiteLabel.backend.repository.RoletaPremioRepository;
import com.whiteLabel.backend.repository.RoletaProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import com.whiteLabel.backend.service.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RoletaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RoletaConviteRepository roletaConviteRepository;

    @Autowired
    private RoletaGiroRepository roletaGiroRepository;

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
    private UsuarioRepository usuarioRepository;

    @BeforeEach
    void setUp() {
        limparDados();
    }

    @AfterEach
    void tearDown() {
        limparDados();
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
                .andExpect(jsonPath("$.opcoes.length()").value(2))
                .andExpect(jsonPath("$.opcoes[0].titulo").value("Nivel 1"))
                .andExpect(jsonPath("$.opcoes[0].peso").doesNotExist())
                .andExpect(jsonPath("$.opcoes[1].titulo").value("Nivel 2"))
                .andExpect(jsonPath("$.premios.length()").value(2))
                .andExpect(jsonPath("$.premios[0].titulo").value("Premio Nivel 1"))
                .andExpect(jsonPath("$.premios[0].pesoInterno").doesNotExist())
                .andExpect(jsonPath("$.premios[1].titulo").value("Premio Nivel 2"))
                .andExpect(jsonPath("$.premiosEmJogo.length()").value(greaterThanOrEqualTo(1)));
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
                .andExpect(jsonPath("$.girosPorConvite").value(1));

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
                .andExpect(jsonPath("$.roleta.valorDisponivelResgate").value(10.00))
                .andExpect(jsonPath("$.roleta.progressoGrupo").value(1));
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
                .andExpect(jsonPath("$.girosPorConvite").value(1));

        mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(indicador))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.convitesConvertidos").value(1))
                .andExpect(jsonPath("$.girosDisponiveis").value(9))
                .andExpect(jsonPath("$.girosTotaisObtidos").value(9));

        var convite = roletaConviteRepository.findAll().get(0);
        assertEquals(1, convite.getGirosConcedidos());
        assertTrue(convite.getConvertidoEm() != null);
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
                .andExpect(jsonPath("$.valorDisponivelResgate").exists())
                .andExpect(jsonPath("$.valorTotalResgatado").value(0.00));

        assertEquals(1, roletaParticipanteRepository.count());
        assertTrue(roletaParticipanteRepository.findByUsuarioId(usuario.getId())
                .orElseThrow()
                .getValorDisponivelResgate()
                .compareTo(BigDecimal.ZERO) > 0);
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
    void shouldRejectActiveAdminOptionWithoutWeight() throws Exception {
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
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Peso deve ser maior que zero em opcoes ativas"));
    }

    @Test
    void shouldRejectActiveAdminPrizeWithoutInternalWeight() throws Exception {
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
                                      "titulo": "Peso interno invalido",
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
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Peso interno deve ser maior que zero em premios ativos"));
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
                .andExpect(jsonPath("$.niveis[0].pesoRelativo").value(1.00000000))
                .andExpect(jsonPath("$.niveis[1].pesoRelativo").value(0.20000000))
                .andExpect(jsonPath("$.niveis[2].pesoRelativo").value(0.04000000))
                .andExpect(jsonPath("$.niveis[3].pesoRelativo").value(0.00800000))
                .andExpect(jsonPath("$.niveis[4].pesoRelativo").value(0.00325000))
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
                .andExpect(jsonPath("$.niveis[4].pesoRelativo").value(0.00325000))
                .andExpect(jsonPath("$.niveis[4].chancePercentual").value(0.2597));

        assertEquals(
                new BigDecimal("0.00325000"),
                roletaNivelRepository.findAllByOrderByOrdemAscIdAsc().get(4).getPesoRelativo()
        );
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
                                      "titulo": "R$ 6 OFF",
                                      "descricao": "Premio por nivel",
                                      "tipoPremio": "DESCONTO_VALOR",
                                      "valor": 6.00,
                                      "pesoInterno": 3.50,
                                      "ativo": true,
                                      "ordem": 0
                                    }
                                  ]
                                }
                                """.formatted(nivel.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premios.length()").value(1))
                .andExpect(jsonPath("$.premios[0].nivelId").value(nivel.getId()))
                .andExpect(jsonPath("$.premios[0].titulo").value("R$ 6 OFF"))
                .andExpect(jsonPath("$.premios[0].pesoInterno").value(3.50000000))
                .andExpect(jsonPath("$.niveis[0].premios.length()").value(1))
                .andExpect(jsonPath("$.niveis[0].premios[0].titulo").value("R$ 6 OFF"))
                .andExpect(jsonPath("$.niveis[0].premios[0].pesoInterno").value(3.50000000));

        mockMvc.perform(get("/api/roleta").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premios.length()").value(1))
                .andExpect(jsonPath("$.premios[0].titulo").value("R$ 6 OFF"))
                .andExpect(jsonPath("$.premios[0].pesoInterno").doesNotExist());
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
                                  ],
                                  "opcoes": [
                                    {
                                      "nivel": 1,
                                      "titulo": "R$ 4 OFF",
                                      "descricao": "Desconto configurado pelo admin",
                                      "tipoPremio": "DESCONTO_VALOR",
                                      "valorMinimo": 4.00,
                                      "valorMaximo": 4.00,
                                      "peso": 5,
                                      "ativa": true,
                                      "ordem": 0
                                    },
                                    {
                                      "nivel": 2,
                                      "titulo": "Fatia inativa",
                                      "tipoPremio": "SEM_PREMIO",
                                      "valorMinimo": 0.00,
                                      "valorMaximo": 0.00,
                                      "peso": 1,
                                      "ativa": false,
                                      "ordem": 1
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
                .andExpect(jsonPath("$.niveis[0].pesoRelativo").value(1.00000000))
                .andExpect(jsonPath("$.niveis[1].pesoRelativo").value(0.20000000))
                .andExpect(jsonPath("$.niveis[0].chancePercentual").value(83.3333))
                .andExpect(jsonPath("$.opcoes.length()").value(2))
                .andExpect(jsonPath("$.opcoes[0].peso").value(5))
                .andExpect(jsonPath("$.opcoes[1].ativa").value(false));

        mockMvc.perform(get("/api/roleta").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveis.length()").value(2))
                .andExpect(jsonPath("$.niveis[1].chancePercentual").value(16.6667))
                .andExpect(jsonPath("$.opcoes.length()").value(1))
                .andExpect(jsonPath("$.opcoes[0].titulo").value("R$ 4 OFF"))
                .andExpect(jsonPath("$.opcoes[0].peso").doesNotExist());

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

    private void limparDados() {
        roletaConviteRepository.deleteAll();
        roletaGiroRepository.deleteAll();
        roletaPremioRepository.deleteAll();
        roletaOpcaoRepository.deleteAll();
        roletaNivelRepository.deleteAll();
        roletaProdutoRepository.deleteAll();
        roletaParticipanteRepository.deleteAll();
        roletaConfigRepository.deleteAll();
        produtoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }
}
