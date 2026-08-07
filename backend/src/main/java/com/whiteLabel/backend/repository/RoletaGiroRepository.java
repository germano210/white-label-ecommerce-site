package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaGiro;
import com.whiteLabel.backend.domain.RoletaGiroStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoletaGiroRepository extends JpaRepository<RoletaGiro, Long> {

    Optional<RoletaGiro> findTopByUsuarioIdAndStatusOrderByCriadoEmDesc(
            UUID usuarioId,
            RoletaGiroStatus status
    );

    List<RoletaGiro> findTop3ByOrderByCriadoEmDesc();
}
