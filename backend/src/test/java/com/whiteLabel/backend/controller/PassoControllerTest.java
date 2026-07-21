package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
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

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PassoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

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
    void shouldRegisterPassForAuthenticatedUserAndExposeUpdatedCount() throws Exception {
        Usuario usuario = criarUsuario("Cliente Passo", "5511999994001");
        Produto produto = criarProduto("Camisa");

        mockMvc.perform(post("/api/passos/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.produtoId").value(produto.getId()))
                .andExpect(jsonPath("$.dataPasso").isNotEmpty())
                .andExpect(jsonPath("$.passosCount").value(1));

        Produto atualizado = produtoRepository.findById(produto.getId()).orElseThrow();
        assertEquals(1, atualizado.getPassosCount());
        assertEquals(1, passoRepository.count());

        mockMvc.perform(get("/api/produtos").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(produto.getId()))
                .andExpect(jsonPath("$[0].passosCount").value(1));
    }

    @Test
    void shouldReturnNotFoundForMissingProduct() throws Exception {
        Usuario usuario = criarUsuario("Cliente Produto Ausente", "5511999994002");

        mockMvc.perform(post("/api/passos/{produtoId}", 99999L)
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundForInactiveProduct() throws Exception {
        Usuario usuario = criarUsuario("Cliente Produto Inativo", "5511999994003");
        Produto produto = criarProduto("Calca");
        produto.setAtivo(false);
        produtoRepository.save(produto);

        mockMvc.perform(post("/api/passos/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRequireAuthenticationToPassProduct() throws Exception {
        Produto produto = criarProduto("Saia");

        mockMvc.perform(post("/api/passos/{produtoId}", produto.getId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectDuplicatePassForSameProduct() throws Exception {
        Usuario usuario = criarUsuario("Cliente Duplicado", "5511999994004");
        Produto produto = criarProduto("Blusa");

        mockMvc.perform(post("/api/passos/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/passos/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict());

        Produto atualizado = produtoRepository.findById(produto.getId()).orElseThrow();
        assertEquals(1, atualizado.getPassosCount());
        assertEquals(1, passoRepository.count());
    }

    @Test
    void shouldKeepLikeFlowWorking() throws Exception {
        Usuario usuario = criarUsuario("Cliente Curtida", "5511999994005");
        Produto produto = criarProduto("Vestido");

        mockMvc.perform(post("/api/curtidas/{produtoId}", produto.getId())
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.produtoId").value(produto.getId()))
                .andExpect(jsonPath("$.curtidasCount").value(1));

        Produto atualizado = produtoRepository.findById(produto.getId()).orElseThrow();
        assertEquals(1, atualizado.getCurtidasCount());
        assertEquals(0, atualizado.getPassosCount());
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private Produto criarProduto(String nome) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(BigDecimal.valueOf(59.90));
        produto.setImagemUrl("/uploads/" + nome.toLowerCase() + ".jpg");

        return produtoRepository.save(produto);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }
}
