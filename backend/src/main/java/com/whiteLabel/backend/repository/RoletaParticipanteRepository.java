package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaParticipante;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RoletaParticipanteRepository extends JpaRepository<RoletaParticipante, Long> {

    Optional<RoletaParticipante> findByUsuarioId(UUID usuarioId);

    Optional<RoletaParticipante> findByCodigoConvite(String codigoConvite);

    boolean existsByCodigoConvite(String codigoConvite);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select participante from RoletaParticipante participante where participante.codigoConvite = :codigoConvite")
    Optional<RoletaParticipante> findByCodigoConviteForUpdate(
            @Param("codigoConvite") String codigoConvite
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select participante from RoletaParticipante participante where participante.usuario.id = :usuarioId")
    Optional<RoletaParticipante> findByUsuarioIdForUpdate(@Param("usuarioId") UUID usuarioId);
}
