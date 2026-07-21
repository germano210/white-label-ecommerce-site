package com.whiteLabel.backend.config;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoCiclo;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.repository.MissaoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Executa apos o contexto Spring estar pronto para garantir dados minimos de acesso
 * administrativo sem depender de insercoes manuais no banco local.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final MissaoRepository missaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminTelefone;

    public DataInitializer(
            UsuarioRepository usuarioRepository,
            MissaoRepository missaoRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.initializer.admin-email:}") String adminEmail,
            @Value("${app.initializer.admin-password:}") String adminPassword,
            @Value("${app.initializer.admin-telefone:admin}") String adminTelefone
    ) {
        this.usuarioRepository = usuarioRepository;
        this.missaoRepository = missaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail == null ? "" : adminEmail.trim().toLowerCase();
        this.adminPassword = adminPassword == null ? "" : adminPassword;
        this.adminTelefone = adminTelefone == null || adminTelefone.isBlank()
                ? "admin"
                : adminTelefone.trim();
    }

    /**
     * O CommandLineRunner roda uma vez a cada inicializacao da aplicacao, logo apos
     * a criacao dos beans. A senha padrao nunca e persistida em texto limpo: apenas
     * o hash criptografico gerado pelo PasswordEncoder e salvo no PostgreSQL.
     */
    @Override
    public void run(String... args) {
        garantirMissoesSemanais();

        if (adminEmail.isBlank()) {
            return;
        }

        var usuarioExistente = usuarioRepository.findByEmail(adminEmail);

        if (usuarioExistente.isPresent()) {
            Usuario admin = usuarioExistente.get();
            boolean atualizado = false;

            if (admin.getRole() != UsuarioRole.ADMIN) {
                admin.setRole(UsuarioRole.ADMIN);
                atualizado = true;
            }

            if ((admin.getPassword() == null || admin.getPassword().isBlank())
                    && !adminPassword.isBlank()) {
                admin.setPassword(passwordEncoder.encode(adminPassword));
                atualizado = true;
            }

            if (atualizado) {
                usuarioRepository.save(admin);
            }

            return;
        }

        if (adminPassword.isBlank()) {
            return;
        }

        Usuario admin = new Usuario("Germano Admin", adminTelefone);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(UsuarioRole.ADMIN);

        usuarioRepository.save(admin);
    }

    private void garantirMissoesSemanais() {
        criarMissaoSemanalSeNaoExistir(
                MissaoTipoAcao.COMPLETAR_MISSOES,
                "Complete 2 missoes",
                "Finalize missoes normais durante a semana.",
                "check-circle",
                2,
                100,
                1,
                1
        );
        criarMissaoSemanalSeNaoExistir(
                MissaoTipoAcao.ALCANCAR_NIVEL,
                "Alcance nivel 3",
                "Suba de nivel com acoes reais no app.",
                "trending-up",
                3,
                150,
                1,
                1
        );
        criarMissaoSemanalSeNaoExistir(
                MissaoTipoAcao.CONVIDAR_PESSOAS,
                "Convide 3 pessoas",
                "Compartilhe pecas e conte quando outro usuario logado abrir.",
                "users",
                3,
                150,
                1,
                2
        );
        criarMissaoSemanalSeNaoExistir(
                MissaoTipoAcao.BONUS_DIARIO,
                "Bonus diario",
                "Preparado para a sequencia diaria de resgates.",
                "calendar",
                1,
                0,
                1,
                0
        );
    }

    private void criarMissaoSemanalSeNaoExistir(
            MissaoTipoAcao tipoAcao,
            String titulo,
            String descricao,
            String icone,
            Integer meta,
            Integer valorBase,
            Integer peso,
            Integer tentativas
    ) {
        if (missaoRepository.existsByTipoAcaoAndCiclo(tipoAcao.name(), MissaoCiclo.SEMANAL)) {
            return;
        }

        Missao missao = new Missao(
                titulo,
                icone,
                meta,
                tipoAcao.name(),
                valorBase,
                peso
        );
        missao.setDescricao(descricao);
        missao.setCiclo(MissaoCiclo.SEMANAL);
        missao.setTentativasRecompensa(tentativas);
        missaoRepository.save(missao);
    }
}
