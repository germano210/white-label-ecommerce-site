package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaConvite;
import com.whiteLabel.backend.domain.RoletaConviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RoletaConviteRepository extends JpaRepository<RoletaConvite, Long> {

    boolean existsByUsuarioIndicadoId(UUID usuarioIndicadoId);

    long countByUsuarioIndicadorIdAndStatus(
            UUID usuarioIndicadorId,
            RoletaConviteStatus status
    );
}
