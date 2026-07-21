package com.whiteLabel.backend.domain;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PedidoStatus status = PedidoStatus.PENDENTE;

    @Column(name = "valor_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PedidoItem> itens = new ArrayList<>();

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao", nullable = false)
    private LocalDateTime dataAtualizacao;

    @Version
    private Long versao;

    protected Pedido() {
    }

    public Pedido(Usuario usuario) {
        this.usuario = Objects.requireNonNull(usuario);
    }

    public void adicionarItem(Produto produto, Integer quantidade) {
        PedidoItem item = new PedidoItem(this, produto, quantidade);
        itens.add(item);
        valorTotal = valorTotal.add(item.getSubtotal());
    }

    public void aguardarPagamento() {
        status = PedidoStatus.AGUARDANDO_PAGAMENTO;
    }

    public void marcarPago() {
        status = PedidoStatus.PAGO;
    }

    public void marcarFalha() {
        status = PedidoStatus.FALHOU;
    }

    public void cancelar() {
        status = PedidoStatus.CANCELADO;
    }

    @PrePersist
    void preencherDatasCriacao() {
        LocalDateTime agora = LocalDateTime.now();
        dataCriacao = agora;
        dataAtualizacao = agora;

        if (status == null) {
            status = PedidoStatus.PENDENTE;
        }

        if (valorTotal == null) {
            valorTotal = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    void preencherDataAtualizacao() {
        dataAtualizacao = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public PedidoStatus getStatus() {
        return status;
    }

    public BigDecimal getValorTotal() {
        return valorTotal == null ? BigDecimal.ZERO : valorTotal;
    }

    public List<PedidoItem> getItens() {
        return List.copyOf(itens);
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public LocalDateTime getDataAtualizacao() {
        return dataAtualizacao;
    }
}
