package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Indicacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface IndicacaoRepository extends JpaRepository<Indicacao, Long> {

    @Query("""
            select count(indicacao) > 0
            from Indicacao indicacao
            where indicacao.usuarioIndicado.id = :usuarioIndicadoId
            """)
    boolean existsByUsuarioIndicadoId(@Param("usuarioIndicadoId") UUID usuarioIndicadoId);
}
