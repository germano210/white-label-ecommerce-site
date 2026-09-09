package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Usuario;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByTelefone(String telefone);

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByCodigoIndicacao(String codigoIndicacao);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select usuario from Usuario usuario where usuario.id = :id")
    Optional<Usuario> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByEmail(String email);

    boolean existsByCodigoIndicacao(String codigoIndicacao);

    @Query("""
            select count(usuario)
            from Usuario usuario
            where usuario.indicadoPor.id = :indicadorId
            """)
    long countByIndicadoPorId(@Param("indicadorId") UUID indicadorId);
}
