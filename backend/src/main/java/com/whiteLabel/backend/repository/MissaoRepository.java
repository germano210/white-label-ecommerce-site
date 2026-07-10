package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoCiclo;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MissaoRepository extends JpaRepository<Missao, Long> {

    List<Missao> findAllByAtivaTrueOrderByIdAsc();

    List<Missao> findAllByAtivaTrueAndTipoAcaoOrderByIdAsc(String tipoAcao);

    @Query("""
            select m from Missao m
            where m.ativa = true
              and (m.ciclo is null or m.ciclo = :ciclo)
            order by m.id asc
            """)
    List<Missao> findAllAtivasNormais(@Param("ciclo") MissaoCiclo ciclo);

    @Query("""
            select m from Missao m
            where m.ativa = true
              and m.tipoAcao = :tipoAcao
              and (m.ciclo is null or m.ciclo = :ciclo)
            order by m.id asc
            """)
    List<Missao> findAllAtivasNormaisPorTipo(
            @Param("tipoAcao") String tipoAcao,
            @Param("ciclo") MissaoCiclo ciclo
    );

    List<Missao> findAllByAtivaTrueAndCicloOrderByIdAsc(MissaoCiclo ciclo);

    List<Missao> findAllByAtivaTrueAndCicloAndTipoAcaoOrderByIdAsc(
            MissaoCiclo ciclo,
            String tipoAcao
    );

    boolean existsByTipoAcaoAndCiclo(String tipoAcao, MissaoCiclo ciclo);

    Optional<Missao> findByIdAndAtivaTrue(Long id);
}
