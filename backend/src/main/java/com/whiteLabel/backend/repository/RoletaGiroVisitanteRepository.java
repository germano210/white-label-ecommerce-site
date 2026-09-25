package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaGiroVisitante;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RoletaGiroVisitanteRepository extends JpaRepository<RoletaGiroVisitante, Long> {

    boolean existsByToken(String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select giro from RoletaGiroVisitante giro "
            + "join fetch giro.nivel "
            + "join fetch giro.premio "
            + "where giro.token = :token")
    Optional<RoletaGiroVisitante> findByTokenForUpdate(@Param("token") String token);
}
