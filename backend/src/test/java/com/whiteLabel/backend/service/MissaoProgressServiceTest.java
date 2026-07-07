package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioMissao;
import com.whiteLabel.backend.dto.CurtidaResponseDTO;
import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioMissaoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class MissaoProgressServiceTest {

    @Autowired
    private MissaoService missaoService;

    @Autowired
    private CurtidaService curtidaService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MissaoRepository missaoRepository;

    @Autowired
    private UsuarioMissaoRepository usuarioMissaoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private CurtidaRepository curtidaRepository;

    @BeforeEach
    void setUp() {
        usuarioMissaoRepository.deleteAll();
        curtidaRepository.deleteAll();
        produtoRepository.deleteAll();
        missaoRepository.deleteAll();
        usuarioRepository.deleteAll();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldShowZeroProgressForUserWithoutProgress() {
        criarMissao("Curtir tres pecas", 3, 100, 1);
        Usuario usuario = criarUsuario("Cliente A", "5511999990001");
        autenticar(usuario);

        List<MissaoResponse> resposta = missaoService.listar();

        assertEquals(1, resposta.size());
        assertEquals(0, resposta.get(0).progresso());
        assertFalse(resposta.get(0).concluida());
    }

    @Test
    void shouldCreateMissionProgressWhenUserLikesProduct() {
        Missao missao = criarMissao("Curtir tres pecas", 3, 100, 1);
        Usuario usuario = criarUsuario("Cliente A", "5511999990002");
        Produto produto = criarProduto("Camisa");
        autenticar(usuario);

        CurtidaResponseDTO resposta = curtidaService.curtir(produto.getId());

        UsuarioMissao progresso = usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(usuario.getId(), missao.getId())
                .orElseThrow();
        assertEquals(1, progresso.getProgressoAtual());
        assertFalse(progresso.getConcluida());
        assertEquals(1, resposta.missoes().size());
        assertEquals(1, resposta.missoes().get(0).progresso());
    }

    @Test
    void shouldCompleteMissionAfterThreeDistinctLikes() {
        Missao missao = criarMissao("Curtir tres pecas", 3, 20, 2);
        Usuario usuario = criarUsuario("Cliente A", "5511999990003");
        autenticar(usuario);

        curtidaService.curtir(criarProduto("Camisa").getId());
        curtidaService.curtir(criarProduto("Calca").getId());
        curtidaService.curtir(criarProduto("Saia").getId());

        UsuarioMissao progresso = usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(usuario.getId(), missao.getId())
                .orElseThrow();
        Usuario usuarioAtualizado = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertEquals(3, progresso.getProgressoAtual());
        assertTrue(progresso.getConcluida());
        assertTrue(progresso.getRecompensaResgatada());
        assertEquals(40, progresso.getXpConcedido());
        assertTrue(usuarioAtualizado.getXp() >= 40);
    }

    @Test
    void shouldNotIncrementProgressForDuplicateLike() {
        Missao missao = criarMissao("Curtir tres pecas", 3, 100, 1);
        Usuario usuario = criarUsuario("Cliente A", "5511999990004");
        Produto produto = criarProduto("Camisa");
        autenticar(usuario);

        curtidaService.curtir(produto.getId());
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> curtidaService.curtir(produto.getId())
        );

        UsuarioMissao progresso = usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(usuario.getId(), missao.getId())
                .orElseThrow();
        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals(1, progresso.getProgressoAtual());
        assertFalse(progresso.getConcluida());
    }

    @Test
    void shouldNotCompleteLargeGoalWithOneLike() {
        Missao missao = criarMissao("Curtir cem pecas", 100, 100, 1);
        Usuario usuario = criarUsuario("Cliente A", "5511999990005");
        autenticar(usuario);

        curtidaService.curtir(criarProduto("Camisa").getId());

        UsuarioMissao progresso = usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(usuario.getId(), missao.getId())
                .orElseThrow();
        assertEquals(1, progresso.getProgressoAtual());
        assertFalse(progresso.getConcluida());
    }

    @Test
    void shouldKeepProgressIsolatedBetweenUsers() {
        criarMissao("Curtir tres pecas", 3, 100, 1);
        Usuario usuarioA = criarUsuario("Cliente A", "5511999990006");
        Usuario usuarioB = criarUsuario("Cliente B", "5511999990007");

        autenticar(usuarioA);
        curtidaService.curtir(criarProduto("Camisa").getId());

        autenticar(usuarioB);
        List<MissaoResponse> respostaUsuarioB = missaoService.listar();

        assertEquals(1, respostaUsuarioB.size());
        assertEquals(0, respostaUsuarioB.get(0).progresso());
        assertFalse(respostaUsuarioB.get(0).concluida());
    }

    @Test
    void shouldNotGrantXpTwiceWhenCompletedMissionReceivesAnotherAction() {
        Missao missao = criarMissao("Curtir uma peca", 1, 10, 1);
        Usuario usuario = criarUsuario("Cliente A", "5511999990008");
        autenticar(usuario);

        curtidaService.curtir(criarProduto("Camisa").getId());
        UsuarioMissao progressoConcluido = usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(usuario.getId(), missao.getId())
                .orElseThrow();
        int xpUsuarioDepoisDaConclusao =
                usuarioRepository.findById(usuario.getId()).orElseThrow().getXp();

        curtidaService.curtir(criarProduto("Calca").getId());

        UsuarioMissao progressoDepoisDeNovaAcao = usuarioMissaoRepository
                .findByUsuarioIdAndMissaoId(usuario.getId(), missao.getId())
                .orElseThrow();
        int xpUsuarioDepoisDeNovaAcao =
                usuarioRepository.findById(usuario.getId()).orElseThrow().getXp();
        assertEquals(1, progressoDepoisDeNovaAcao.getProgressoAtual());
        assertTrue(progressoDepoisDeNovaAcao.getConcluida());
        assertEquals(progressoConcluido.getXpConcedido(), progressoDepoisDeNovaAcao.getXpConcedido());
        assertEquals(xpUsuarioDepoisDaConclusao, xpUsuarioDepoisDeNovaAcao);
    }

    private Missao criarMissao(String titulo, Integer meta, Integer valorBase, Integer peso) {
        return missaoRepository.save(new Missao(
                titulo,
                "heart",
                meta,
                "CURTIR_ITEM",
                valorBase,
                peso
        ));
    }

    private Usuario criarUsuario(String nome, String telefone) {
        return usuarioRepository.save(new Usuario(nome, telefone));
    }

    private Produto criarProduto(String nome) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setPrecoVenda(BigDecimal.valueOf(59.90));
        produto.setImagemUrl("/uploads/" + nome.toLowerCase() + ".jpg");

        return produtoRepository.save(produto);
    }

    private void autenticar(Usuario usuario) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        usuario.getId().toString(),
                        null,
                        List.of()
                )
        );
    }
}
