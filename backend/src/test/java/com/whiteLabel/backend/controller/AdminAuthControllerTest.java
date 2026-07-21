package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.dto.RequestOtpRequest;
import com.whiteLabel.backend.dto.VerifyOtpRequest;
import com.whiteLabel.backend.repository.CompartilhamentoAberturaRepository;
import com.whiteLabel.backend.repository.CompartilhamentoItemRepository;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PassoRepository;
import com.whiteLabel.backend.repository.PedidoItemRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoSemanalRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import com.whiteLabel.backend.service.AuthService;
import com.whiteLabel.backend.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
@AutoConfigureMockMvc
class AdminAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private UsuarioMissaoRepository usuarioMissaoRepository;

    @Autowired
    private UsuarioMissaoSemanalRepository usuarioMissaoSemanalRepository;

    @Autowired
    private CompartilhamentoAberturaRepository compartilhamentoAberturaRepository;

    @Autowired
    private CompartilhamentoItemRepository compartilhamentoItemRepository;

    @Autowired
    private CurtidaRepository curtidaRepository;

    @Autowired
    private PassoRepository passoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private MissaoRepository missaoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

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
    void shouldLoginAdminWithEmailAndPassword() throws Exception {
        criarUsuarioAdmin("germano@brechocami.com", "senhasegura@123");

        mockMvc.perform(post("/api/auth/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "  GERMANO@BRECHOCAMI.COM  ",
                                  "senha": "senhasegura@123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.usuario.email").value("germano@brechocami.com"))
                .andExpect(jsonPath("$.usuario.role").value("ADMIN"));
    }

    @Test
    void shouldRejectWrongAdminPassword() throws Exception {
        criarUsuarioAdmin("germano@brechocami.com", "senhasegura@123");

        mockMvc.perform(post("/api/auth/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "germano@brechocami.com",
                                  "senha": "senha-errada"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectUnknownAdminEmail() throws Exception {
        mockMvc.perform(post("/api/auth/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "naoexiste@brechocami.com",
                                  "senha": "senhasegura@123"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectUserRoleOnAdminLogin() throws Exception {
        criarUsuarioComSenha("cliente@brechocami.com", "senha-cliente", UsuarioRole.USER);

        mockMvc.perform(post("/api/auth/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "cliente@brechocami.com",
                                  "senha": "senha-cliente"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAdminTokenAndRejectUserTokenOnAdminRoutes() throws Exception {
        Usuario admin = criarUsuarioAdmin("germano@brechocami.com", "senhasegura@123");
        Usuario usuario = criarUsuarioComSenha(
                "cliente@brechocami.com",
                "senha-cliente",
                UsuarioRole.USER
        );

        mockMvc.perform(get("/api/admin/missoes")
                        .header("Authorization", "Bearer " + jwtService.generateToken(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/missoes")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectInvalidMissionActionType() throws Exception {
        Usuario admin = criarUsuarioAdmin("germano@brechocami.com", "senhasegura@123");

        mockMvc.perform(post("/api/admin/missoes")
                        .header("Authorization", "Bearer " + jwtService.generateToken(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titulo": "Missao invalida",
                                  "icone": "alert",
                                  "meta_progresso": 3,
                                  "tipo_acao": "CURTIR",
                                  "valorBase": 100,
                                  "peso": 1
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldCreateMissionWithOfficialActionTypes() throws Exception {
        Usuario admin = criarUsuarioAdmin("germano@brechocami.com", "senhasegura@123");
        String token = jwtService.generateToken(admin);
        String[] tipos = {
                "CURTIR_ITEM",
                "COMPARTILHAR_ITEM",
                "COMPRAR_ITEM",
                "USAR_TENTATIVA",
                "COMPLETAR_MISSOES",
                "ALCANCAR_NIVEL",
                "CONVIDAR_PESSOAS",
                "BONUS_DIARIO"
        };

        for (String tipo : tipos) {
            mockMvc.perform(post("/api/admin/missoes")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "titulo": "Missao %s",
                                      "icone": "target",
                                      "meta_progresso": 1,
                                      "tipo_acao": "%s",
                                      "valorBase": 10,
                                      "peso": 1
                                    }
                                    """.formatted(tipo, tipo)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.tipo_acao").value(tipo));
        }
    }

    @Test
    void shouldKeepOtpFlowWorkingForCommonUsers() {
        String telefone = "5511999997777";
        authService.requestOtp(new RequestOtpRequest(telefone, "Cliente OTP"));

        Usuario usuario = usuarioRepository.findByTelefone(telefone).orElseThrow();

        var response = authService.verifyOtp(
                new VerifyOtpRequest(telefone, usuario.getOtp())
        );

        assertFalse(response.token().isBlank());
        assertEquals(telefone, response.usuario().telefone());
    }

    private Usuario criarUsuarioAdmin(String email, String senha) {
        return criarUsuarioComSenha(email, senha, UsuarioRole.ADMIN);
    }

    private Usuario criarUsuarioComSenha(String email, String senha, UsuarioRole role) {
        Usuario usuario = new Usuario(email, telefoneReservado(email));
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode(senha));
        usuario.setRole(role);

        return usuarioRepository.save(usuario);
    }

    private String telefoneReservado(String email) {
        return email.substring(0, email.indexOf('@')).replaceAll("[^a-zA-Z0-9]", "");
    }
}
