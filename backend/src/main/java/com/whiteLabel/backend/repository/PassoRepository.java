package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Passo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PassoRepository extends JpaRepository<Passo, Long> {

    boolean existsByUsuarioIdAndProdutoId(UUID usuarioId, Long produtoId);
}
