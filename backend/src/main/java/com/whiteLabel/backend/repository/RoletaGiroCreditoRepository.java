package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaGiroCredito;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoletaGiroCreditoRepository extends JpaRepository<RoletaGiroCredito, Long> {

    boolean existsByChaveEvento(String chaveEvento);

    long countByChaveEvento(String chaveEvento);

    long countByChaveEventoStartingWith(String prefixo);
}
