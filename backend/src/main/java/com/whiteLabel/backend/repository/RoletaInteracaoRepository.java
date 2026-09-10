package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaInteracao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoletaInteracaoRepository extends JpaRepository<RoletaInteracao, Long> {

    Optional<RoletaInteracao> findByChaveEvento(String chaveEvento);

    List<RoletaInteracao> findTop20ByOrderByCriadoEmDescIdDesc();

    List<RoletaInteracao> findTop10ByOrderByCriadoEmDescIdDesc();
}
