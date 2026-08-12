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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_desconto_id")
    private Produto produtoDesconto;

    @Column(name = "preco_original", precision = 12, scale = 2)
    private BigDecimal precoOriginal;

    @Column(name = "desconto_aplicado", nullable = false, precision = 12, scale = 2)
    private BigDecimal descontoAplicado = BigDecimal.ZERO;

    @Column(name = "preco_final", precision = 12, scale = 2)
    private BigDecimal precoFinal;

    @Column(name = "order_nsu", unique = true, length = 80)
    private String orderNsu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roleta_giro_id")
    private RoletaGiro roletaGiro;

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

    public void adicionarItem(Produto produto, Integer quantidade, BigDecimal precoUnitario) {
        PedidoItem item = new PedidoItem(this, produto, quantidade, precoUnitario);
        itens.add(item);
        valorTotal = valorTotal.add(item.getSubtotal());
    }

    public void registrarCheckoutProduto(
            Produto produto,
            BigDecimal precoOriginal,
            BigDecimal descontoAplicado,
            BigDecimal precoFinal
    ) {
        this.produto = Objects.requireNonNull(produto);
        this.precoOriginal = normalizarValor(precoOriginal);
        this.descontoAplicado = normalizarValor(descontoAplicado);
        this.precoFinal = normalizarValor(precoFinal);
        this.valorTotal = this.precoFinal;
    }

    public void registrarCheckoutProdutos(
            List<Produto> produtos,
            Produto produtoDesconto,
            BigDecimal precoOriginal,
            BigDecimal descontoAplicado,
            BigDecimal precoFinal
    ) {
        if (produtos == null || produtos.size() != 1) {
            throw new IllegalArgumentException("Pedido precisa ter exatamente um produto");
        }
        this.produto = produtos.get(0);
        this.produtoDesconto = produtoDesconto;
        this.precoOriginal = normalizarValor(precoOriginal);
        this.descontoAplicado = normalizarValor(descontoAplicado);
        this.precoFinal = normalizarValor(precoFinal);
        this.valorTotal = this.precoFinal;
    }

    public void definirOrderNsu(String orderNsu) {
        this.orderNsu = Objects.requireNonNull(orderNsu);
    }

    public void vincularPremioRoleta(RoletaGiro roletaGiro) {
        this.roletaGiro = roletaGiro;
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

    public void expirar() {
        status = PedidoStatus.EXPIRADO;
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

        if (descontoAplicado == null) {
            descontoAplicado = BigDecimal.ZERO;
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

    public Produto getProduto() {
        return produto;
    }

    public Produto getProdutoDesconto() {
        return produtoDesconto;
    }

    public BigDecimal getPrecoOriginal() {
        return precoOriginal == null ? getValorTotal() : precoOriginal;
    }

    public BigDecimal getDescontoAplicado() {
        return descontoAplicado == null ? BigDecimal.ZERO : descontoAplicado;
    }

    public BigDecimal getPrecoFinal() {
        return precoFinal == null ? getValorTotal() : precoFinal;
    }

    public String getOrderNsu() {
        return orderNsu;
    }

    public RoletaGiro getRoletaGiro() {
        return roletaGiro;
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

    private BigDecimal normalizarValor(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
