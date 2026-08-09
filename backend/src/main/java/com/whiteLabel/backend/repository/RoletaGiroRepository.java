package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaGiro;
import com.whiteLabel.backend.domain.RoletaGiroStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoletaGiroRepository extends JpaRepository<RoletaGiro, Long> {

    Optional<RoletaGiro> findTopByUsuarioIdAndStatusOrderByCriadoEmDesc(
            UUID usuarioId,
            RoletaGiroStatus status
    );

    List<RoletaGiro> findTop3ByOrderByCriadoEmDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select giro from RoletaGiro giro "
            + "where giro.usuario.id = :usuarioId and giro.status = :status "
            + "order by giro.criadoEm desc, giro.id desc")
    List<RoletaGiro> findByUsuarioIdAndStatusForUpdate(
            @Param("usuarioId") UUID usuarioId,
            @Param("status") RoletaGiroStatus status
    );
}
