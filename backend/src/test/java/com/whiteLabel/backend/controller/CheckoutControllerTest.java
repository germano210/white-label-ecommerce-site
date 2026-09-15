package com.whiteLabel.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whiteLabel.backend.domain.PedidoStatus;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.ProdutoReservaStatus;
import com.whiteLabel.backend.domain.ProdutoStatus;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.dto.InfinitePayLinkRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkResponse;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PedidoItemRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.ProdutoReservaRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.RoletaInteracaoRepository;
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
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
    private ProdutoReservaRepository produtoReservaRepository;

    @Autowired
    private RoletaInteracaoRepository roletaInteracaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        roletaInteracaoRepository.deleteAll();
        pagamentoRepository.deleteAll();
        produtoReservaRepository.deleteAll();
        pedidoItemRepository.deleteAll();
        pedidoRepository.deleteAll();
        produtoRepository.deleteAll();
        usuarioRepository.deleteAll();
        infinitePayClient.reset();
    }

    @AfterEach
    void tearDown() {
        roletaInteracaoRepository.deleteAll();
        pagamentoRepository.deleteAll();
        produtoReservaRepository.deleteAll();
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

    @Test
    void shouldReserveProductAndExposeItAsUnavailableForAnotherUser() throws Exception {
        Usuario usuarioA = usuarioRepository.save(new Usuario("Cliente Reserva A", "5511999997010"));
        Usuario usuarioB = usuarioRepository.save(new Usuario("Cliente Reserva B", "5511999997011"));
        Produto produto = criarProduto("Jaqueta Reservada", "149.90", true);

        mockMvc.perform(post("/api/checkout/reservas")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuarioA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d]
                                }
                                """.formatted(produto.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reservas[0].produtoId").value(produto.getId()))
                .andExpect(jsonPath("$.reservas[0].reservadoPorMim").value(true));

        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuarioB))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(produto.getId()))
                .andExpect(jsonPath("$[0].status").value("RESERVADO"))
                .andExpect(jsonPath("$[0].reservado").value(true))
                .andExpect(jsonPath("$[0].reservadoPorMim").value(false))
                .andExpect(jsonPath("$[0].reservadoAte").exists());

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuarioB))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d]
                                }
                                """.formatted(produto.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Produto nao esta reservado para este usuario"));
    }

    @Test
    void shouldCreateCheckoutWithSingleReservedProductArrayAndSendOneInfinitePayItem() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Checkout Array", "5511999997012"));
        Produto jaqueta = criarProduto("Jaqueta Checkout", "120.00", true);

        reservarProdutos(usuario, jaqueta.getId());

        MvcResult result = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d]
                                }
                                """.formatted(jaqueta.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.checkoutUrl").value("https://checkout.infinitepay.com.br/teste"))
                .andExpect(jsonPath("$.status").value("AGUARDANDO_PAGAMENTO"))
                .andExpect(jsonPath("$.precoFinal").value(120.00))
                .andReturn();

        var json = objectMapper.readTree(result.getResponse().getContentAsString());
        Long pedidoId = json.get("pedidoId").asLong();

        InfinitePayLinkRequest request = infinitePayClient.ultimaRequest;
        assertNotNull(request);
        assertEquals(pedidoId.toString(), request.orderNsu());
        assertEquals(1, request.items().size());
        assertEquals(12000L, request.items().get(0).price());
        assertEquals("Jaqueta Checkout", request.items().get(0).description());
        Integer totalItens = jdbcTemplate.queryForObject(
                "select count(*) from pedido_itens where pedido_id = ?",
                Integer.class,
                pedidoId
        );
        assertEquals(1, totalItens);
        assertEquals(1, produtoReservaRepository.findByPedidoId(pedidoId).size());
    }

    @Test
    void shouldRejectReservationWithMoreThanOneProductId() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Reserva Dupla", "5511999997019"));
        Produto blusa = criarProduto("Blusa Reserva Dupla", "60.00", true);
        Produto saia = criarProduto("Saia Reserva Dupla", "70.00", true);

        mockMvc.perform(post("/api/checkout/reservas")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d, %d]
                                }
                                """.formatted(blusa.getId(), saia.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Checkout permite apenas um produto por vez"));

        assertEquals(0, produtoReservaRepository.count());
        assertEquals(ProdutoStatus.DISPONIVEL,
                produtoRepository.findById(blusa.getId()).orElseThrow().getStatus());
        assertEquals(ProdutoStatus.DISPONIVEL,
                produtoRepository.findById(saia.getId()).orElseThrow().getStatus());
    }

    @Test
    void shouldRejectCheckoutWithMoreThanOneProductId() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Checkout Duplo", "5511999997020"));
        Produto blusa = criarProduto("Blusa Checkout Duplo", "60.00", true);
        Produto saia = criarProduto("Saia Checkout Duplo", "70.00", true);

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d, %d]
                                }
                                """.formatted(blusa.getId(), saia.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Checkout permite apenas um produto por vez"));

        assertEquals(0, pedidoRepository.count());
        assertEquals(0, produtoReservaRepository.count());
    }

    @Test
    void shouldRejectLegacyPedidoCheckoutWithMoreThanOneItem() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Pedido Duplo", "5511999997021"));
        Produto blusa = criarProduto("Blusa Pedido Duplo", "60.00", true);
        Produto saia = criarProduto("Saia Pedido Duplo", "70.00", true);

        mockMvc.perform(post("/api/pedidos/checkout")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "itens": [
                                    {
                                      "produtoId": %d,
                                      "quantidade": 1
                                    },
                                    {
                                      "produtoId": %d,
                                      "quantidade": 1
                                    }
                                  ]
                                }
                                """.formatted(blusa.getId(), saia.getId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Checkout permite apenas um produto por vez"));

        assertEquals(0, pedidoRepository.count());
        assertEquals(0, produtoReservaRepository.count());
    }

    @Test
    void shouldMarkReservedProductAsSoldWhenPaymentIsApproved() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Venda Unica", "5511999997013"));
        Produto blusa = criarProduto("Blusa Vendida", "60.00", true);
        reservarProdutos(usuario, blusa.getId());
        CheckoutCriado checkout = criarCheckoutPorProdutoIds(usuario, blusa.getId());
        String payload = payload("evt_single_paid", "pay_single_paid", checkout.checkoutId(), "PAGO");

        mockMvc.perform(post("/api/pagamentos/infinitepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGO"));

        assertEquals(PedidoStatus.PAGO, pedidoRepository.findById(checkout.pedidoId()).orElseThrow().getStatus());
        assertEquals(ProdutoStatus.VENDIDO, produtoRepository.findById(blusa.getId()).orElseThrow().getStatus());
        assertFalse(produtoRepository.findById(blusa.getId()).orElseThrow().getAtivo());
        assertEquals(1, produtoReservaRepository.findByPedidoId(checkout.pedidoId())
                .stream()
                .filter(reserva -> reserva.getStatus() == ProdutoReservaStatus.FINALIZADA)
                .count());
    }

    @Test
    void shouldReleaseReservedProductWhenPaymentIsCanceled() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Cancela Checkout", "5511999997014"));
        Produto produto = criarProduto("Produto Cancelado", "90.00", true);
        reservarProdutos(usuario, produto.getId());
        CheckoutCriado checkout = criarCheckoutPorProdutoIds(usuario, produto.getId());
        String payload = payload("evt_single_cancel", "pay_single_cancel", checkout.checkoutId(), "CANCELADO");

        mockMvc.perform(post("/api/pagamentos/infinitepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADO"));

        Produto atualizado = produtoRepository.findById(produto.getId()).orElseThrow();
        assertEquals(ProdutoStatus.DISPONIVEL, atualizado.getStatus());
        assertTrue(atualizado.getAtivo());
        assertEquals(ProdutoReservaStatus.CANCELADA,
                produtoReservaRepository.findByPedidoId(checkout.pedidoId()).get(0).getStatus());
    }

    @Test
    void shouldReleaseReservedProductWhenPaymentExpires() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Expira Checkout", "5511999997018"));
        Produto produto = criarProduto("Produto Checkout Expirado", "90.00", true);
        reservarProdutos(usuario, produto.getId());
        CheckoutCriado checkout = criarCheckoutPorProdutoIds(usuario, produto.getId());
        String payload = payload("evt_single_expired", "pay_single_expired", checkout.checkoutId(), "EXPIRADO");

        mockMvc.perform(post("/api/pagamentos/infinitepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EXPIRADO"));

        Produto atualizado = produtoRepository.findById(produto.getId()).orElseThrow();
        assertEquals(ProdutoStatus.DISPONIVEL, atualizado.getStatus());
        assertTrue(atualizado.getAtivo());
        assertEquals(ProdutoReservaStatus.EXPIRADA,
                produtoReservaRepository.findByPedidoId(checkout.pedidoId()).get(0).getStatus());
    }

    @Test
    void shouldReleaseExpiredReservationBeforeListingProducts() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Reserva Expirada", "5511999997015"));
        Produto produto = criarProduto("Produto Expirado", "45.00", true);
        reservarProdutos(usuario, produto.getId());
        jdbcTemplate.update(
                "update produto_reservas set expira_em = ? where produto_id = ?",
                LocalDateTime.now().minusMinutes(1),
                produto.getId()
        );

        mockMvc.perform(get("/api/produtos")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(produto.getId()))
                .andExpect(jsonPath("$[0].status").value("DISPONIVEL"))
                .andExpect(jsonPath("$[0].reservado").value(false))
                .andExpect(jsonPath("$[0].reservadoPorMim").value(false));

        assertEquals(ProdutoReservaStatus.EXPIRADA,
                produtoReservaRepository.findAll().get(0).getStatus());
        assertEquals(ProdutoStatus.DISPONIVEL,
                produtoRepository.findById(produto.getId()).orElseThrow().getStatus());
    }

    @Test
    void shouldNotCreateDuplicateReservationWhenTwoUsersTryTogether() throws Exception {
        Usuario usuarioA = usuarioRepository.save(new Usuario("Cliente Corrida A", "5511999997016"));
        Usuario usuarioB = usuarioRepository.save(new Usuario("Cliente Corrida B", "5511999997017"));
        Produto produto = criarProduto("Produto Corrida", "75.00", true);
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<Integer> reservaA = executor.submit(() -> reservarProdutoStatus(usuarioA, produto.getId(), largada));
            Future<Integer> reservaB = executor.submit(() -> reservarProdutoStatus(usuarioB, produto.getId(), largada));
            largada.countDown();

            List<Integer> statuses = List.of(
                    reservaA.get(5, TimeUnit.SECONDS),
                    reservaB.get(5, TimeUnit.SECONDS)
            );

            assertTrue(statuses.contains(201));
            assertTrue(statuses.contains(409));
        } finally {
            executor.shutdownNow();
        }

        assertEquals(1, produtoReservaRepository.findByProdutoIdInAndStatus(
                List.of(produto.getId()),
                ProdutoReservaStatus.ATIVA
        ).size());
        assertEquals(ProdutoStatus.RESERVADO,
                produtoRepository.findById(produto.getId()).orElseThrow().getStatus());
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

    private CheckoutCriado criarCheckoutPorProdutoIds(Usuario usuario, Long... produtoIds) throws Exception {
        String ids = List.of(produtoIds)
                .stream()
                .map(String::valueOf)
                .collect(java.util.stream.Collectors.joining(", "));
        MvcResult result = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%s]
                                }
                                """.formatted(ids))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andReturn();

        var json = objectMapper.readTree(result.getResponse().getContentAsString());

        return new CheckoutCriado(
                json.get("pedidoId").asLong(),
                json.get("checkoutId").asText()
        );
    }

    private void reservarProdutos(Usuario usuario, Long... produtoIds) throws Exception {
        String ids = List.of(produtoIds)
                .stream()
                .map(String::valueOf)
                .collect(java.util.stream.Collectors.joining(", "));

        mockMvc.perform(post("/api/checkout/reservas")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%s]
                                }
                                """.formatted(ids))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());
    }

    private Integer reservarProdutoStatus(
            Usuario usuario,
            Long produtoId,
            CountDownLatch largada
    ) throws Exception {
        largada.await();
        return mockMvc.perform(post("/api/checkout/reservas")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoIds": [%d]
                                }
                                """.formatted(produtoId))
                        .accept(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse()
                .getStatus();
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
