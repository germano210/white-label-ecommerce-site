package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaProduto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoletaProdutoRepository extends JpaRepository<RoletaProduto, Long> {

    List<RoletaProduto> findByAtivoTrueOrderByOrdemAscIdAsc();

    boolean existsByProdutoIdAndAtivoTrue(Long produtoId);
}
