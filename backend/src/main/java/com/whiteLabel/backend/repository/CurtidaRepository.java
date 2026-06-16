package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Curtida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CurtidaRepository extends JpaRepository<Curtida, Long> {

    boolean existsByUsuarioIdAndProdutoId(UUID usuarioId, Long produtoId);

    List<Curtida> findTop2ByProdutoIdOrderByDataCurtidaDesc(Long produtoId);

    @Query(value = """
            select ranked.produto_id as "produtoId", u.nome as "nome"
            from (
                select c.produto_id,
                       c.usuario_id,
                       row_number() over (
                           partition by c.produto_id
                           order by c.data_curtida desc
                       ) as posicao
                from curtidas c
                where c.produto_id in (:produtoIds)
            ) ranked
            join usuarios u on u.id = ranked.usuario_id
            where ranked.posicao <= 2
              and u.nome is not null
              and trim(u.nome) <> ''
            order by ranked.produto_id, ranked.posicao
            """, nativeQuery = true)
    List<NomeCurtidaProjection> findTop2NomesByProdutoIds(
            @Param("produtoIds") Collection<Long> produtoIds
    );

    interface NomeCurtidaProjection {

        Long getProdutoId();

        String getNome();
    }
}
