package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.repository.LojaConfiguracaoRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ConfiguracaoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private LojaConfiguracaoRepository lojaConfiguracaoRepository;

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
    void shouldExposePublicConfigurationWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/configuracoes/publicas")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.condicaoCasasDecimais").value(1));
    }

    @Test
    void shouldRequireAdminToUpdateConfiguration() throws Exception {
        Usuario usuario = criarUsuario("Cliente Config", "551199996001");

        mockMvc.perform(get("/api/admin/configuracoes")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/admin/configuracoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condicaoCasasDecimais\":2}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/admin/configuracoes")
                        .header("Authorization", bearer(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condicaoCasasDecimais\":2}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAdminToUpdateConditionDecimals() throws Exception {
        Usuario admin = criarAdmin("551199996002");

        mockMvc.perform(put("/api/admin/configuracoes")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condicaoCasasDecimais\":2}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.condicaoCasasDecimais").value(2))
                .andExpect(jsonPath("$.atualizadaEm").isNotEmpty());

        mockMvc.perform(get("/api/configuracoes/publicas")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.condicaoCasasDecimais").value(2));
    }

    @Test
    void shouldRejectInvalidConditionDecimals() throws Exception {
        Usuario admin = criarAdmin("551199996003");

        mockMvc.perform(put("/api/admin/configuracoes")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condicaoCasasDecimais\":3}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private Usuario criarAdmin(String telefone) {
        Usuario admin = new Usuario("Admin Config", telefone);
        admin.setEmail(telefone + "@admin.test");
        admin.setPassword("senha-ja-codificada");
        admin.setRole(UsuarioRole.ADMIN);
        return usuarioRepository.save(admin);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }

    private void limparDados() {
        lojaConfiguracaoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }
}
