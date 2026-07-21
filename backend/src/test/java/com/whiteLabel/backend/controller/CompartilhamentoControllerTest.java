package com.whiteLabel.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoCiclo;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioMissao;
import com.whiteLabel.backend.domain.UsuarioMissaoSemanal;
import com.whiteLabel.backend.repository.CompartilhamentoAberturaRepository;
import com.whiteLabel.backend.repository.CompartilhamentoItemRepository;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.PassoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoSemanalRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import com.whiteLabel.backend.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CompartilhamentoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CompartilhamentoAberturaRepository compartilhamentoAberturaRepository;

    @Autowired
    private CompartilhamentoItemRepository compartilhamentoItemRepository;

    @Autowired
    private UsuarioMissaoRepository usuarioMissaoRepository;

    @Autowired
    private UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository;

    @Autowired
    private CurtidaRepository curtidaRepository;

    @Autowired
    private PassoRepository passoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private MissaoRepository missaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @BeforeEach
    void setUp() {
        compartilhamentoAberturaRepository.deleteAll();
        compartilhamentoItemRepository.deleteAll();
        usuarioMissaoSemanalRepository.deleteAll();
        usuarioMissaoRepository.deleteAll();
        curtidaRepository.deleteAll();
        passoRepository.deleteAll();
        produtoRepository.deleteAll();
        missaoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    @Test
    void shouldNotIncrementMissionWhenGeneratingShareLink() throws Exception {
        Missao missao = criarMissaoCompartilhamento(1);
        Usuario origem = criarUsuario("Origem", "5511999991001");
        Produto produto = criarProduto("Camisa");

        gerarLink(origem, produto);

        assertTrue(usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(origem.getId(), missao.getId())
                .isEmpty());
        assertEquals(1, compartilhamentoItemRepository.count());
        assertEquals(0, compartilhamentoAberturaRepository.count());
    }

    @Test
    void shouldIncrementMissionWhenAnotherLoggedUserOpensLink() throws Exception {
        Missao missao = criarMissaoCompartilhamento(3);
        Usuario origem = criarUsuario("Origem", "5511999991002");
        Usuario visitante = criarUsuario("Visitante", "5511999991003");
        Produto produto = criarProduto("Calca");
        String codigo = gerarLink(origem, produto);

        mockMvc.perform(post("/api/compartilhamentos/{codigo}/abrir", codigo)
                        .header("Authorization", bearer(visitante))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contabilizada").value(true))
                .andExpect(jsonPath("$.missoes[0].progresso").value(1));

        UsuarioMissao progresso = usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(origem.getId(), missao.getId())
                .orElseThrow();
        assertEquals(1, progresso.getProgressoAtual());
        assertEquals(1, compartilhamentoAberturaRepository.count());
    }

    @Test
    void shouldRejectAnonymousOpeningWithoutIncrementingMission() throws Exception {
        Missao missao = criarMissaoCompartilhamento(1);
        Usuario origem = criarUsuario("Origem", "5511999991004");
        Produto produto = criarProduto("Vestido");
        String codigo = gerarLink(origem, produto);

        mockMvc.perform(post("/api/compartilhamentos/{codigo}/abrir", codigo)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        assertTrue(usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(origem.getId(), missao.getId())
                .isEmpty());
        assertEquals(0, compartilhamentoAberturaRepository.count());
    }

    @Test
    void shouldNotIncrementWhenOriginUserOpensOwnLink() throws Exception {
        Missao missao = criarMissaoCompartilhamento(1);
        Usuario origem = criarUsuario("Origem", "5511999991005");
        Produto produto = criarProduto("Saia");
        String codigo = gerarLink(origem, produto);

        mockMvc.perform(post("/api/compartilhamentos/{codigo}/abrir", codigo)
                        .header("Authorization", bearer(origem))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contabilizada").value(false));

        assertTrue(usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(origem.getId(), missao.getId())
                .isEmpty());
        assertEquals(0, compartilhamentoAberturaRepository.count());
    }

    @Test
    void shouldNotIncrementWhenVisitorOpensSameLinkTwice() throws Exception {
        Missao missao = criarMissaoCompartilhamento(100);
        Usuario origem = criarUsuario("Origem", "5511999991006");
        Usuario visitante = criarUsuario("Visitante", "5511999991007");
        Produto produto = criarProduto("Blusa");
        String codigo = gerarLink(origem, produto);

        mockMvc.perform(post("/api/compartilhamentos/{codigo}/abrir", codigo)
                        .header("Authorization", bearer(visitante))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contabilizada").value(true));

        mockMvc.perform(post("/api/compartilhamentos/{codigo}/abrir", codigo)
                        .header("Authorization", bearer(visitante))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contabilizada").value(false));

        UsuarioMissao progresso = usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(origem.getId(), missao.getId())
                .orElseThrow();
        assertEquals(1, progresso.getProgressoAtual());
        assertEquals(1, compartilhamentoAberturaRepository.count());
    }

    @Test
    void shouldIncrementWeeklyInviteMissionWhenAnotherUserOpensLink() throws Exception {
        Missao missaoSemanal = criarMissaoSemanalConvite();
        Usuario origem = criarUsuario("Origem", "5511999991008");
        Usuario visitante = criarUsuario("Visitante", "5511999991009");
        Produto produto = criarProduto("Jaqueta");
        String codigo = gerarLink(origem, produto);

        mockMvc.perform(post("/api/compartilhamentos/{codigo}/abrir", codigo)
                        .header("Authorization", bearer(visitante))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contabilizada").value(true));

        UsuarioMissaoSemanal progressoSemanal = usuarioMissaoSemanalRepository
                .findByUsuarioIdAndSemanaInicioAndMissaoAtivaTrue(
                        origem.getId(),
                        inicioSemanaAtual()
                )
                .stream()
                .filter(progresso -> progresso.getMissao().getId().equals(missaoSemanal.getId()))
                .findFirst()
                .orElseThrow();
        assertEquals(1, progressoSemanal.getProgressoAtual());
    }

    private String gerarLink(Usuario origem, Produto produto) throws Exception {
        MvcResult result = mockMvc.perform(
                        post("/api/compartilhamentos/produtos/{produtoId}", produto.getId())
                                .header("Authorization", bearer(origem))
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.produtoId").value(produto.getId()))
                .andExpect(jsonPath("$.codigo").isNotEmpty())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("codigo")
                .asText();
    }

    private Missao criarMissaoCompartilhamento(Integer meta) {
        return missaoRepository.save(new Missao(
                "Compartilhar item",
                "share",
                meta,
                MissaoTipoAcao.COMPARTILHAR_ITEM.name(),
                10,
                1
        ));
    }

    private Missao criarMissaoSemanalConvite() {
        Missao missao = new Missao(
                "Convide pessoas",
                "users",
                3,
                MissaoTipoAcao.CONVIDAR_PESSOAS.name(),
                100,
                1
        );
        missao.setCiclo(MissaoCiclo.SEMANAL);
        missao.setTentativasRecompensa(1);

        return missaoRepository.save(missao);
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private Produto criarProduto(String nome) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(BigDecimal.valueOf(49.90));
        produto.setImagemUrl("/uploads/" + nome.toLowerCase() + ".jpg");

        return produtoRepository.save(produto);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }

    private java.time.LocalDateTime inicioSemanaAtual() {
        java.time.LocalDate hoje = java.time.LocalDate.now();
        int diasDesdeSexta = Math.floorMod(
                hoje.getDayOfWeek().getValue() - java.time.DayOfWeek.FRIDAY.getValue(),
                7
        );

        return hoje.minusDays(diasDesdeSexta).atStartOfDay();
    }
}
