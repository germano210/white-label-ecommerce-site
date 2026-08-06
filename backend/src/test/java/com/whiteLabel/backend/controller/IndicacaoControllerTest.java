package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Indicacao;
import com.whiteLabel.backend.domain.IndicacaoStatus;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.repository.IndicacaoRepository;
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

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class IndicacaoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private IndicacaoRepository indicacaoRepository;

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
    void shouldGenerateReferralLinkForAuthenticatedUser() throws Exception {
        Usuario usuario = criarUsuario("Indicador", "551199990001");

        mockMvc.perform(get("/api/indicacoes/meu-link")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").isNotEmpty())
                .andExpect(jsonPath("$.url").isNotEmpty());

        Usuario atualizado = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertTrue(atualizado.getCodigoIndicacao().matches("[a-z0-9]{16}"));
    }

    @Test
    void shouldReturnSameReferralCodeForSameUser() throws Exception {
        Usuario usuario = criarUsuario("Indicador Fixo", "551199990002");

        mockMvc.perform(get("/api/indicacoes/meu-link")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        String codigo = usuarioRepository.findById(usuario.getId())
                .orElseThrow()
                .getCodigoIndicacao();

        mockMvc.perform(post("/api/indicacoes/meu-link")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value(codigo))
                .andExpect(jsonPath("$.url").value("http://localhost:5173/foryou?ref=" + codigo));
    }

    @Test
    void shouldRequireAuthenticationToGenerateReferralLink() throws Exception {
        mockMvc.perform(get("/api/indicacoes/meu-link").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRegisterPublicReferralOpening() throws Exception {
        Usuario indicador = criarUsuarioComCodigo("Indicador Link", "551199990003", "abc123");

        mockMvc.perform(post("/api/indicacoes/{codigo}/abrir", "abc123")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value("abc123"))
                .andExpect(jsonPath("$.status").value("ABERTA"))
                .andExpect(jsonPath("$.abertoEm").isNotEmpty());

        List<Indicacao> indicacoes = indicacaoRepository.findAll();
        assertEquals(1, indicacoes.size());
        assertEquals(indicador.getId(), indicacoes.get(0).getUsuarioIndicador().getId());
        assertEquals(IndicacaoStatus.ABERTA, indicacoes.get(0).getStatus());
    }

    @Test
    void shouldLinkNewOtpUserToReferralOwner() throws Exception {
        Usuario indicador = criarUsuarioComCodigo("Indicador Conversao", "551199990004", "conv123");

        mockMvc.perform(post("/api/auth/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "telefone": "551199990005",
                                  "nome": "Nova Cliente",
                                  "codigoIndicacao": "conv123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEW_USER"));

        Usuario indicada = usuarioRepository.findByTelefone("551199990005").orElseThrow();
        assertEquals(indicador.getId(), indicada.getIndicadoPor().getId());

        List<Indicacao> indicacoes = indicacaoRepository.findAll();
        assertEquals(1, indicacoes.size());
        assertEquals(IndicacaoStatus.CONVERTIDA, indicacoes.get(0).getStatus());
        assertEquals(indicada.getId(), indicacoes.get(0).getUsuarioIndicado().getId());
    }

    @Test
    void shouldNotOverwriteReferralForExistingUser() throws Exception {
        Usuario indicador = criarUsuarioComCodigo("Indicador Existente", "551199990006", "old123");
        Usuario existente = criarUsuario("Cliente Existente", "551199990007");

        mockMvc.perform(post("/api/auth/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "telefone": "551199990007",
                                  "nome": "Cliente Existente Atualizada",
                                  "codigoIndicacao": "old123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EXISTING_USER"));

        Usuario atualizado = usuarioRepository.findById(existente.getId()).orElseThrow();
        assertNull(atualizado.getIndicadoPor());
        assertEquals(0, indicacaoRepository.count());
        assertEquals(indicador.getId(), usuarioRepository.findByCodigoIndicacao("old123")
                .orElseThrow()
                .getId());
    }

    @Test
    void shouldIgnoreInvalidReferralCodeDuringOtpRequest() throws Exception {
        mockMvc.perform(post("/api/auth/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "telefone": "551199990008",
                                  "nome": "Sem Indicador",
                                  "codigoIndicacao": "codigo-invalido"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEW_USER"));

        Usuario usuario = usuarioRepository.findByTelefone("551199990008").orElseThrow();
        assertNull(usuario.getIndicadoPor());
        assertEquals(0, indicacaoRepository.count());
    }

    @Test
    void shouldNotAllowUserToReferItself() throws Exception {
        Usuario usuario = criarUsuarioComCodigo("Auto Indicacao", "551199990009", "self123");

        mockMvc.perform(post("/api/auth/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "telefone": "551199990009",
                                  "nome": "Auto Indicacao",
                                  "codigoIndicacao": "self123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EXISTING_USER"));

        Usuario atualizado = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertNull(atualizado.getIndicadoPor());
        assertEquals(0, indicacaoRepository.count());
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private Usuario criarUsuarioComCodigo(String nome, String telefone, String codigo) {
        Usuario usuario = new Usuario(nome, telefone);
        usuario.setCodigoIndicacao(codigo);
        return usuarioRepository.save(usuario);
    }

    private void limparDados() {
        indicacaoRepository.deleteAll();

        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(usuario -> usuario.setIndicadoPor(null));
        usuarioRepository.saveAll(usuarios);
        usuarioRepository.flush();
        usuarioRepository.deleteAll();
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }
}
