package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Pagamento;
import com.whiteLabel.backend.domain.Pedido;
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
import com.whiteLabel.backend.repository.ProdutoReservaRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.RoletaInteracaoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoSemanalRepository;
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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UsuarioControllerTest {

    private static final String WEBHOOK_SECRET = "test-payment-webhook-secret";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProdutoReservaRepository produtoReservaRepository;

    @Autowired
    private RoletaInteracaoRepository roletaInteracaoRepository;

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
        limparDados();
    }

    @AfterEach
    void tearDown() {
        limparDados();
    }

    private void limparDados() {
        roletaInteracaoRepository.deleteAll();
        pagamentoRepository.deleteAll();
        produtoReservaRepository.deleteAll();
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
    void shouldReturnAuthenticatedUserProfileForSidebar() throws Exception {
        Usuario usuario = new Usuario("Cliente Menu", "5511999996001");
        usuario.setXp(120);
        usuario.setNivel(2);
        Usuario salvo = usuarioRepository.save(usuario);

        mockMvc.perform(get("/api/usuarios/me")
                        .header("Authorization", "Bearer " + jwtService.generateToken(salvo))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(salvo.getId().toString()))
                .andExpect(jsonPath("$.nome").value("Cliente Menu"))
                .andExpect(jsonPath("$.telefone").value("5511999996001"))
                .andExpect(jsonPath("$.level").value(2))
                .andExpect(jsonPath("$.xpAtual").value(120))
                .andExpect(jsonPath("$.xpParaProximoNivel").value(283))
                .andExpect(jsonPath("$.endereco").exists())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.otp").doesNotExist());
    }

    @Test
    void shouldRequireAuthenticationForUserProfile() throws Exception {
        mockMvc.perform(get("/api/usuarios/me").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRequireAuthenticationForUserAddressUpdate() throws Exception {
        mockMvc.perform(put("/api/usuarios/me/endereco")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRequireAuthenticationForUserResgates() throws Exception {
        mockMvc.perform(get("/api/usuarios/me/resgates")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldSaveAddressAndReturnItInUserProfile() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Endereco", "5511999996002"));

        mockMvc.perform(put("/api/usuarios/me/endereco")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rua": " Rua Exemplo ",
                                  "numero": "123",
                                  "complemento": "Apto 2",
                                  "bairro": "Centro",
                                  "cidade": "Santo Antonio da Patrulha",
                                  "estado": " rs ",
                                  "cep": "95500-000"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endereco.rua").value("Rua Exemplo"))
                .andExpect(jsonPath("$.endereco.numero").value("123"))
                .andExpect(jsonPath("$.endereco.complemento").value("Apto 2"))
                .andExpect(jsonPath("$.endereco.bairro").value("Centro"))
                .andExpect(jsonPath("$.endereco.cidade").value("Santo Antonio da Patrulha"))
                .andExpect(jsonPath("$.endereco.estado").value("RS"))
                .andExpect(jsonPath("$.endereco.cep").value("95500000"));

        mockMvc.perform(get("/api/usuarios/me")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endereco.rua").value("Rua Exemplo"))
                .andExpect(jsonPath("$.endereco.estado").value("RS"))
                .andExpect(jsonPath("$.endereco.cep").value("95500000"));
    }

    @Test
    void shouldRejectInvalidAddressState() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Estado Invalido", "5511999996003"));

        mockMvc.perform(put("/api/usuarios/me/endereco")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "estado": "RGS"
                                }
                                """)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Estado deve ter 2 letras"));
    }

    @Test
    void shouldReturnEmptyResgatesForAuthenticatedUserWithoutPurchases() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Sem Compras", "5511999996004"));

        mockMvc.perform(get("/api/usuarios/me/resgates")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldReturnBoughtItemAfterApprovedWebhook() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Comprador", "5511999996005"));
        Produto produto = criarProduto("Jaqueta Jeans", "79.90", "M");
        Pagamento pagamento = criarPedidoComPagamento(
                usuario,
                produto,
                "checkout_usuario_pago",
                "79.90",
                "10.00",
                "69.90"
        );
        String payload = payload("evt_usuario_pago", "pay_usuario_pago", pagamento.getCheckoutId(), "PAGO");

        mockMvc.perform(post("/api/pagamentos/infinitepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGO"));

        mockMvc.perform(get("/api/usuarios/me/resgates")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].pedidoId").value(pagamento.getPedido().getId()))
                .andExpect(jsonPath("$[0].produtoId").value(produto.getId()))
                .andExpect(jsonPath("$[0].nomeProduto").value("Jaqueta Jeans"))
                .andExpect(jsonPath("$[0].imagemUrl").value("/uploads/jaqueta-jeans.webp"))
                .andExpect(jsonPath("$[0].tamanho").value("M"))
                .andExpect(jsonPath("$[0].valorOriginal").value(79.90))
                .andExpect(jsonPath("$[0].descontoAplicado").value(10.00))
                .andExpect(jsonPath("$[0].valorPago").value(69.90))
                .andExpect(jsonPath("$[0].statusPedido").value("PAGO"))
                .andExpect(jsonPath("$[0].statusPagamento").value("PAGO"))
                .andExpect(jsonPath("$[0].criadoEm").exists())
                .andExpect(jsonPath("$[0].pagoEm").exists());
    }

    @Test
    void shouldReturnPendingOrderWithoutMarkingItAsPaid() throws Exception {
        Usuario usuario = usuarioRepository.save(new Usuario("Cliente Pendente", "5511999996006"));
        Produto produto = criarProduto("Vestido Pendente", "99.90", "P");
        Pagamento pagamento = criarPedidoComPagamento(
                usuario,
                produto,
                "checkout_usuario_pendente",
                "99.90",
                "0.00",
                "99.90"
        );

        mockMvc.perform(get("/api/usuarios/me/resgates")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].pedidoId").value(pagamento.getPedido().getId()))
                .andExpect(jsonPath("$[0].statusPedido").value("AGUARDANDO_PAGAMENTO"))
                .andExpect(jsonPath("$[0].statusPagamento").value("AGUARDANDO_PAGAMENTO"))
                .andExpect(jsonPath("$[0].pagoEm").doesNotExist());
    }

    @Test
    void shouldNotReturnPurchasesFromAnotherUser() throws Exception {
        Usuario usuarioA = usuarioRepository.save(new Usuario("Cliente A", "5511999996007"));
        Usuario usuarioB = usuarioRepository.save(new Usuario("Cliente B", "5511999996008"));
        Produto produto = criarProduto("Cropped Privado", "49.90", "G");
        Pagamento pagamento = criarPedidoComPagamento(
                usuarioB,
                produto,
                "checkout_usuario_b",
                "49.90",
                "0.00",
                "49.90"
        );
        String payload = payload("evt_usuario_b_pago", "pay_usuario_b_pago", pagamento.getCheckoutId(), "PAGO");

        mockMvc.perform(post("/api/pagamentos/infinitepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Payment-Signature", assinatura(payload))
                        .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/usuarios/me/resgates")
                        .header("Authorization", "Bearer " + jwtService.generateToken(usuarioA))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    private Produto criarProduto(String nome, String precoVenda, String tamanho) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(new BigDecimal(precoVenda));
        produto.setTamanho(tamanho);
        produto.setImagemUrl("/uploads/" + nome.toLowerCase().replace(" ", "-") + ".webp");
        return produtoRepository.save(produto);
    }

    private Pagamento criarPedidoComPagamento(
            Usuario usuario,
            Produto produto,
            String checkoutId,
            String valorOriginal,
            String descontoAplicado,
            String valorPago
    ) {
        Pedido pedido = new Pedido(usuario);
        BigDecimal valorPagoDecimal = new BigDecimal(valorPago);
        pedido.adicionarItem(produto, 1, valorPagoDecimal);
        pedido.registrarCheckoutProduto(
                produto,
                new BigDecimal(valorOriginal),
                new BigDecimal(descontoAplicado),
                valorPagoDecimal
        );
        pedido.definirOrderNsu(checkoutId);
        pedido.aguardarPagamento();
        Pedido pedidoSalvo = pedidoRepository.saveAndFlush(pedido);

        Pagamento pagamento = new Pagamento(pedidoSalvo, checkoutId, "INFINITEPAY");
        return pagamentoRepository.saveAndFlush(pagamento);
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
}
