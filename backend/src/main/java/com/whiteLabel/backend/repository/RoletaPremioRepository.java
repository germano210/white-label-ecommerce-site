package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaPremio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RoletaPremioRepository extends JpaRepository<RoletaPremio, Long> {

    @Query("select premio from RoletaPremio premio join fetch premio.nivel nivel "
            + "where premio.ativo = true and nivel.ativo = true "
            + "order by nivel.ordem asc, premio.ordem asc, premio.id asc")
    List<RoletaPremio> findAtivosComNivelAtivoOrdenados();

    @Query("select premio from RoletaPremio premio join fetch premio.nivel nivel "
            + "order by nivel.ordem asc, premio.ordem asc, premio.id asc")
    List<RoletaPremio> findAllOrdenados();
}
