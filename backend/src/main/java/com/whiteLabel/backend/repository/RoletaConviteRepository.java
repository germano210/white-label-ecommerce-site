package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaConvite;
import com.whiteLabel.backend.domain.RoletaConviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RoletaConviteRepository extends JpaRepository<RoletaConvite, Long> {

    boolean existsByUsuarioIndicadoId(UUID usuarioIndicadoId);

    long countByUsuarioIndicadorIdAndStatus(
            UUID usuarioIndicadorId,
            RoletaConviteStatus status
    );

    @Query("""
            select convite from RoletaConvite convite
            join fetch convite.usuarioIndicador
            where convite.usuarioIndicado.id = :usuarioIndicadoId
              and convite.status = :status
            """)
    Optional<RoletaConvite> findByUsuarioIndicadoIdAndStatusFetchIndicador(
            @Param("usuarioIndicadoId") UUID usuarioIndicadoId,
            @Param("status") RoletaConviteStatus status
    );
}
