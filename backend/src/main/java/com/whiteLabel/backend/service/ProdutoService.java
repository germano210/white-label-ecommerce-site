package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.ProdutoImagem;
import com.whiteLabel.backend.dto.AdminProdutoResponseDTO;
import com.whiteLabel.backend.dto.ProdutoImagemResponse;
import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.ProdutoImagemRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ProdutoService {

    private static final BigDecimal CONDICAO_MINIMA = new BigDecimal("0.00");
    private static final BigDecimal CONDICAO_MAXIMA = new BigDecimal("10.00");
    private static final Pattern NUMERO_PATTERN = Pattern.compile("\\d+");
    private static final Pattern OBJETO_JSON_PATTERN = Pattern.compile("\\{[^}]*}");
    private static final Pattern ID_JSON_PATTERN = Pattern.compile("\"?id\"?\\s*:\\s*(\\d+)");
    private static final Pattern ORDEM_JSON_PATTERN = Pattern.compile("\"?ordem\"?\\s*:\\s*(\\d+)");

    private final ProdutoRepository produtoRepository;
    private final ProdutoImagemRepository produtoImagemRepository;
    private final CurtidaRepository curtidaRepository;
    private final ImagemStorageService imagemStorageService;

    public ProdutoService(
            ProdutoRepository produtoRepository,
            ProdutoImagemRepository produtoImagemRepository,
            CurtidaRepository curtidaRepository,
            ImagemStorageService imagemStorageService
    ) {
        this.produtoRepository = produtoRepository;
        this.produtoImagemRepository = produtoImagemRepository;
        this.curtidaRepository = curtidaRepository;
        this.imagemStorageService = imagemStorageService;
    }

    @Transactional
    public AdminProdutoResponseDTO criar(
            String nome,
            BigDecimal precoVenda,
            BigDecimal precoAntigo,
            BigDecimal precoCusto,
            String tamanho,
            BigDecimal condicao,
            MultipartFile imagem,
            List<MultipartFile> imagens,
            Integer imagemPrincipalIndex
    ) {
        List<MultipartFile> arquivos = normalizarArquivos(imagem, imagens);
        if (arquivos.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem e obrigatoria");
        }
        if (nome == null || nome.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nome do produto e obrigatorio"
            );
        }
        validarCondicaoObrigatoria(condicao);
        validarPrecoCusto(precoCusto);
        int indicePrincipal = validarIndicePrincipal(imagemPrincipalIndex, arquivos.size());

        List<String> urls = arquivos.stream()
                .map(imagemStorageService::guardar)
                .toList();

        Produto produto = new Produto();
        produto.setNome(nome.trim());
        produto.setPrecoVenda(precoVenda);
        produto.setPrecoAntigo(precoAntigo);
        produto.setPrecoCusto(precoCusto);
        produto.setTamanho(tamanho == null ? null : tamanho.trim());
        produto.setCondicao(condicao);
        produto.setImagemUrl(urls.get(indicePrincipal));

        Produto produtoSalvo = produtoRepository.save(produto);
        List<ProdutoImagem> imagensSalvas = salvarImagens(produtoSalvo, urls, indicePrincipal);

        return montarAdminResponse(produtoSalvo, imagensSalvas, List.of());
    }

    @Transactional
    public AdminProdutoResponseDTO editar(
            Long id,
            String nome,
            BigDecimal precoVenda,
            BigDecimal precoAntigo,
            BigDecimal precoCusto,
            String tamanho,
            BigDecimal condicao,
            MultipartFile imagem,
            List<MultipartFile> novasImagens,
            String imagensRemovidas,
            String ordemImagens,
            Long imagemPrincipalId,
            Integer novaImagemPrincipalIndex
    ) {
        Produto produto = produtoRepository.findById(id)
                .filter(item -> Boolean.TRUE.equals(item.getAtivo()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));
        atualizarCampos(produto, nome, precoVenda, precoAntigo, precoCusto, tamanho, condicao);

        List<ProdutoImagem> imagensAtuais = buscarImagensEditaveis(produto);
        removerImagens(imagensAtuais, parseIds(imagensRemovidas));

        ProdutoImagem novaPrincipalPorArquivo = null;
        int proximaOrdem = proximaOrdem(imagensAtuais);

        validarArquivoOpcional(imagem);
        if (arquivoValido(imagem)) {
            novaPrincipalPorArquivo = salvarImagem(
                    produto,
                    imagemStorageService.guardar(imagem),
                    proximaOrdem++
            );
            imagensAtuais.add(novaPrincipalPorArquivo);
        }

        List<ProdutoImagem> imagensAdicionadas = new ArrayList<>();
        for (MultipartFile novaImagem : arquivosValidos(novasImagens)) {
            ProdutoImagem produtoImagem = salvarImagem(
                    produto,
                    imagemStorageService.guardar(novaImagem),
                    proximaOrdem++
            );
            imagensAdicionadas.add(produtoImagem);
            imagensAtuais.add(produtoImagem);
        }

        if (imagensAtuais.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Produto deve manter ao menos uma imagem"
            );
        }

        aplicarOrdem(imagensAtuais, parseOrdemImagens(ordemImagens));
        ProdutoImagem principal = escolherPrincipal(
                imagensAtuais,
                imagensAdicionadas,
                novaPrincipalPorArquivo,
                imagemPrincipalId,
                novaImagemPrincipalIndex
        );
        definirPrincipal(produto, imagensAtuais, principal);

        Produto produtoSalvo = produtoRepository.save(produto);
        produtoImagemRepository.saveAll(imagensAtuais);

        return montarAdminResponse(produtoSalvo, imagensAtuais, List.of());
    }

    @Transactional
    public AdminProdutoResponseDTO definirImagemPrincipal(Long produtoId, Long imagemId) {
        Produto produto = produtoRepository.findById(produtoId)
                .filter(item -> Boolean.TRUE.equals(item.getAtivo()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));

        ProdutoImagem imagemPrincipal = produtoImagemRepository.findById(imagemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Imagem do produto nao encontrada"
                ));

        if (!produto.getId().equals(imagemPrincipal.getProduto().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Imagem nao pertence ao produto informado"
            );
        }

        List<ProdutoImagem> imagens = buscarImagensEditaveis(produto);
        marcarPrincipal(produto, imagens, imagemPrincipal);

        Produto produtoSalvo = produtoRepository.save(produto);
        produtoImagemRepository.saveAll(imagens);

        return montarAdminResponse(produtoSalvo, imagens, List.of());
    }

    @Transactional
    public AdminProdutoResponseDTO atualizarOrdemImagens(Long produtoId, List<Long> imagemIds) {
        Produto produto = produtoRepository.findById(produtoId)
                .filter(item -> Boolean.TRUE.equals(item.getAtivo()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));

        List<ProdutoImagem> imagens = buscarImagensEditaveis(produto);
        validarImagemIdsParaOrdenacao(imagens, imagemIds);

        Map<Long, ProdutoImagem> imagensPorId = imagens.stream()
                .collect(Collectors.toMap(ProdutoImagem::getId, imagem -> imagem));

        for (int ordem = 0; ordem < imagemIds.size(); ordem++) {
            imagensPorId.get(imagemIds.get(ordem)).setOrdem(ordem);
        }

        atualizarImagemUrlPelaPrincipal(produto, imagens);
        Produto produtoSalvo = produtoRepository.save(produto);
        produtoImagemRepository.saveAll(imagens);

        List<ProdutoImagem> imagensOrdenadas =
                produtoImagemRepository.findByProdutoIdOrderByOrdemAscIdAsc(produtoId);
        return montarAdminResponse(produtoSalvo, imagensOrdenadas, List.of());
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponseDTO> listarAtivos() {
        List<Produto> produtos = produtoRepository.findAllByAtivoTrueOrderByCriadoEmDescIdDesc();
        Map<Long, List<String>> nomesCurtidasPorProduto = buscarNomesCurtidas(produtos);
        Map<Long, List<ProdutoImagemResponse>> imagensPorProduto = buscarImagens(produtos);

        return produtos
                .stream()
                .map(produto -> ProdutoResponseDTO.from(
                        produto,
                        nomesCurtidasPorProduto.getOrDefault(produto.getId(), List.of()),
                        imagensDoProduto(produto, imagensPorProduto)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminProdutoResponseDTO> listarAtivosAdmin() {
        List<Produto> produtos = produtoRepository.findAllByAtivoTrueOrderByCriadoEmDescIdDesc();
        Map<Long, List<String>> nomesCurtidasPorProduto = buscarNomesCurtidas(produtos);
        Map<Long, List<ProdutoImagemResponse>> imagensPorProduto = buscarImagens(produtos);

        return produtos
                .stream()
                .map(produto -> AdminProdutoResponseDTO.from(
                        produto,
                        nomesCurtidasPorProduto.getOrDefault(produto.getId(), List.of()),
                        imagensDoProduto(produto, imagensPorProduto)
                ))
                .toList();
    }

    private Map<Long, List<String>> buscarNomesCurtidas(List<Produto> produtos) {
        List<Long> produtoIds = produtos.stream()
                .map(Produto::getId)
                .toList();

        if (produtoIds.isEmpty()) {
            return Map.of();
        }

        return curtidaRepository.findTop2NomesByProdutoIds(produtoIds)
                .stream()
                .collect(Collectors.groupingBy(
                        CurtidaRepository.NomeCurtidaProjection::getProdutoId,
                        Collectors.mapping(
                                CurtidaRepository.NomeCurtidaProjection::getNome,
                                Collectors.toList()
                        )
                ));
    }

    private void atualizarCampos(
            Produto produto,
            String nome,
            BigDecimal precoVenda,
            BigDecimal precoAntigo,
            BigDecimal precoCusto,
            String tamanho,
            BigDecimal condicao
    ) {
        if (nome != null) {
            if (nome.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Nome do produto e obrigatorio"
                );
            }
            produto.setNome(nome.trim());
        }

        if (precoVenda != null) {
            produto.setPrecoVenda(precoVenda);
        }

        if (precoAntigo != null) {
            produto.setPrecoAntigo(precoAntigo);
        }

        if (precoCusto != null) {
            validarPrecoCusto(precoCusto);
            produto.setPrecoCusto(precoCusto);
        }

        if (tamanho != null) {
            produto.setTamanho(tamanho.isBlank() ? null : tamanho.trim());
        }

        if (condicao != null) {
            validarCondicaoObrigatoria(condicao);
            produto.setCondicao(condicao);
        }
    }

    private List<MultipartFile> normalizarArquivos(
            MultipartFile imagem,
            List<MultipartFile> imagens
    ) {
        List<MultipartFile> arquivos = new ArrayList<>(arquivosValidos(imagens));
        if (!arquivos.isEmpty()) {
            return arquivos;
        }

        validarArquivoOpcional(imagem);
        if (arquivoValido(imagem)) {
            arquivos.add(imagem);
        }

        return arquivos;
    }

    private int validarIndicePrincipal(Integer imagemPrincipalIndex, int quantidadeImagens) {
        int indicePrincipal = imagemPrincipalIndex == null ? 0 : imagemPrincipalIndex;
        if (indicePrincipal < 0 || indicePrincipal >= quantidadeImagens) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Indice da imagem principal e invalido"
            );
        }

        return indicePrincipal;
    }

    private void validarArquivoOpcional(MultipartFile arquivo) {
        if (arquivo != null && arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem e obrigatoria");
        }
    }

    private void validarCondicaoObrigatoria(BigDecimal condicao) {
        if (condicao == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Condicao e obrigatoria");
        }

        validarEscalaDecimal(condicao, "Condicao deve ter no maximo 2 casas decimais");
        if (condicao.compareTo(CONDICAO_MINIMA) < 0 || condicao.compareTo(CONDICAO_MAXIMA) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Condicao deve estar entre 0.00 e 10.00"
            );
        }
    }

    private void validarPrecoCusto(BigDecimal precoCusto) {
        if (precoCusto == null) {
            return;
        }

        validarEscalaDecimal(precoCusto, "Preco de custo deve ter no maximo 2 casas decimais");
        if (precoCusto.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Preco de custo nao pode ser negativo"
            );
        }
    }

    private void validarEscalaDecimal(BigDecimal valor, String mensagem) {
        if (valor.scale() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
        }
    }

    private boolean arquivoValido(MultipartFile arquivo) {
        return arquivo != null && !arquivo.isEmpty();
    }

    private List<MultipartFile> arquivosValidos(List<MultipartFile> arquivos) {
        if (arquivos == null || arquivos.isEmpty()) {
            return List.of();
        }

        List<MultipartFile> arquivosValidos = new ArrayList<>();
        for (MultipartFile arquivo : arquivos) {
            validarArquivoOpcional(arquivo);
            if (arquivoValido(arquivo)) {
                arquivosValidos.add(arquivo);
            }
        }

        return arquivosValidos;
    }

    private List<ProdutoImagem> salvarImagens(
            Produto produto,
            List<String> urls,
            int indicePrincipal
    ) {
        List<ProdutoImagem> imagens = new ArrayList<>();
        for (int ordem = 0; ordem < urls.size(); ordem++) {
            imagens.add(new ProdutoImagem(
                    produto,
                    urls.get(ordem),
                    ordem,
                    ordem == indicePrincipal
            ));
        }

        return produtoImagemRepository.saveAll(imagens);
    }

    private ProdutoImagem salvarImagem(Produto produto, String url, int ordem) {
        return produtoImagemRepository.save(new ProdutoImagem(produto, url, ordem, false));
    }

    private List<ProdutoImagem> buscarImagensEditaveis(Produto produto) {
        List<ProdutoImagem> imagens = new ArrayList<>(
                produtoImagemRepository.findByProdutoIdOrderByOrdemAscIdAsc(produto.getId())
        );

        if (
                imagens.isEmpty()
                        && produto.getImagemUrl() != null
                        && !produto.getImagemUrl().isBlank()
        ) {
            ProdutoImagem imagemLegada = produtoImagemRepository.save(
                    new ProdutoImagem(produto, produto.getImagemUrl(), 0, true)
            );
            imagens.add(imagemLegada);
        }

        return imagens;
    }

    private void removerImagens(List<ProdutoImagem> imagens, Set<Long> idsRemovidos) {
        if (idsRemovidos.isEmpty()) {
            return;
        }

        List<ProdutoImagem> removidas = imagens
                .stream()
                .filter(imagem -> imagem.getId() != null && idsRemovidos.contains(imagem.getId()))
                .toList();

        if (removidas.isEmpty()) {
            return;
        }

        produtoImagemRepository.deleteAll(removidas);
        imagens.removeIf(imagem -> imagem.getId() != null && idsRemovidos.contains(imagem.getId()));
    }

    private Set<Long> parseIds(String valor) {
        if (valor == null || valor.isBlank()) {
            return Set.of();
        }

        Set<Long> ids = new HashSet<>();
        Matcher matcher = NUMERO_PATTERN.matcher(valor);
        while (matcher.find()) {
            ids.add(Long.parseLong(matcher.group()));
        }
        return ids;
    }

    private int proximaOrdem(List<ProdutoImagem> imagens) {
        return imagens
                .stream()
                .map(ProdutoImagem::getOrdem)
                .max(Integer::compareTo)
                .orElse(-1) + 1;
    }

    private void aplicarOrdem(
            List<ProdutoImagem> imagens,
            Map<Long, Integer> ordemPorImagem
    ) {
        if (ordemPorImagem.isEmpty()) {
            return;
        }

        for (ProdutoImagem imagem : imagens) {
            if (imagem.getId() != null && ordemPorImagem.containsKey(imagem.getId())) {
                imagem.setOrdem(ordemPorImagem.get(imagem.getId()));
            }
        }
    }

    private Map<Long, Integer> parseOrdemImagens(String valor) {
        if (valor == null || valor.isBlank()) {
            return Map.of();
        }

        Map<Long, Integer> ordemPorImagem = new HashMap<>();
        Matcher objetoMatcher = OBJETO_JSON_PATTERN.matcher(valor);
        while (objetoMatcher.find()) {
            String objeto = objetoMatcher.group();
            Matcher idMatcher = ID_JSON_PATTERN.matcher(objeto);
            Matcher ordemMatcher = ORDEM_JSON_PATTERN.matcher(objeto);
            if (idMatcher.find() && ordemMatcher.find()) {
                ordemPorImagem.put(
                        Long.parseLong(idMatcher.group(1)),
                        Integer.parseInt(ordemMatcher.group(1))
                );
            }
        }

        if (!ordemPorImagem.isEmpty()) {
            return ordemPorImagem;
        }

        Matcher numeroMatcher = NUMERO_PATTERN.matcher(valor);
        int ordem = 0;
        while (numeroMatcher.find()) {
            ordemPorImagem.put(Long.parseLong(numeroMatcher.group()), ordem++);
        }
        return ordemPorImagem;
    }

    private ProdutoImagem escolherPrincipal(
            List<ProdutoImagem> imagens,
            List<ProdutoImagem> imagensAdicionadas,
            ProdutoImagem novaPrincipalPorArquivo,
            Long imagemPrincipalId,
            Integer novaImagemPrincipalIndex
    ) {
        if (imagemPrincipalId != null) {
            return imagens
                    .stream()
                    .filter(imagem -> imagemPrincipalId.equals(imagem.getId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Imagem principal nao encontrada"
                    ));
        }

        if (novaImagemPrincipalIndex != null) {
            if (
                    novaImagemPrincipalIndex < 0
                            || novaImagemPrincipalIndex >= imagensAdicionadas.size()
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Indice da nova imagem principal e invalido"
                );
            }
            return imagensAdicionadas.get(novaImagemPrincipalIndex);
        }

        if (novaPrincipalPorArquivo != null) {
            return novaPrincipalPorArquivo;
        }

        return imagens
                .stream()
                .filter(imagem -> Boolean.TRUE.equals(imagem.getPrincipal()))
                .findFirst()
                .orElseGet(() -> imagens
                        .stream()
                        .min(Comparator.comparing(ProdutoImagem::getOrdem)
                                .thenComparing(ProdutoImagem::getId))
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Produto deve manter ao menos uma imagem"
                        )));
    }

    private void definirPrincipal(
            Produto produto,
            List<ProdutoImagem> imagens,
            ProdutoImagem principal
    ) {
        imagens.sort(Comparator.comparing(ProdutoImagem::getOrdem)
                .thenComparing(ProdutoImagem::getId));
        imagens.removeIf(imagem -> mesmoRegistro(imagem, principal));
        imagens.add(0, principal);

        for (int ordem = 0; ordem < imagens.size(); ordem++) {
            ProdutoImagem imagem = imagens.get(ordem);
            imagem.setOrdem(ordem);
            imagem.setPrincipal(mesmoRegistro(imagem, principal));
        }

        produto.setImagemUrl(principal.getUrl());
    }

    private void marcarPrincipal(
            Produto produto,
            List<ProdutoImagem> imagens,
            ProdutoImagem principal
    ) {
        for (ProdutoImagem imagem : imagens) {
            imagem.setPrincipal(mesmoRegistro(imagem, principal));
        }

        produto.setImagemUrl(principal.getUrl());
    }

    private void atualizarImagemUrlPelaPrincipal(
            Produto produto,
            List<ProdutoImagem> imagens
    ) {
        ProdutoImagem principal = imagens.stream()
                .filter(ProdutoImagem::getPrincipal)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Produto sem imagem principal"
                ));

        produto.setImagemUrl(principal.getUrl());
    }

    private void validarImagemIdsParaOrdenacao(
            List<ProdutoImagem> imagens,
            List<Long> imagemIds
    ) {
        if (imagemIds == null || imagemIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Lista de imagens e obrigatoria"
            );
        }

        if (imagemIds.stream().anyMatch(id -> id == null)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Lista de imagens nao pode conter IDs nulos"
            );
        }

        Set<Long> idsAtuais = imagens.stream()
                .map(ProdutoImagem::getId)
                .collect(Collectors.toSet());
        Set<Long> idsRecebidos = new LinkedHashSet<>(imagemIds);

        if (idsRecebidos.size() != imagemIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Lista de imagens nao pode conter IDs duplicados"
            );
        }

        if (!idsRecebidos.equals(idsAtuais)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Lista de imagens deve conter exatamente as imagens atuais do produto"
            );
        }
    }

    private boolean mesmoRegistro(ProdutoImagem imagem, ProdutoImagem outraImagem) {
        if (imagem == outraImagem) {
            return true;
        }

        return imagem.getId() != null && imagem.getId().equals(outraImagem.getId());
    }

    private Map<Long, List<ProdutoImagemResponse>> buscarImagens(List<Produto> produtos) {
        List<Long> produtoIds = produtos
                .stream()
                .map(Produto::getId)
                .toList();

        if (produtoIds.isEmpty()) {
            return Map.of();
        }

        return produtoImagemRepository.findByProdutoIdInOrderByProdutoIdAscOrdemAscIdAsc(produtoIds)
                .stream()
                .collect(Collectors.groupingBy(
                        imagem -> imagem.getProduto().getId(),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                this::toResponses
                        )
                ));
    }

    private List<ProdutoImagemResponse> imagensDoProduto(
            Produto produto,
            Map<Long, List<ProdutoImagemResponse>> imagensPorProduto
    ) {
        List<ProdutoImagemResponse> imagens = imagensPorProduto.get(produto.getId());
        if (imagens != null && !imagens.isEmpty()) {
            return imagens;
        }

        if (produto.getImagemUrl() == null || produto.getImagemUrl().isBlank()) {
            return List.of();
        }

        return List.of(ProdutoImagemResponse.legada(produto.getImagemUrl()));
    }

    private ProdutoResponseDTO montarResponse(
            Produto produto,
            List<ProdutoImagem> imagens,
            List<String> nomesCurtidas
    ) {
        return ProdutoResponseDTO.from(produto, nomesCurtidas, toResponses(imagens));
    }

    private AdminProdutoResponseDTO montarAdminResponse(
            Produto produto,
            List<ProdutoImagem> imagens,
            List<String> nomesCurtidas
    ) {
        return AdminProdutoResponseDTO.from(produto, nomesCurtidas, toResponses(imagens));
    }

    private List<ProdutoImagemResponse> toResponses(List<ProdutoImagem> imagens) {
        return imagens
                .stream()
                .sorted(Comparator
                        .comparing(ProdutoImagem::getOrdem)
                        .thenComparing(ProdutoImagem::getId))
                .map(ProdutoImagemResponse::from)
                .toList();
    }

    @Transactional
    public void excluir(Long id) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));

        produto.setAtivo(false);
        produtoRepository.save(produto);
    }
}
