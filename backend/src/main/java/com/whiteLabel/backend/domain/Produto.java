package com.whiteLabel.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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

    @Column(name = "preco_venda", nullable = false)
    private BigDecimal precoVenda;

    @Column(name = "preco_antigo")
    private BigDecimal precoAntigo;

    // Métricas do "Tinder" de roupas
    @Column(name = "curtidas_count")
    private Integer curtidasCount = 0;

    @Column(name = "passos_count")
    private Integer passosCount = 0;

    // Para nunca apagarmos um produto e quebrarmos o histórico de vendas
    @Column(nullable = false)
    private Boolean ativo = true;
}