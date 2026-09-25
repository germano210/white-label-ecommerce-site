package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "roleta_giros_visitantes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_roleta_giros_visitantes_token",
                columnNames = "token"
        ),
        indexes = {
                @Index(name = "idx_roleta_giros_visitantes_status_expira", columnList = "status, expira_em"),
                @Index(name = "idx_roleta_giros_visitantes_usuario", columnList = "usuario_id")
        }
)
public class RoletaGiroVisitante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "nivel_id", nullable = false)
    private RoletaNivel nivel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "premio_id", nullable = false)
    private RoletaPremio premio;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_premio", nullable = false, length = 40)
    private RoletaTipoPremio tipoPremio;

    @Column(name = "valor_premio", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorPremio = BigDecimal.ZERO;

    @Column(name = "nivel_nome_snapshot", length = 120)
    private String nivelNomeSnapshot;

    @Column(name = "nivel_cor_hex", length = 7)
    private String nivelCorHex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoletaGiroVisitanteStatus status = RoletaGiroVisitanteStatus.PENDENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "vinculado_em")
    private LocalDateTime vinculadoEm;

    protected RoletaGiroVisitante() {
    }

    public RoletaGiroVisitante(
            String token,
            RoletaNivel nivel,
            RoletaPremio premio,
            RoletaTipoPremio tipoPremio,
            BigDecimal valorPremio,
            LocalDateTime expiraEm
    ) {
        this.token = Objects.requireNonNull(token);
        this.nivel = Objects.requireNonNull(nivel);
        this.premio = Objects.requireNonNull(premio);
        this.tipoPremio = Objects.requireNonNull(tipoPremio);
        this.valorPremio = valorPremio == null ? BigDecimal.ZERO : valorPremio;
        this.expiraEm = Objects.requireNonNull(expiraEm);
        this.nivelNomeSnapshot = nivel.getNome();
        this.nivelCorHex = nivel.getCorHex();
    }

    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public RoletaNivel getNivel() {
        return nivel;
    }

    public RoletaPremio getPremio() {
        return premio;
    }

    public RoletaTipoPremio getTipoPremio() {
        return tipoPremio == null ? RoletaTipoPremio.DESCONTO_VALOR : tipoPremio;
    }

    public BigDecimal getValorPremio() {
        return valorPremio == null ? BigDecimal.ZERO : valorPremio;
    }

    public String getNivelNomeSnapshot() {
        return nivelNomeSnapshot;
    }

    public String getNivelCorHex() {
        return nivelCorHex;
    }

    public RoletaGiroVisitanteStatus getStatus() {
        return status == null ? RoletaGiroVisitanteStatus.PENDENTE : status;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getExpiraEm() {
        return expiraEm;
    }

    public LocalDateTime getVinculadoEm() {
        return vinculadoEm;
    }

    public boolean expiradoEm(LocalDateTime now) {
        return expiraEm != null && !expiraEm.isAfter(now);
    }

    public void vincular(Usuario usuario, LocalDateTime now) {
        this.usuario = Objects.requireNonNull(usuario);
        this.status = RoletaGiroVisitanteStatus.VINCULADO;
        this.vinculadoEm = now == null ? LocalDateTime.now() : now;
    }

    public void expirar() {
        this.status = RoletaGiroVisitanteStatus.EXPIRADO;
    }

    @PrePersist
    void preencherCriacao() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        if (status == null) {
            status = RoletaGiroVisitanteStatus.PENDENTE;
        }
        if (valorPremio == null) {
            valorPremio = BigDecimal.ZERO;
        }
    }
}
