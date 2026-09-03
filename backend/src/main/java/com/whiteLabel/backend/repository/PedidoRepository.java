package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.PedidoStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    boolean existsByRoletaGiroIdAndStatusIn(Long roletaGiroId, Collection<PedidoStatus> statuses);

    @EntityGraph(attributePaths = {"itens", "itens.produto"})
    List<Pedido> findDistinctByUsuarioIdOrderByDataCriacaoDescIdDesc(UUID usuarioId);
}
