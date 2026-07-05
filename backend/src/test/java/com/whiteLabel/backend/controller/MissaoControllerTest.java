package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.repository.MissaoRepository;
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

    @BeforeEach
    void setUp() {
        missaoRepository.deleteAll();
    }

    @Test
    void shouldListActiveMissionsWithoutAdminToken() throws Exception {
        missaoRepository.save(new Missao(
                "Curtir tres pecas",
                "heart",
                3,
                "CURTIR",
                100,
                1
        ));

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
                .andExpect(jsonPath("$[0].titulo").value("Curtir tres pecas"));
    }

    @Test
    void shouldKeepAdminMissionsProtected() throws Exception {
        mockMvc.perform(get("/api/admin/missoes").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
