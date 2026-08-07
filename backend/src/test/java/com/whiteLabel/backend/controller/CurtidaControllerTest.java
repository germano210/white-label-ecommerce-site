package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
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

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CurtidaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private CompartilhamentoAberturaRepository compartilhamentoAberturaRepository;

    @Autowired
    private CompartilhamentoItemRepository compartilhamentoItemRepository;

    @Autowired
    private UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository;

    @Autowired
    private UsuarioMissaoRepository usuarioMissaoRepository;

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
    void shouldReturnEmptyListWhenUserHasNoLikes() throws Exception {
        Usuario usuario = criarUsuario("Cliente Sem Curtidas", "5511999997001");

        mockMvc.perform(get("/api/curtidas")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldListAuthenticatedUserLikedProductsFromMostRecentFirst() throws Exception {
        Usuario usuario = criarUsuario("Cliente Curtidas", "5511999997002");
        Produto primeira = criarProduto("Camisa");
        Produto segunda = criarProduto("Saia");
        segunda.setPrecoCusto(BigDecimal.valueOf(29.90));
        produtoRepository.save(segunda);

        curtir(usuario, primeira);
        Thread.sleep(10);
        curtir(usuario, segunda);

        mockMvc.perform(get("/api/curtidas")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(segunda.getId()))
                .andExpect(jsonPath("$[0].nome").value("Saia"))
                .andExpect(jsonPath("$[0].curtidasCount").value(1))
                .andExpect(jsonPath("$[0].passosCount").value(0))
                .andExpect(jsonPath("$[0].precoCusto").doesNotExist())
                .andExpect(jsonPath("$[1].id").value(primeira.getId()))
                .andExpect(jsonPath("$[1].nome").value("Camisa"));
    }

    @Test
    void shouldKeepLikesIsolatedBetweenUsers() throws Exception {
        Usuario usuarioA = criarUsuario("Cliente A", "5511999997003");
        Usuario usuarioB = criarUsuario("Cliente B", "5511999997004");
        Produto produtoA = criarProduto("Blusa A");
        Produto produtoB = criarProduto("Blusa B");

        curtir(usuarioA, produtoA);
        curtir(usuarioB, produtoB);

        mockMvc.perform(get("/api/curtidas")
                        .header("Authorization", bearer(usuarioA))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(produtoA.getId()))
                .andExpect(jsonPath("$[0].nome").value("Blusa A"));
    }

    @Test
    void shouldRequireAuthenticationToListLikes() throws Exception {
        mockMvc.perform(get("/api/curtidas").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldKeepLikeCreationWorking() throws Exception {
        Usuario usuario = criarUsuario("Cliente Like", "5511999997005");
        Produto produto = criarProduto("Vestido");

        mockMvc.perform(post("/api/curtidas/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.produtoId").value(produto.getId()))
                .andExpect(jsonPath("$.curtidasCount").value(1));

        Produto atualizado = produtoRepository.findById(produto.getId()).orElseThrow();
        assertEquals(1, atualizado.getCurtidasCount());
    }

    @Test
    void shouldKeepDuplicateLikeBlocked() throws Exception {
        Usuario usuario = criarUsuario("Cliente Duplicado", "5511999997006");
        Produto produto = criarProduto("Jaqueta");

        curtir(usuario, produto);

        mockMvc.perform(post("/api/curtidas/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict());

        assertEquals(1, curtidaRepository.count());
    }

    private void curtir(Usuario usuario, Produto produto) throws Exception {
        mockMvc.perform(post("/api/curtidas/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private Produto criarProduto(String nome) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(BigDecimal.valueOf(79.90));
        produto.setImagemUrl("/uploads/" + nome.toLowerCase().replace(" ", "-") + ".jpg");

        return produtoRepository.save(produto);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }
}
