package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaOpcao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoletaOpcaoRepository extends JpaRepository<RoletaOpcao, Long> {

    List<RoletaOpcao> findByAtivaTrueOrderByNivelAscOrdemAscIdAsc();

    List<RoletaOpcao> findAllByOrderByNivelAscOrdemAscIdAsc();
}
