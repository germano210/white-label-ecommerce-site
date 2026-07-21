package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
}
