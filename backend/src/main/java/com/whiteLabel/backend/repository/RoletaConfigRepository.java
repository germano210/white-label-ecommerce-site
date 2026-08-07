package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaConfig;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RoletaConfigRepository extends JpaRepository<RoletaConfig, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select config from RoletaConfig config where config.id = :id")
    Optional<RoletaConfig> findByIdForUpdate(@Param("id") Long id);
}
