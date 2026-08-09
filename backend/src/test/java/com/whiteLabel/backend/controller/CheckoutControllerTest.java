package com.whiteLabel.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whiteLabel.backend.domain.PedidoStatus;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
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
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(CheckoutControllerTest.InfinitePayTestConfig.class)
class CheckoutControllerTest {

    private static final String WEBHOOK_SECRET = "test-payment-webhook-secret";

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
    void shouldRequireAuthenticatedUserToCheckCheckoutStatus() throws Exception {
        mockMvc.perform(get("/api/checkout/{pedidoId}/status", 999L)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnCheckoutStatusForOwner() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Status", "5511999997003"));
        Produto produto = criarProduto("Vestido Status", "79.90", true);
        CheckoutCriado checkout = criarCheckoutProduto(usuario, produto);

        mockMvc.perform(get("/api/checkout/{pedidoId}/status", checkout.pedidoId())
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pedidoId").value(checkout.pedidoId()))
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.pagamentoStatus").value("PENDENTE"))
                .andExpect(jsonPath("$.valorTotal").value(79.90))
                .andExpect(jsonPath("$.precoFinal").value(79.90));
    }

    @Test
    void shouldReturnNotFoundWhenCheckoutOrderDoesNotExist() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Sem Pedido", "5511999997004"));

        mockMvc.perform(get("/api/checkout/{pedidoId}/status", 999L)
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldForbidCheckoutStatusFromAnotherUser() throws Exception {
        Usuario dono = usuarioRepository.save(new Usuario("Cliente Dono", "5511999997005"));
        Usuario outroUsuario = usuarioRepository.save(new Usuario("Cliente Outro", "5511999997006"));
        Produto produto = criarProduto("Saia Privada", "59.90", true);
        CheckoutCriado checkout = criarCheckoutProduto(dono, produto);

        mockMvc.perform(get("/api/checkout/{pedidoId}/status", checkout.pedidoId())
                        .header("Authorization", "Bearer " + jwtService.generateToken(outroUsuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAdminToCheckAnyCheckoutStatus() throws Exception {
        Usuario dono = usuarioRepository.save(new Usuario("Cliente Admin Check", "5511999997007"));
        Usuario admin = new Usuario("Admin Checkout", "5511999997008");
        admin.setRole(UsuarioRole.ADMIN);
        admin = usuarioRepository.save(admin);
        Produto produto = criarProduto("Casaco Admin", "129.90", true);
        CheckoutCriado checkout = criarCheckoutProduto(dono, produto);

        mockMvc.perform(get("/api/checkout/{pedidoId}/status", checkout.pedidoId())
                        .header("Authorization", "Bearer " + jwtService.generateToken(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pedidoId").value(checkout.pedidoId()))
                .andExpect(jsonPath("$.status").value("PENDENTE"));
    }

    @Test
    void shouldReflectPaidStatusAfterWebhookConfirmation() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Pago", "5511999997009"));
        Produto produto = criarProduto("Cropped Pago", "49.90", true);
        CheckoutCriado checkout = criarCheckoutProduto(usuario, produto);
        String payload = payload("evt_checkout_status_paid", "pay_checkout_status_paid",
                checkout.checkoutId(), "PAGO");

        mockMvc.perform(post("/api/pagamentos/infinitepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/checkout/{pedidoId}/status", checkout.pedidoId())
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pedidoId").value(checkout.pedidoId()))
                .andExpect(jsonPath("$.status").value("PAGO"))
                .andExpect(jsonPath("$.pagamentoStatus").value("PAGO"))
                .andExpect(jsonPath("$.valorTotal").value(49.90))
                .andExpect(jsonPath("$.precoFinal").value(49.90));
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

    private CheckoutCriado criarCheckoutProduto(Usuario usuario, Produto produto) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/checkout/produtos/{produtoId}", produto.getId())
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andReturn();

        var json = objectMapper.readTree(result.getResponse().getContentAsString());

        return new CheckoutCriado(
                json.get("pedidoId").asLong(),
                json.get("checkoutId").asText()
        );
    }

    private String payload(String eventId, String paymentId, String checkoutId, String status) {
        return """
                {
                  "eventId": "%s",
                  "paymentId": "%s",
                  "checkoutId": "%s",
                  "status": "%s"
                }
                """.formatted(eventId, paymentId, checkoutId, status);
    }

    private String assinatura(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(
                WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        ));

        return "sha256=" + HexFormat.of()
                .formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    private record CheckoutCriado(Long pedidoId, String checkoutId) {
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
