package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.CompartilhamentoAbertura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CompartilhamentoAberturaRepository
        extends JpaRepository<CompartilhamentoAbertura, Long> {

    boolean existsByCompartilhamentoIdAndUsuarioVisitanteId(
            Long compartilhamentoId,
            UUID usuarioVisitanteId
    );
}
