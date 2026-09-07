package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.RoletaMeta;
import com.whiteLabel.backend.domain.RoletaMetaStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RoletaMetaRepository extends JpaRepository<RoletaMeta, Long> {

    List<RoletaMeta> findAllByOrderByOrdemAscIdAsc();

    @Query("""
            select meta from RoletaMeta meta
            where meta.ativa = true
              and meta.status not in :statusIgnorados
            order by meta.ordem asc, meta.id asc
            """)
    List<RoletaMeta> findMetasAtivasDisponiveis(
            @Param("statusIgnorados") Collection<RoletaMetaStatus> statusIgnorados
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select meta from RoletaMeta meta
            where meta.ativa = true
              and meta.status not in :statusIgnorados
            order by meta.ordem asc, meta.id asc
            """)
    List<RoletaMeta> findMetasAtivasDisponiveisForUpdate(
            @Param("statusIgnorados") Collection<RoletaMetaStatus> statusIgnorados
    );
}
