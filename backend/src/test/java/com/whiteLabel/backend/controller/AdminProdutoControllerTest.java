package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.ProdutoImagem;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.repository.CompartilhamentoAberturaRepository;
import com.whiteLabel.backend.repository.CompartilhamentoItemRepository;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PassoRepository;
import com.whiteLabel.backend.repository.PedidoItemRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.ProdutoImagemRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.endsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminProdutoControllerTest {

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
    private ProdutoImagemRepository produtoImagemRepository;

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

    @Test
    void shouldRequireAdminToListAdminProducts() throws Exception {
        mockMvc.perform(get("/api/admin/produtos").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldCreateProductWithSingleImage() throws Exception {
        Usuario admin = criarAdmin("551199991001");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagem", "principal"))
                        .param("nome", "Vestido Floral")
                        .param("precoVenda", "129.90")
                        .param("precoAntigo", "189.90")
                        .param("precoCusto", "45.50")
                        .param("condicao", "8.50")
                        .param("tamanho", "M")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Vestido Floral"))
                .andExpect(jsonPath("$.condicao").value(8.50))
                .andExpect(jsonPath("$.precoCusto").value(45.50))
                .andExpect(jsonPath("$.imagemUrl").isNotEmpty())
                .andExpect(jsonPath("$.imagens.length()").value(1))
                .andExpect(jsonPath("$.imagens[0].principal").value(true));

        assertEquals(1, produtoRepository.count());
        assertEquals(1, produtoImagemRepository.count());
    }

    @Test
    void shouldCreateProductWithMultipleImagesAndExposePrincipalFirst() throws Exception {
        Usuario admin = criarAdmin("551199991002");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagem", "foto-legada"))
                        .file(imagem("imagens", "foto-1"))
                        .file(imagem("imagens", "foto-2"))
                        .param("nome", "Camisa Linho")
                        .param("precoVenda", "89.90")
                        .param("condicao", "8.75")
                        .param("tamanho", "P")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.condicao").value(8.75))
                .andExpect(jsonPath("$.imagens.length()").value(2))
                .andExpect(jsonPath("$.imagens[0].ordem").value(0))
                .andExpect(jsonPath("$.imagens[0].principal").value(true))
                .andExpect(jsonPath("$.imagens[1].ordem").value(1))
                .andExpect(jsonPath("$.imagens[1].principal").value(false));

        Produto produto = produtoRepository.findAll().get(0);
        List<ProdutoImagem> imagens =
                produtoImagemRepository.findByProdutoIdOrderByOrdemAscIdAsc(produto.getId());
        assertEquals(2, imagens.size());
        assertEquals(produto.getImagemUrl(), imagens.get(0).getUrl());
    }

    @Test
    void shouldCreateProductWithSelectedPrincipalImageIndex() throws Exception {
        Usuario admin = criarAdmin("551199991020");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagens", "foto-1"))
                        .file(imagem("imagens", "foto-2"))
                        .file(imagem("imagens", "foto-3"))
                        .param("nome", "Casaco Principal")
                        .param("precoVenda", "149.90")
                        .param("condicao", "9.00")
                        .param("tamanho", "G")
                        .param("imagemPrincipalIndex", "1")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imagens.length()").value(3))
                .andExpect(jsonPath("$.imagens[0].ordem").value(0))
                .andExpect(jsonPath("$.imagens[0].principal").value(false))
                .andExpect(jsonPath("$.imagens[1].ordem").value(1))
                .andExpect(jsonPath("$.imagens[1].principal").value(true))
                .andExpect(jsonPath("$.imagens[2].ordem").value(2))
                .andExpect(jsonPath("$.imagens[2].principal").value(false));

        Produto produto = produtoRepository.findAll().get(0);
        List<ProdutoImagem> imagens =
                produtoImagemRepository.findByProdutoIdOrderByOrdemAscIdAsc(produto.getId());

        assertEquals(3, imagens.size());
        assertEquals(1, imagens.stream().filter(ProdutoImagem::getPrincipal).count());
        assertEquals(0, imagens.get(0).getOrdem());
        assertEquals(1, imagens.get(1).getOrdem());
        assertEquals(2, imagens.get(2).getOrdem());
        assertEquals(produto.getImagemUrl(), imagens.get(1).getUrl());
    }

    @Test
    void shouldRejectInvalidPrincipalImageIndexOnCreate() throws Exception {
        Usuario admin = criarAdmin("551199991021");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagens", "foto-1"))
                        .file(imagem("imagens", "foto-2"))
                        .param("nome", "Indice Invalido")
                        .param("precoVenda", "79.90")
                        .param("condicao", "8.00")
                        .param("imagemPrincipalIndex", "2")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectCommonUserProductCreation() throws Exception {
        Usuario usuario = criarUsuario("Cliente Comum", "551199991022");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagem", "foto"))
                        .param("nome", "Produto Bloqueado")
                        .param("precoVenda", "59.90")
                        .param("condicao", "8.00")
                        .header("Authorization", bearer(usuario))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAcceptFiveMegabyteImageOnCreate() throws Exception {
        Usuario admin = criarAdmin("551199991023");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagemComTamanho("imagens", 5 * 1024 * 1024))
                        .param("nome", "Foto Cinco Mega")
                        .param("precoVenda", "99.90")
                        .param("condicao", "8.00")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imagens.length()").value(1))
                .andExpect(jsonPath("$.imagens[0].principal").value(true));
    }

    @Test
    void shouldRejectImageAboveFifteenMegabytesWithFriendlyMessage() throws Exception {
        Usuario admin = criarAdmin("551199991024");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagemComTamanho("imagens", (15 * 1024 * 1024) + 1))
                        .param("nome", "Foto Grande")
                        .param("precoVenda", "99.90")
                        .param("condicao", "8.00")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Imagem muito grande. Envie fotos de até 15 MB cada."
                ));
    }

    @Test
    void shouldAcceptMultipleImagesInsideRequestLimit() throws Exception {
        Usuario admin = criarAdmin("551199991025");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagemComTamanho("imagens", 5 * 1024 * 1024))
                        .file(imagemComTamanho("imagens", 5 * 1024 * 1024))
                        .param("nome", "Fotos Dentro Do Limite")
                        .param("precoVenda", "119.90")
                        .param("condicao", "8.00")
                        .param("imagemPrincipalIndex", "1")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imagens.length()").value(2))
                .andExpect(jsonPath("$.imagens[0].principal").value(false))
                .andExpect(jsonPath("$.imagens[1].principal").value(true));
    }

    @Test
    void shouldRejectEmptyImageOnCreate() throws Exception {
        Usuario admin = criarAdmin("551199991026");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(new MockMultipartFile(
                                "imagens",
                                "vazia.webp",
                                "image/webp",
                                new byte[0]
                        ))
                        .param("nome", "Foto Vazia")
                        .param("precoVenda", "49.90")
                        .param("condicao", "8.00")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectConditionWithMoreThanTwoDecimals() throws Exception {
        Usuario admin = criarAdmin("551199991030");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagem", "principal"))
                        .param("nome", "Condicao Invalida")
                        .param("precoVenda", "79.90")
                        .param("condicao", "8.755")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectConditionOutsideRange() throws Exception {
        Usuario admin = criarAdmin("551199991031");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagem", "principal"))
                        .param("nome", "Condicao Fora Do Range")
                        .param("precoVenda", "79.90")
                        .param("condicao", "10.01")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectNegativeCostPrice() throws Exception {
        Usuario admin = criarAdmin("551199991032");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagem", "principal"))
                        .param("nome", "Custo Negativo")
                        .param("precoVenda", "79.90")
                        .param("precoCusto", "-1.00")
                        .param("condicao", "8.00")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldCreateProductWithSingleSafeSvgImage() throws Exception {
        Usuario admin = criarAdmin("551199991033");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(svg("imagem", svgSeguro()))
                        .param("nome", "Camisa SVG")
                        .param("precoVenda", "89.90")
                        .param("condicao", "8.50")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imagemUrl").value(endsWith(".svg")))
                .andExpect(jsonPath("$.imagens.length()").value(1))
                .andExpect(jsonPath("$.imagens[0].url").value(endsWith(".svg")))
                .andExpect(jsonPath("$.imagens[0].principal").value(true));
    }

    @Test
    void shouldCreateProductWithMultipleImagesIncludingSvg() throws Exception {
        Usuario admin = criarAdmin("551199991034");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagens", "foto-webp"))
                        .file(svg("imagens", svgSeguro()))
                        .param("nome", "Mix SVG")
                        .param("precoVenda", "99.90")
                        .param("condicao", "8.50")
                        .param("imagemPrincipalIndex", "1")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imagemUrl").value(endsWith(".svg")))
                .andExpect(jsonPath("$.imagens.length()").value(2))
                .andExpect(jsonPath("$.imagens[0].url").value(endsWith(".webp")))
                .andExpect(jsonPath("$.imagens[0].principal").value(false))
                .andExpect(jsonPath("$.imagens[1].url").value(endsWith(".svg")))
                .andExpect(jsonPath("$.imagens[1].principal").value(true));
    }

    @Test
    void shouldRejectSvgWithScriptOnCreate() throws Exception {
        Usuario admin = criarAdmin("551199991035");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(svg("imagem", "<svg><script>alert(1)</script></svg>"))
                        .param("nome", "SVG Script")
                        .param("precoVenda", "79.90")
                        .param("condicao", "8.00")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("SVG inválido ou inseguro."));
    }

    @Test
    void shouldRejectSvgWithJavascriptUrlOnCreate() throws Exception {
        Usuario admin = criarAdmin("551199991036");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(svg("imagem", "<svg><a href=\"javascript:alert(1)\" /></svg>"))
                        .param("nome", "SVG Javascript")
                        .param("precoVenda", "79.90")
                        .param("condicao", "8.00")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("SVG inválido ou inseguro."));
    }

    @Test
    void shouldRejectSvgWithEventHandlerAttributeOnCreate() throws Exception {
        Usuario admin = criarAdmin("551199991037");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(svg("imagem", "<svg><image onfocus=\"alert(1)\" /></svg>"))
                        .param("nome", "SVG Evento")
                        .param("precoVenda", "79.90")
                        .param("condicao", "8.00")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("SVG inválido ou inseguro."));
    }

    @Test
    void shouldKeepAcceptingJpgPngAndWebpImages() throws Exception {
        Usuario admin = criarAdmin("551199991038");

        mockMvc.perform(multipart("/api/admin/produtos")
                        .file(imagem("imagens", "foto.jpg", "image/jpeg", "jpg"))
                        .file(imagem("imagens", "foto.png", "image/png", "png"))
                        .file(imagem("imagens", "foto.webp", "image/webp", "webp"))
                        .param("nome", "Raster OK")
                        .param("precoVenda", "119.90")
                        .param("condicao", "9.00")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imagens.length()").value(3));
    }

    @Test
    void shouldUpdateBasicProductFields() throws Exception {
        Usuario admin = criarAdmin("551199991003");
        Produto produto = criarProdutoComImagens("Saia Midi", "/uploads/saia-1.webp").produto();

        mockMvc.perform(multipart("/api/admin/produtos/{id}", produto.getId())
                        .param("nome", "Saia Midi Editada")
                        .param("precoVenda", "119.90")
                        .param("precoAntigo", "159.90")
                        .param("precoCusto", "55.50")
                        .param("condicao", "7.25")
                        .param("tamanho", "G")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Saia Midi Editada"))
                .andExpect(jsonPath("$.precoVenda").value(119.90))
                .andExpect(jsonPath("$.precoAntigo").value(159.90))
                .andExpect(jsonPath("$.precoCusto").value(55.50))
                .andExpect(jsonPath("$.condicao").value(7.25))
                .andExpect(jsonPath("$.tamanho").value("G"));
    }

    @Test
    void shouldAddNewPhotoToProduct() throws Exception {
        Usuario admin = criarAdmin("551199991004");
        Produto produto = criarProdutoComImagens("Blazer", "/uploads/blazer-1.webp").produto();

        mockMvc.perform(multipart("/api/admin/produtos/{id}", produto.getId())
                        .file(imagem("novasImagens", "foto-nova"))
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagens.length()").value(2))
                .andExpect(jsonPath("$.imagens[0].principal").value(true));

        assertEquals(2, produtoImagemRepository.count());
    }

    @Test
    void shouldAddSafeSvgImageOnEdit() throws Exception {
        Usuario admin = criarAdmin("551199991039");
        Produto produto = criarProdutoComImagens("Blazer SVG", "/uploads/blazer-1.webp")
                .produto();

        mockMvc.perform(multipart("/api/admin/produtos/{id}", produto.getId())
                        .file(svg("novasImagens", svgSeguro()))
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagens.length()").value(2))
                .andExpect(jsonPath("$.imagens[1].url").value(endsWith(".svg")));
    }

    @Test
    void shouldRejectOversizedNewImageOnEdit() throws Exception {
        Usuario admin = criarAdmin("551199991027");
        Produto produto = criarProdutoComImagens("Blazer Grande", "/uploads/blazer-grande.webp")
                .produto();

        mockMvc.perform(multipart("/api/admin/produtos/{id}", produto.getId())
                        .file(imagemComTamanho("novasImagens", (15 * 1024 * 1024) + 1))
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Imagem muito grande. Envie fotos de até 15 MB cada."
                ));
    }

    @Test
    void shouldRemoveExistingPhoto() throws Exception {
        Usuario admin = criarAdmin("551199991005");
        ProdutoCriado produtoCriado = criarProdutoComImagens(
                "Calca Jeans",
                "/uploads/calca-1.webp",
                "/uploads/calca-2.webp"
        );
        Long imagemRemovidaId = produtoCriado.imagens().get(1).getId();

        mockMvc.perform(multipart("/api/admin/produtos/{id}", produtoCriado.produto().getId())
                        .param("imagensRemovidas", imagemRemovidaId.toString())
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagens.length()").value(1));

        assertEquals(1, produtoImagemRepository.count());
    }

    @Test
    void shouldReorderPhotosAndChangePrincipalImage() throws Exception {
        Usuario admin = criarAdmin("551199991006");
        ProdutoCriado produtoCriado = criarProdutoComImagens(
                "Conjunto",
                "/uploads/conjunto-1.webp",
                "/uploads/conjunto-2.webp",
                "/uploads/conjunto-3.webp"
        );
        Long primeiraId = produtoCriado.imagens().get(0).getId();
        Long segundaId = produtoCriado.imagens().get(1).getId();
        Long terceiraId = produtoCriado.imagens().get(2).getId();

        mockMvc.perform(multipart("/api/admin/produtos/{id}", produtoCriado.produto().getId())
                        .param("imagemPrincipalId", segundaId.toString())
                        .param(
                                "ordemImagens",
                                "[{\"id\":%d,\"ordem\":0},{\"id\":%d,\"ordem\":1},{\"id\":%d,\"ordem\":2}]"
                                        .formatted(segundaId, primeiraId, terceiraId)
                        )
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagemUrl").value("/uploads/conjunto-2.webp"))
                .andExpect(jsonPath("$.imagens[0].id").value(segundaId))
                .andExpect(jsonPath("$.imagens[0].ordem").value(0))
                .andExpect(jsonPath("$.imagens[0].principal").value(true))
                .andExpect(jsonPath("$.imagens[1].id").value(primeiraId))
                .andExpect(jsonPath("$.imagens[1].ordem").value(1));

        Produto atualizado = produtoRepository.findById(produtoCriado.produto().getId())
                .orElseThrow();
        assertEquals("/uploads/conjunto-2.webp", atualizado.getImagemUrl());
    }

    @Test
    void shouldListAdminProductsFromNewestFirst() throws Exception {
        Usuario admin = criarAdmin("551199991007");
        Produto antigo = criarProdutoComImagens("Produto Antigo", "/uploads/antigo.webp")
                .produto();
        Produto novo = criarProdutoComImagens("Produto Novo", "/uploads/novo.webp")
                .produto();
        novo.setPrecoCusto(BigDecimal.valueOf(39.90));
        produtoRepository.save(novo);

        mockMvc.perform(get("/api/admin/produtos")
                        .header("Authorization", bearer(admin))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(novo.getId()))
                .andExpect(jsonPath("$[0].precoCusto").value(39.90))
                .andExpect(jsonPath("$[1].id").value(antigo.getId()));
    }

    @Test
    void shouldKeepPublicProductListWorkingWithImages() throws Exception {
        ProdutoCriado produtoCriado = criarProdutoComImagens(
                "Macacao",
                "/uploads/macacao-1.webp",
                "/uploads/macacao-2.webp"
        );

        mockMvc.perform(get("/api/produtos").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(produtoCriado.produto().getId()))
                .andExpect(jsonPath("$[0].imagemUrl").value("/uploads/macacao-1.webp"))
                .andExpect(jsonPath("$[0].condicao").value(8.50))
                .andExpect(jsonPath("$[0].precoCusto").doesNotExist())
                .andExpect(jsonPath("$[0].imagens.length()").value(2))
                .andExpect(jsonPath("$[0].imagens[0].principal").value(true));
    }

    private void limparDados() {
        pagamentoRepository.deleteAll();
        pedidoItemRepository.deleteAll();
        pedidoRepository.deleteAll();
        compartilhamentoAberturaRepository.deleteAll();
        compartilhamentoItemRepository.deleteAll();
        usuarioMissaoSemanalRepository.deleteAll();
        usuarioMissaoRepository.deleteAll();
        curtidaRepository.deleteAll();
        passoRepository.deleteAll();
        produtoImagemRepository.deleteAll();
        produtoRepository.deleteAll();
        missaoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    private Usuario criarAdmin(String telefone) {
        Usuario admin = new Usuario("Admin Produtos", telefone);
        admin.setEmail(telefone + "@admin.test");
        admin.setPassword("senha-ja-codificada");
        admin.setRole(UsuarioRole.ADMIN);
        return usuarioRepository.save(admin);
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private ProdutoCriado criarProdutoComImagens(String nome, String... urls) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(BigDecimal.valueOf(99.90));
        produto.setCondicao(new BigDecimal("8.50"));
        produto.setImagemUrl(urls[0]);
        produto = produtoRepository.save(produto);

        List<ProdutoImagem> imagens = new ArrayList<>();
        for (int ordem = 0; ordem < urls.length; ordem++) {
            imagens.add(new ProdutoImagem(produto, urls[ordem], ordem, ordem == 0));
        }
        imagens = produtoImagemRepository.saveAll(imagens);

        return new ProdutoCriado(produto, imagens);
    }

    private MockMultipartFile imagem(String campo, String conteudo) {
        return imagem(campo, campo + ".webp", "image/webp", conteudo);
    }

    private MockMultipartFile imagem(
            String campo,
            String nomeArquivo,
            String contentType,
            String conteudo
    ) {
        return new MockMultipartFile(
                campo,
                nomeArquivo,
                contentType,
                conteudo.getBytes(StandardCharsets.UTF_8)
        );
    }

    private MockMultipartFile svg(String campo, String conteudo) {
        return imagem(campo, campo + ".svg", "image/svg+xml", conteudo);
    }

    private String svgSeguro() {
        return """
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
                    <path d="M1 1h8v8H1z" fill="#687152"/>
                </svg>
                """;
    }

    private MockMultipartFile imagemComTamanho(String campo, int tamanhoBytes) {
        return new MockMultipartFile(
                campo,
                campo + ".webp",
                "image/webp",
                new byte[tamanhoBytes]
        );
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario);
    }

    private record ProdutoCriado(Produto produto, List<ProdutoImagem> imagens) {
    }
}
