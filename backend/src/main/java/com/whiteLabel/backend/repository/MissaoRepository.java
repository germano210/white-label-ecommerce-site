package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Missao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MissaoRepository extends JpaRepository<Missao, Long> {

    List<Missao> findAllByAtivaTrueOrderByIdAsc();

    List<Missao> findAllByAtivaTrueAndTipoAcaoOrderByIdAsc(String tipoAcao);

    Optional<Missao> findByIdAndAtivaTrue(Long id);
}
