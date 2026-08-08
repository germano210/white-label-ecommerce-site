package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaNivel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoletaNivelRepository extends JpaRepository<RoletaNivel, Long> {

    List<RoletaNivel> findByAtivoTrueOrderByOrdemAscIdAsc();

    List<RoletaNivel> findAllByOrderByOrdemAscIdAsc();
}
