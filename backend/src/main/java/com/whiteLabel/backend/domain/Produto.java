package com.whiteLabel.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "produtos")
@Data // Magia do Lombok: cria todos os Getters e Setters automaticamente!
@NoArgsConstructor // O JPA exige um construtor vazio
@AllArgsConstructor // Cria um construtor com todos os campos
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String detalhes;

    @Column(name = "imagem_url")
    private String imagemUrl;

    private String tamanho;

    @Column(name = "preco_venda", nullable = false)
    private BigDecimal precoVenda;

    @Column(name = "preco_antigo")
    private BigDecimal precoAntigo;

    @Column(
            nullable = false,
            precision = 4,
            scale = 2,
            columnDefinition = "numeric(4,2) default 0"
    )
    private BigDecimal condicao = BigDecimal.ZERO;

    @Column(name = "preco_custo", precision = 12, scale = 2)
    private BigDecimal precoCusto;

    // Métricas do "Tinder" de roupas
    @Column(name = "curtidas_count")
    private Integer curtidasCount = 0;

    @Column(name = "passos_count")
    private Integer passosCount = 0;

    // Para nunca apagarmos um produto e quebrarmos o histórico de vendas
    @Column(nullable = false)
    private Boolean ativo = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30) default 'DISPONIVEL'")
    private ProdutoStatus status = ProdutoStatus.DISPONIVEL;

    @Column(
            name = "criado_em",
            nullable = false,
            updatable = false,
            columnDefinition = "timestamp default current_timestamp"
    )
    private LocalDateTime criadoEm;

    @PrePersist
    void preencherCriadoEm() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }

        preencherPadroes();
    }

    @PreUpdate
    void atualizarPadroes() {
        preencherPadroes();
    }

    public ProdutoStatus getStatus() {
        if (status == ProdutoStatus.VENDIDO) {
            return ProdutoStatus.VENDIDO;
        }
        if (Boolean.FALSE.equals(ativo)) {
            return ProdutoStatus.INATIVO;
        }
        return status == null ? ProdutoStatus.DISPONIVEL : status;
    }

    public boolean disponivelParaReserva() {
        return Boolean.TRUE.equals(ativo) && getStatus() == ProdutoStatus.DISPONIVEL;
    }

    public void marcarReservado() {
        if (Boolean.TRUE.equals(ativo) && getStatus() == ProdutoStatus.DISPONIVEL) {
            status = ProdutoStatus.RESERVADO;
        }
    }

    public void liberarReserva() {
        if (Boolean.TRUE.equals(ativo) && getStatus() == ProdutoStatus.RESERVADO) {
            status = ProdutoStatus.DISPONIVEL;
        }
    }

    public void marcarVendido() {
        status = ProdutoStatus.VENDIDO;
        ativo = false;
    }

    private void preencherPadroes() {
        if (condicao == null) {
            condicao = BigDecimal.ZERO;
        }
        if (status == null) {
            status = Boolean.FALSE.equals(ativo) ? ProdutoStatus.INATIVO : ProdutoStatus.DISPONIVEL;
        }
    }
}
