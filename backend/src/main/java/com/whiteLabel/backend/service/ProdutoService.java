package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final CurtidaRepository curtidaRepository;
    private final ImagemStorageService imagemStorageService;

    public ProdutoService(
            ProdutoRepository produtoRepository,
            CurtidaRepository curtidaRepository,
            ImagemStorageService imagemStorageService
    ) {
        this.produtoRepository = produtoRepository;
        this.curtidaRepository = curtidaRepository;
        this.imagemStorageService = imagemStorageService;
    }

    @Transactional
    public ProdutoResponseDTO criar(
            String nome,
            BigDecimal precoVenda,
            BigDecimal precoAntigo,
            String tamanho,
            MultipartFile imagem
    ) {
        Produto produto = new Produto();
        produto.setNome(nome.trim());
        produto.setPrecoVenda(precoVenda);
        produto.setPrecoAntigo(precoAntigo);
        produto.setTamanho(tamanho == null ? null : tamanho.trim());
        produto.setImagemUrl(imagemStorageService.guardar(imagem));

        return ProdutoResponseDTO.from(produtoRepository.save(produto));
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponseDTO> listarAtivos() {
        List<Produto> produtos = produtoRepository.findAllByAtivoTrue();
        Map<Long, List<String>> nomesCurtidasPorProduto = buscarNomesCurtidas(produtos);

        return produtos
                .stream()
                .map(produto -> ProdutoResponseDTO.from(
                        produto,
                        nomesCurtidasPorProduto.getOrDefault(produto.getId(), List.of())
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
