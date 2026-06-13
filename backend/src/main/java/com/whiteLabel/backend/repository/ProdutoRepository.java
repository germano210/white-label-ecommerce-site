package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    // Magia do Spring: Só de escrever o nome do método, ele cria o SQL de "SELECT * WHERE ativo = true"
    List<Produto> findAllByAtivoTrue();
}