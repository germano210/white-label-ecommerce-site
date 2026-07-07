package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.UsuarioMissao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioMissaoRepository extends JpaRepository<UsuarioMissao, Long> {

    Optional<UsuarioMissao> findByUsuarioIdAndMissaoId(UUID usuarioId, Long missaoId);

    List<UsuarioMissao> findByUsuarioIdAndMissaoAtivaTrue(UUID usuarioId);

    List<UsuarioMissao> findByUsuarioId(UUID usuarioId);
}
