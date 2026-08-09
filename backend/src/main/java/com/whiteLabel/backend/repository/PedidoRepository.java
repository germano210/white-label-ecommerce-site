package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.PedidoStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    boolean existsByRoletaGiroIdAndStatusIn(Long roletaGiroId, Collection<PedidoStatus> statuses);
}
