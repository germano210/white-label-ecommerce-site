package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.ProdutoImagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProdutoImagemRepository extends JpaRepository<ProdutoImagem, Long> {

    @Query("""
            select imagem
            from ProdutoImagem imagem
            where imagem.produto.id = :produtoId
            order by
                case when imagem.ordem is null then 1 else 0 end asc,
                imagem.ordem asc,
                imagem.id asc
            """)
    List<ProdutoImagem> findByProdutoIdOrderByOrdemAscIdAsc(@Param("produtoId") Long produtoId);

    @Query("""
            select imagem
            from ProdutoImagem imagem
            where imagem.produto.id in :produtoIds
            order by
                imagem.produto.id asc,
                case when imagem.ordem is null then 1 else 0 end asc,
                imagem.ordem asc,
                imagem.id asc
            """)
    List<ProdutoImagem> findByProdutoIdInOrderByProdutoIdAscOrdemAscIdAsc(
            @Param("produtoIds") Collection<Long> produtoIds
    );
}
