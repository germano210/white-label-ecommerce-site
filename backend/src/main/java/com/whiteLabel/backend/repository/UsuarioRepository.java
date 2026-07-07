package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByTelefone(String telefone);

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}
