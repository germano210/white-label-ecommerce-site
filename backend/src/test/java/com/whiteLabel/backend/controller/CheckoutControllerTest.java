package com.whiteLabel.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whiteLabel.backend.domain.PedidoStatus;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.InfinitePayLinkRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkResponse;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PedidoItemRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import com.whiteLabel.backend.service.InfinitePayClient;
import com.whiteLabel.backend.service.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(CheckoutControllerTest.InfinitePayTestConfig.class)
class CheckoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CapturingInfinitePayClient infinitePayClient;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        pagamentoRepository.deleteAll();
        pedidoItemRepository.deleteAll();
        pedidoRepository.deleteAll();
        produtoRepository.deleteAll();
        usuarioRepository.deleteAll();
        infinitePayClient.reset();
    }

    @AfterEach
    void tearDown() {
        pagamentoRepository.deleteAll();
        pedidoItemRepository.deleteAll();
        pedidoRepository.deleteAll();
        produtoRepository.deleteAll();
        usuarioRepository.deleteAll();
        infinitePayClient.reset();
    }

    @Test
    void shouldRequireAuthenticatedUserToCreateProductCheckout() throws Exception {
        Produto produto = criarProduto("Blusa Protegida", "39.90", true);

        mockMvc.perform(post("/api/checkout/produtos/{produtoId}", produto.getId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldCreateInfinitePayLinkWithRealProductNameAndPriceInCents() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Checkout", "5511999997001"));
        Produto produto = criarProduto("Calca Adidas", "1.00", true);

        MvcResult result = mockMvc.perform(post("/api/checkout/produtos/{produtoId}", produto.getId())
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.checkoutUrl").value("https://checkout.infinitepay.com.br/teste"))
                .andExpect(jsonPath("$.status").value("AGUARDANDO_PAGAMENTO"))
                .andExpect(jsonPath("$.precoFinal").value(1.00))
                .andReturn();

        var json = objectMapper.readTree(result.getResponse().getContentAsString());
        Long pedidoId = json.get("pedidoId").asLong();

        InfinitePayLinkRequest request = infinitePayClient.ultimaRequest;
        assertNotNull(request);
        assertEquals("brechocami", request.handle());
        assertEquals("https://brechodacami.com/checkout/sucesso", request.redirectUrl());
        assertEquals(
                "https://api.brechodacami.com/api/pagamentos/infinitepay/webhook",
                request.webhookUrl()
        );
        assertEquals(pedidoId.toString(), request.orderNsu());
        assertEquals(1, request.items().size());
        assertEquals(1, request.items().get(0).quantity());
        assertEquals(100L, request.items().get(0).price());
        assertEquals("Calca Adidas", request.items().get(0).description());

        var pedido = pedidoRepository.findById(pedidoId).orElseThrow();
        assertEquals(PedidoStatus.AGUARDANDO_PAGAMENTO, pedido.getStatus());
        assertEquals("1.00", pedido.getPrecoOriginal().toPlainString());
        assertEquals("0.00", pedido.getDescontoAplicado().toPlainString());
        assertEquals("1.00", pedido.getPrecoFinal().toPlainString());
        assertEquals(pedidoId.toString(), pedido.getOrderNsu());
        assertTrue(pagamentoRepository.findByCheckoutId(pedidoId.toString()).isPresent());

        Long produtoIdSalvo = jdbcTemplate.queryForObject(
                "select produto_id from pedidos where id = ?",
                Long.class,
                pedidoId
        );
        assertEquals(produto.getId(), produtoIdSalvo);
    }

    @Test
    void shouldRejectInactiveProductCheckout() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Inativo", "5511999997002"));
        Produto produto = criarProduto("Produto Inativo", "29.90", false);

        mockMvc.perform(post("/api/checkout/produtos/{produtoId}", produto.getId())
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        assertEquals(0, pagamentoRepository.count());
    }

    private Produto criarProduto(String nome, String precoVenda, boolean ativo) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(new BigDecimal(precoVenda));
        produto.setCondicao(new BigDecimal("8.50"));
        produto.setImagemUrl("/uploads/" + nome.toLowerCase().replace(" ", "-") + ".webp");
        produto.setAtivo(ativo);

        return produtoRepository.save(produto);
    }

    @TestConfiguration
    static class InfinitePayTestConfig {

        @Bean
        @Primary
        CapturingInfinitePayClient capturingInfinitePayClient() {
            return new CapturingInfinitePayClient();
        }
    }

    static class CapturingInfinitePayClient implements InfinitePayClient {

        private InfinitePayLinkRequest ultimaRequest;

        @Override
        public InfinitePayLinkResponse criarLink(InfinitePayLinkRequest request) {
            this.ultimaRequest = request;

            return new InfinitePayLinkResponse("https://checkout.infinitepay.com.br/teste");
        }

        private void reset() {
            ultimaRequest = null;
        }
    }
}
