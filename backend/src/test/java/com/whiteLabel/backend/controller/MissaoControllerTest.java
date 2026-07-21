package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioMissao;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MissaoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MissaoRepository missaoRepository;

    @Autowired
    private UsuarioMissaoRepository usuarioMissaoRepository;

    @Autowired
    private UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

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

    @Autowired
    private JwtService jwtService;

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
    void shouldListActiveMissionsWithoutAdminToken() throws Exception {
        Missao missao = new Missao(
                "Curtir tres pecas",
                "heart",
                3,
                MissaoTipoAcao.CURTIR_ITEM.name(),
                100,
                1
        );
        missao.setDescricao("Curta pecas para ganhar XP");
        missaoRepository.save(missao);

        Missao inativa = new Missao(
                "Missao antiga",
                "archive",
                1,
                "LEGADO",
                50,
                1
        );
        inativa.desativar();
        missaoRepository.save(inativa);

        mockMvc.perform(get("/api/missoes").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo").value("Curtir tres pecas"))
                .andExpect(jsonPath("$[0].descricao").value("Curta pecas para ganhar XP"))
                .andExpect(jsonPath("$[0].meta_progresso").value(3))
                .andExpect(jsonPath("$[0].tipo_acao").value(MissaoTipoAcao.CURTIR_ITEM.name()))
                .andExpect(jsonPath("$[0].progresso").value(0))
                .andExpect(jsonPath("$[0].concluida").value(false))
                .andExpect(jsonPath("$[0].ativa").value(true));
    }

    @Test
    void shouldKeepAdminMissionsProtected() throws Exception {
        mockMvc.perform(get("/api/admin/missoes").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldListPurchaseAndAttemptMissionsWithUserProgress() throws Exception {
        Usuario usuario = usuarioRepository.save(
                new Usuario("Cliente Missoes", "5511999992001")
        );
        Missao compra = missaoRepository.save(new Missao(
                "Comprar uma peca",
                "shopping-bag",
                2,
                MissaoTipoAcao.COMPRAR_ITEM.name(),
                100,
                1
        ));
        Missao tentativa = missaoRepository.save(new Missao(
                "Usar tentativa",
                "ticket",
                3,
                MissaoTipoAcao.USAR_TENTATIVA.name(),
                50,
                1
        ));

        UsuarioMissao progressoCompra = new UsuarioMissao(usuario, compra);
        progressoCompra.incrementarAteMeta(compra.getMetaProgresso());
        usuarioMissaoRepository.save(progressoCompra);

        UsuarioMissao progressoTentativa = new UsuarioMissao(usuario, tentativa);
        progressoTentativa.incrementarAteMeta(tentativa.getMetaProgresso());
        progressoTentativa.incrementarAteMeta(tentativa.getMetaProgresso());
        usuarioMissaoRepository.save(progressoTentativa);

        mockMvc.perform(get("/api/missoes")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].tipo_acao").value(MissaoTipoAcao.COMPRAR_ITEM.name()))
                .andExpect(jsonPath("$[0].progresso").value(1))
                .andExpect(jsonPath("$[0].concluida").value(false))
                .andExpect(jsonPath("$[1].tipo_acao").value(MissaoTipoAcao.USAR_TENTATIVA.name()))
                .andExpect(jsonPath("$[1].progresso").value(2))
                .andExpect(jsonPath("$[1].concluida").value(false));
    }

    @Test
    void shouldKeepCompletedMissionInListWithCompletedFlag() throws Exception {
        Usuario usuario = usuarioRepository.save(
                new Usuario("Cliente Concluido", "5511999992002")
        );
        Missao missao = missaoRepository.save(new Missao(
                "Curtir uma peca",
                "heart",
                1,
                MissaoTipoAcao.CURTIR_ITEM.name(),
                20,
                1
        ));
        UsuarioMissao progresso = new UsuarioMissao(usuario, missao);
        progresso.incrementarAteMeta(missao.getMetaProgresso());
        progresso.concluir(missao.getValorBase() * missao.getPeso());
        usuarioMissaoRepository.save(progresso);

        mockMvc.perform(get("/api/missoes")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(missao.getId()))
                .andExpect(jsonPath("$[0].progresso").value(1))
                .andExpect(jsonPath("$[0].concluida").value(true))
                .andExpect(jsonPath("$[0].ativa").value(true));
    }
}
