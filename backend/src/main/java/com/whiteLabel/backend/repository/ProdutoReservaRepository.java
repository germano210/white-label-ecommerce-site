package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.ProdutoReserva;
import com.whiteLabel.backend.domain.ProdutoReservaStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProdutoReservaRepository extends JpaRepository<ProdutoReserva, Long> {

    Optional<ProdutoReserva> findTopByProdutoIdAndStatusOrderByExpiraEmDescIdDesc(
            Long produtoId,
            ProdutoReservaStatus status
    );

    Optional<ProdutoReserva> findTopByUsuarioIdAndProdutoIdAndStatusOrderByExpiraEmDescIdDesc(
            UUID usuarioId,
            Long produtoId,
            ProdutoReservaStatus status
    );

    List<ProdutoReserva> findByProdutoIdInAndStatus(
            Collection<Long> produtoIds,
            ProdutoReservaStatus status
    );

    List<ProdutoReserva> findByUsuarioIdAndProdutoIdInAndStatus(
            UUID usuarioId,
            Collection<Long> produtoIds,
            ProdutoReservaStatus status
    );

    List<ProdutoReserva> findByPedidoId(Long pedidoId);

    List<ProdutoReserva> findByStatusAndExpiraEmLessThanEqual(
            ProdutoReservaStatus status,
            LocalDateTime expiraEm
    );
}
