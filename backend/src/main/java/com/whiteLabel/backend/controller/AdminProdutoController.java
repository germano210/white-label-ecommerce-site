package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.service.ProdutoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/produtos")
public class AdminProdutoController {

    private final ProdutoService produtoService;

    public AdminProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponseDTO criar(
            @RequestParam("nome") String nome,
            @RequestParam("precoVenda") BigDecimal precoVenda,
            @RequestParam(value = "precoAntigo", required = false) BigDecimal precoAntigo,
            @RequestParam(value = "tamanho", required = false) String tamanho,
            @RequestParam(value = "imagem", required = false) MultipartFile imagem,
            @RequestParam(value = "imagens", required = false) List<MultipartFile> imagens
    ) {
        return produtoService.criar(
                nome,
                precoVenda,
                precoAntigo,
                tamanho,
                imagem,
                imagens
        );
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProdutoResponseDTO editar(
            @PathVariable Long id,
            @RequestParam(value = "nome", required = false) String nome,
            @RequestParam(value = "precoVenda", required = false) BigDecimal precoVenda,
            @RequestParam(value = "precoAntigo", required = false) BigDecimal precoAntigo,
            @RequestParam(value = "tamanho", required = false) String tamanho,
            @RequestParam(value = "imagem", required = false) MultipartFile imagem,
            @RequestParam(value = "novasImagens", required = false) List<MultipartFile> novasImagens,
            @RequestParam(value = "imagensRemovidas", required = false) String imagensRemovidas,
            @RequestParam(value = "ordemImagens", required = false) String ordemImagens,
            @RequestParam(value = "imagemPrincipalId", required = false) Long imagemPrincipalId,
            @RequestParam(value = "novaImagemPrincipalIndex", required = false) Integer novaImagemPrincipalIndex
    ) {
        return produtoService.editar(
                id,
                nome,
                precoVenda,
                precoAntigo,
                tamanho,
                imagem,
                novasImagens,
                imagensRemovidas,
                ordemImagens,
                imagemPrincipalId,
                novaImagemPrincipalIndex
        );
    }

    @GetMapping
    public List<ProdutoResponseDTO> listar() {
        return produtoService.listarAtivos();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        produtoService.excluir(id);
    }
}
