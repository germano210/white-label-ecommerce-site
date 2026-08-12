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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "produto_reservas")
public class ProdutoReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProdutoReservaStatus status = ProdutoReservaStatus.ATIVA;

    @Column(name = "reservado_em", nullable = false, updatable = false)
    private LocalDateTime reservadoEm;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "finalizado_em")
    private LocalDateTime finalizadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected ProdutoReserva() {
    }

    public ProdutoReserva(
            Produto produto,
            Usuario usuario,
            LocalDateTime reservadoEm,
            LocalDateTime expiraEm
    ) {
        this.produto = Objects.requireNonNull(produto);
        this.usuario = Objects.requireNonNull(usuario);
        this.reservadoEm = Objects.requireNonNull(reservadoEm);
        this.expiraEm = Objects.requireNonNull(expiraEm);
    }

    public Long getId() {
        return id;
    }

    public Produto getProduto() {
        return produto;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public Pedido getPedido() {
        return pedido;
    }

    public ProdutoReservaStatus getStatus() {
        return status == null ? ProdutoReservaStatus.ATIVA : status;
    }

    public LocalDateTime getReservadoEm() {
        return reservadoEm;
    }

    public LocalDateTime getExpiraEm() {
        return expiraEm;
    }

    public LocalDateTime getFinalizadoEm() {
        return finalizadoEm;
    }

    public boolean ativaEm(LocalDateTime agora) {
        return getStatus() == ProdutoReservaStatus.ATIVA
                && expiraEm != null
                && expiraEm.isAfter(agora);
    }

    public void vincularPedido(Pedido pedido) {
        this.pedido = Objects.requireNonNull(pedido);
    }

    public void finalizar(LocalDateTime agora) {
        status = ProdutoReservaStatus.FINALIZADA;
        finalizadoEm = agora;
    }

    public void expirar(LocalDateTime agora) {
        status = ProdutoReservaStatus.EXPIRADA;
        finalizadoEm = agora;
    }

    public void cancelar(LocalDateTime agora) {
        status = ProdutoReservaStatus.CANCELADA;
        finalizadoEm = agora;
    }

    @PrePersist
    void preencherCriacao() {
        if (status == null) {
            status = ProdutoReservaStatus.ATIVA;
        }
        if (reservadoEm == null) {
            reservadoEm = LocalDateTime.now();
        }
        if (expiraEm == null) {
            expiraEm = reservadoEm.plusMinutes(15);
        }
        atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    void preencherAtualizacao() {
        atualizadoEm = LocalDateTime.now();
    }
}
