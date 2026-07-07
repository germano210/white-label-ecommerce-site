package com.whiteLabel.backend.config;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Executa apos o contexto Spring estar pronto para garantir dados minimos de acesso
 * administrativo sem depender de insercoes manuais no banco local.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "germano@brechocami.com";
    private static final String ADMIN_PASSWORD = "senhasegura@123";
    private static final String ADMIN_TELEFONE_RESERVADO = "admin";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * O CommandLineRunner roda uma vez a cada inicializacao da aplicacao, logo apos
     * a criacao dos beans. A senha padrao nunca e persistida em texto limpo: apenas
     * o hash criptografico gerado pelo PasswordEncoder e salvo no PostgreSQL.
     */
    @Override
    public void run(String... args) {
        var usuarioExistente = usuarioRepository.findByEmail(ADMIN_EMAIL);

        if (usuarioExistente.isPresent()) {
            Usuario admin = usuarioExistente.get();
            boolean atualizado = false;

            if (admin.getRole() != UsuarioRole.ADMIN) {
                admin.setRole(UsuarioRole.ADMIN);
                atualizado = true;
            }

            if (admin.getPassword() == null || admin.getPassword().isBlank()) {
                admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                atualizado = true;
            }

            if (atualizado) {
                usuarioRepository.save(admin);
            }

            return;
        }

        Usuario admin = new Usuario("Germano Admin", ADMIN_TELEFONE_RESERVADO);
        admin.setEmail(ADMIN_EMAIL);
        admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        admin.setRole(UsuarioRole.ADMIN);

        usuarioRepository.save(admin);
    }
}
