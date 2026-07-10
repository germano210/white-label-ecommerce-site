package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.UsuarioMissaoSemanal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioMissaoSemanalRepository
        extends JpaRepository<UsuarioMissaoSemanal, Long> {

    Optional<UsuarioMissaoSemanal> findByUsuarioIdAndMissaoIdAndSemanaInicio(
            UUID usuarioId,
            Long missaoId,
            LocalDateTime semanaInicio
    );

    List<UsuarioMissaoSemanal> findByUsuarioIdAndSemanaInicioAndMissaoAtivaTrue(
            UUID usuarioId,
            LocalDateTime semanaInicio
    );

    List<UsuarioMissaoSemanal> findByUsuarioIdAndSemanaInicio(
            UUID usuarioId,
            LocalDateTime semanaInicio
    );
}
