package com.whiteLabel.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whiteLabel.backend.domain.PedidoStatus;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.repository.CompartilhamentoAberturaRepository;
import com.whiteLabel.backend.repository.CompartilhamentoItemRepository;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PassoRepository;
import com.whiteLabel.backend.repository.PedidoItemRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PagamentoWebhookControllerTest {

    private static final String WEBHOOK_SECRET = "test-payment-webhook-secret";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

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
    void shouldNotConfirmOrderWhenWebhookSignatureIsInvalid() throws Exception {
        CheckoutCriado checkout = criarCheckout();
        String payload = payload("evt_invalid", "pay_invalid", checkout.checkoutId(), "PAGO");

        mockMvc.perform(post("/api/pagamentos/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", "assinatura-invalida")
                        .content(payload))
                .andExpect(status().isUnauthorized());

        assertEquals(PedidoStatus.AGUARDANDO_PAGAMENTO,
                pedidoRepository.findById(checkout.pedidoId()).orElseThrow().getStatus());
    }

    @Test
    void shouldConfirmOrderOnlyAfterValidSignedWebhook() throws Exception {
        CheckoutCriado checkout = criarCheckout();
        String payload = payload("evt_paid", "pay_paid", checkout.checkoutId(), "PAGO");

        mockMvc.perform(post("/api/pagamentos/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventId").value("evt_paid"))
                .andExpect(jsonPath("$.paymentId").value("pay_paid"))
                .andExpect(jsonPath("$.pedidoId").value(checkout.pedidoId()))
                .andExpect(jsonPath("$.status").value("PAGO"))
                .andExpect(jsonPath("$.duplicado").value(false));

        assertEquals(PedidoStatus.PAGO,
                pedidoRepository.findById(checkout.pedidoId()).orElseThrow().getStatus());
    }

    @Test
    void shouldHandleDuplicateWebhookWithoutDuplicatingPaymentEffect() throws Exception {
        CheckoutCriado checkout = criarCheckout();
        String payload = payload("evt_duplicate", "pay_duplicate", checkout.checkoutId(), "PAGO");
        String assinatura = assinatura(payload);

        mockMvc.perform(post("/api/pagamentos/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicado").value(false));

        mockMvc.perform(post("/api/pagamentos/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicado").value(true));

        assertEquals(1, pagamentoRepository.count());
        assertEquals(PedidoStatus.PAGO,
                pedidoRepository.findById(checkout.pedidoId()).orElseThrow().getStatus());
    }

    private CheckoutCriado criarCheckout() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Pagamento", "5511999995001"));
        Produto produto = criarProduto("Camisa Checkout");

        MvcResult result = mockMvc.perform(post("/api/pedidos/checkout")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "itens": [
                                    {
                                      "produtoId": %d,
                                      "quantidade": 1
                                    }
                                  ]
                                }
                                """.formatted(produto.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AGUARDANDO_PAGAMENTO"))
                .andReturn();

        var json = objectMapper.readTree(result.getResponse().getContentAsString());

        return new CheckoutCriado(
                json.get("pedidoId").asLong(),
                json.get("checkoutId").asText()
        );
    }

    private Produto criarProduto(String nome) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(BigDecimal.valueOf(89.90));
        produto.setImagemUrl("/uploads/" + nome.toLowerCase().replace(" ", "-") + ".jpg");

        return produtoRepository.save(produto);
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
}
