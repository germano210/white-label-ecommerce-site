package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "roleta_interacoes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_roleta_interacao_chave_evento", columnNames = "chave_evento")
        }
)
public class RoletaInteracao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RoletaInteracaoTipo tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "usuario_nome_snapshot", length = 140)
    private String usuarioNomeSnapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_secundario_id")
    private Usuario usuarioSecundario;

    @Column(name = "usuario_secundario_nome_snapshot", length = 140)
    private String usuarioSecundarioNomeSnapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    @Column(name = "produto_nome_snapshot", length = 180)
    private String produtoNomeSnapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nivel_id")
    private RoletaNivel nivel;

    @Column(name = "nivel_nome_snapshot", length = 120)
    private String nivelNomeSnapshot;

    @Column(name = "nivel_cor_hex", length = 20)
    private String nivelCorHex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "premio_id")
    private RoletaPremio premio;

    @Column(precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(name = "texto_snapshot", nullable = false, length = 500)
    private String textoSnapshot;

    @Column(name = "conta_para_meta", nullable = false)
    private Boolean contaParaMeta = true;

    @Column(name = "chave_evento", length = 180)
    private String chaveEvento;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected RoletaInteracao() {
    }

    public RoletaInteracao(
            RoletaInteracaoTipo tipo,
            Usuario usuario,
            String usuarioNomeSnapshot,
            Usuario usuarioSecundario,
            String usuarioSecundarioNomeSnapshot,
            Produto produto,
            String produtoNomeSnapshot,
            RoletaNivel nivel,
            String nivelNomeSnapshot,
            String nivelCorHex,
            RoletaPremio premio,
            BigDecimal valor,
            String textoSnapshot,
            Boolean contaParaMeta,
            String chaveEvento
    ) {
        this.tipo = tipo;
        this.usuario = usuario;
        this.usuarioNomeSnapshot = usuarioNomeSnapshot;
        this.usuarioSecundario = usuarioSecundario;
        this.usuarioSecundarioNomeSnapshot = usuarioSecundarioNomeSnapshot;
        this.produto = produto;
        this.produtoNomeSnapshot = produtoNomeSnapshot;
        this.nivel = nivel;
        this.nivelNomeSnapshot = nivelNomeSnapshot;
        this.nivelCorHex = nivelCorHex;
        this.premio = premio;
        this.valor = normalizarValor(valor);
        this.textoSnapshot = textoSnapshot;
        this.contaParaMeta = contaParaMeta == null || contaParaMeta;
        this.chaveEvento = chaveEvento;
    }

    public Long getId() {
        return id;
    }

    public RoletaInteracaoTipo getTipo() {
        return tipo;
    }

    public String getUsuarioNomeSnapshot() {
        return usuarioNomeSnapshot;
    }

    public String getUsuarioSecundarioNomeSnapshot() {
        return usuarioSecundarioNomeSnapshot;
    }

    public String getProdutoNomeSnapshot() {
        return produtoNomeSnapshot;
    }

    public String getNivelNomeSnapshot() {
        return nivelNomeSnapshot;
    }

    public String getNivelCorHex() {
        return nivelCorHex;
    }

    public BigDecimal getValor() {
        return valor == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : valor;
    }

    public String getTextoSnapshot() {
        return textoSnapshot;
    }

    public Boolean getContaParaMeta() {
        return contaParaMeta == null || contaParaMeta;
    }

    public String getChaveEvento() {
        return chaveEvento;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    @PrePersist
    void preencherCriadoEm() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        if (valor == null) {
            valor = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (contaParaMeta == null) {
            contaParaMeta = true;
        }
    }

    private BigDecimal normalizarValor(BigDecimal rawValor) {
        if (rawValor == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return rawValor.setScale(2, RoundingMode.HALF_UP);
    }
}
