package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoCiclo;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioMissaoSemanal;
import com.whiteLabel.backend.repository.CompartilhamentoAberturaRepository;
import com.whiteLabel.backend.repository.CompartilhamentoItemRepository;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PassoRepository;
import com.whiteLabel.backend.repository.PedidoItemRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoSemanalRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import com.whiteLabel.backend.service.JwtService;
import com.whiteLabel.backend.service.MissaoSemanalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MissaoSemanalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private MissaoSemanalService missaoSemanalService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MissaoRepository missaoRepository;

    @Autowired
    private UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository;

    @Autowired
    private UsuarioMissaoRepository usuarioMissaoRepository;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private CurtidaRepository curtidaRepository;

    @Autowired
    private PassoRepository passoRepository;

    @Autowired
    private CompartilhamentoAberturaRepository compartilhamentoAberturaRepository;

    @Autowired
    private CompartilhamentoItemRepository compartilhamentoItemRepository;

    @BeforeEach
    void setUp() {
        pagamentoRepository.deleteAll();
        pedidoItemRepository.deleteAll();
        pedidoRepository.deleteAll();
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
    void shouldListWeeklyMissionsForAuthenticatedUserWithResetAt() throws Exception {
        Usuario usuario = criarUsuario("Cliente Semanal", "5511999993001");
        criarMissaoSemanal(MissaoTipoAcao.COMPLETAR_MISSOES, 2, 100, 1, 1);

        mockMvc.perform(get("/api/missoes/semanais")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetAt").value(resetAtEsperado()))
                .andExpect(jsonPath("$.missoes.length()").value(1))
                .andExpect(jsonPath("$.missoes[0].tipo_acao")
                        .value(MissaoTipoAcao.COMPLETAR_MISSOES.name()))
                .andExpect(jsonPath("$.missoes[0].progresso").value(0))
                .andExpect(jsonPath("$.missoes[0].concluida").value(false))
                .andExpect(jsonPath("$.missoes[0].tentativasRecompensa").value(1))
                .andExpect(jsonPath("$.missoes[0].xpRecompensa").value(100))
                .andExpect(jsonPath("$.podeResgatarTentativas").value(false))
                .andExpect(jsonPath("$.tentativasRecompensa").value(0));
    }

    @Test
    void shouldKeepWeeklyProgressIsolatedByUser() throws Exception {
        Usuario usuarioA = criarUsuario("Cliente A", "5511999993002");
        Usuario usuarioB = criarUsuario("Cliente B", "5511999993003");
        criarMissaoSemanal(MissaoTipoAcao.COMPLETAR_MISSOES, 2, 100, 1, 1);

        missaoSemanalService.registrarAcao(
                usuarioA,
                MissaoTipoAcao.COMPLETAR_MISSOES.name()
        );

        mockMvc.perform(get("/api/missoes/semanais")
                        .header("Authorization", bearer(usuarioA))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.missoes[0].progresso").value(1));

        mockMvc.perform(get("/api/missoes/semanais")
                        .header("Authorization", bearer(usuarioB))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.missoes[0].progresso").value(0));
    }

    @Test
    void shouldIncrementCompleteNormalMissionsWeeklyProgress() throws Exception {
        Usuario usuario = criarUsuario("Cliente Normal", "5511999993004");
        criarMissaoSemanal(MissaoTipoAcao.COMPLETAR_MISSOES, 2, 100, 1, 1);
        criarMissaoNormalCurtida();
        Produto produto = criarProduto("Camisa");

        mockMvc.perform(post("/api/curtidas/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/missoes/semanais")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.missoes[0].progresso").value(1))
                .andExpect(jsonPath("$.missoes[0].concluida").value(false));
    }

    @Test
    void shouldRedeemWeeklyAttemptsOnlyWhenEligible() throws Exception {
        Usuario usuario = criarUsuario("Cliente Resgate", "5511999993005");
        criarMissaoSemanal(MissaoTipoAcao.COMPLETAR_MISSOES, 1, 100, 1, 2);
        missaoSemanalService.registrarAcao(
                usuario,
                MissaoTipoAcao.COMPLETAR_MISSOES.name()
        );

        mockMvc.perform(get("/api/missoes/semanais")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.podeResgatarTentativas").value(true))
                .andExpect(jsonPath("$.tentativasRecompensa").value(2))
                .andExpect(jsonPath("$.xpRecompensa").value(100));

        mockMvc.perform(post("/api/missoes/semanais/resgatar-tentativas")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tentativasConcedidas").value(2))
                .andExpect(jsonPath("$.tentativasSaldo").value(2))
                .andExpect(jsonPath("$.missoes[0].recompensaResgatada").value(true));
    }

    @Test
    void shouldRejectDuplicateWeeklyAttemptRedemptionInSameCycle() throws Exception {
        Usuario usuario = criarUsuario("Cliente Duplicado", "5511999993006");
        criarMissaoSemanal(MissaoTipoAcao.COMPLETAR_MISSOES, 1, 100, 1, 1);
        missaoSemanalService.registrarAcao(
                usuario,
                MissaoTipoAcao.COMPLETAR_MISSOES.name()
        );

        mockMvc.perform(post("/api/missoes/semanais/resgatar-tentativas")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/missoes/semanais/resgatar-tentativas")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldIgnorePreviousCycleProgress() throws Exception {
        Usuario usuario = criarUsuario("Cliente Reset", "5511999993007");
        Missao missao = criarMissaoSemanal(MissaoTipoAcao.COMPLETAR_MISSOES, 2, 100, 1, 1);
        LocalDateTime inicioAtual = inicioSemanaAtual();
        UsuarioMissaoSemanal progressoAntigo = new UsuarioMissaoSemanal(
                usuario,
                missao,
                inicioAtual.minusWeeks(1),
                inicioAtual
        );
        progressoAntigo.incrementarAteMeta(missao.getMetaProgresso());
        usuarioMissaoSemanalRepository.save(progressoAntigo);

        mockMvc.perform(get("/api/missoes/semanais")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.missoes[0].progresso").value(0))
                .andExpect(jsonPath("$.missoes[0].concluida").value(false));
    }

    private Missao criarMissaoSemanal(
            MissaoTipoAcao tipoAcao,
            Integer meta,
            Integer valorBase,
            Integer peso,
            Integer tentativas
    ) {
        Missao missao = new Missao(
                "Missao " + tipoAcao.name(),
                "target",
                meta,
                tipoAcao.name(),
                valorBase,
                peso
        );
        missao.setCiclo(MissaoCiclo.SEMANAL);
        missao.setTentativasRecompensa(tentativas);

        return missaoRepository.save(missao);
    }

    private Missao criarMissaoNormalCurtida() {
        Missao missao = new Missao(
                "Curtir uma peca",
                "heart",
                1,
                MissaoTipoAcao.CURTIR_ITEM.name(),
                10,
                1
        );
        missao.setCiclo(MissaoCiclo.NORMAL);

        return missaoRepository.save(missao);
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private Produto criarProduto(String nome) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(BigDecimal.valueOf(69.90));
        produto.setImagemUrl("/uploads/" + nome.toLowerCase() + ".jpg");

        return produtoRepository.save(produto);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }

    private String resetAtEsperado() {
        return DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(inicioSemanaAtual().plusWeeks(1));
    }

    private LocalDateTime inicioSemanaAtual() {
        LocalDate hoje = LocalDate.now();
        int diasDesdeSexta = Math.floorMod(
                hoje.getDayOfWeek().getValue() - DayOfWeek.FRIDAY.getValue(),
                7
        );

        return hoje.minusDays(diasDesdeSexta).atStartOfDay();
    }
}
