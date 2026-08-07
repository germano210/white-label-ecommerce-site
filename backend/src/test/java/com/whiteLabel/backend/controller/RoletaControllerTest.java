package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.RoletaConfigRepository;
import com.whiteLabel.backend.repository.RoletaConviteRepository;
import com.whiteLabel.backend.repository.RoletaGiroRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
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
        mockMvc.perform(get("/api/roleta").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativa").value(true))
                .andExpect(jsonPath("$.metaGrupo").value(20))
                .andExpect(jsonPath("$.premiosEmJogo.length()").value(greaterThanOrEqualTo(1)));
    }

    @Test
    void shouldRequireAuthToSpin() throws Exception {
        mockMvc.perform(post("/api/roleta/girar").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldCreateParticipantAndConsumeSpin() throws Exception {
        Usuario usuario = criarUsuario("Cliente Roleta", "551199992001");

        mockMvc.perform(get("/api/roleta")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.girosDisponiveis").value(8));

        mockMvc.perform(post("/api/roleta/girar")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premio.valorDesconto").exists())
                .andExpect(jsonPath("$.roleta.girosDisponiveis").value(7))
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
                .andExpect(jsonPath("$.quantidadeConvertida").value(1));
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
                                  "produtoIds": [%d]
                                }
                                """.formatted(produto.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoIds[0]").value(produto.getId()));

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

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }

    private void limparDados() {
        roletaConviteRepository.deleteAll();
        roletaGiroRepository.deleteAll();
        roletaProdutoRepository.deleteAll();
        roletaParticipanteRepository.deleteAll();
        roletaConfigRepository.deleteAll();
        produtoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }
}
