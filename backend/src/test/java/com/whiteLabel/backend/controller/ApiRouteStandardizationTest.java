package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiRouteStandardizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private CurtidaRepository curtidaRepository;

    @BeforeEach
    void setUp() {
        curtidaRepository.deleteAll();
        produtoRepository.deleteAll();
    }

    @Test
    void shouldExposePublicProductsOnlyUnderApiPrefix() throws Exception {
        Produto produto = new Produto();
        produto.setNome("Camisa garimpada");
        produto.setPrecoVenda(BigDecimal.valueOf(79.90));
        produto.setImagemUrl("/uploads/camisa.jpg");
        produtoRepository.save(produto);

        mockMvc.perform(get("/api/produtos").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nome").value("Camisa garimpada"));
    }

    @Test
    void shouldExposeOtpRequestUnderApiAuthPrefix() throws Exception {
        mockMvc.perform(post("/api/auth/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "telefone": "5511999990000",
                                  "nome": "Cliente Teste"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP_ENVIADO"));
    }

    @Test
    void shouldProtectApiUserAndAdminRoutes() throws Exception {
        mockMvc.perform(get("/api/curtidas/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/missoes").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/produtos").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
