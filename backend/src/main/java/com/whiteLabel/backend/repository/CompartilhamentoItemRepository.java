package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.CompartilhamentoItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompartilhamentoItemRepository
        extends JpaRepository<CompartilhamentoItem, Long> {

    Optional<CompartilhamentoItem> findByCodigoAndAtivoTrue(String codigo);

    boolean existsByCodigo(String codigo);
}
