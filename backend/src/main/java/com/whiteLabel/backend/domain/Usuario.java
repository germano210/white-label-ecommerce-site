package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(length = 150)
    private String nome;

    @Column(unique = true, length = 180)
    private String email;

    @Column(length = 120)
    private String password;

    @Column(unique = true, length = 15)
    private String telefone;

    @Column(length = 6)
    private String otp;

    @Column(name = "otp_expiracao")
    private LocalDateTime otpExpiracao;

    @Enumerated(EnumType.STRING)
    @Column(name = "perfil_acesso", length = 30)
    private UsuarioRole role = UsuarioRole.USER;

    @Column
    private Integer xp = 0;

    @Column
    private Integer nivel = 1;

    @Column
    private Integer tentativas = 0;

    @Column(name = "codigo_indicacao", unique = true, length = 40)
    private String codigoIndicacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicado_por_id")
    private Usuario indicadoPor;

    @Column(name = "endereco_rua", length = 180)
    private String enderecoRua;

    @Column(name = "endereco_numero", length = 30)
    private String enderecoNumero;

    @Column(name = "endereco_complemento", length = 120)
    private String enderecoComplemento;

    @Column(name = "endereco_bairro", length = 100)
    private String enderecoBairro;

    @Column(name = "endereco_cidade", length = 100)
    private String enderecoCidade;

    @Column(name = "endereco_estado", length = 2)
    private String enderecoEstado;

    @Column(name = "endereco_cep", length = 8)
    private String enderecoCep;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    protected Usuario() {
    }

    public Usuario(String nome, String telefone) {
        this.nome = nome;
        this.telefone = telefone;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public LocalDateTime getOtpExpiracao() {
        return otpExpiracao;
    }

    public void setOtpExpiracao(LocalDateTime otpExpiracao) {
        this.otpExpiracao = otpExpiracao;
    }

    public UsuarioRole getRole() {
        return role == null ? UsuarioRole.USER : role;
    }

    public void setRole(UsuarioRole role) {
        this.role = role == null ? UsuarioRole.USER : role;
    }

    public Integer getXp() {
        return xp == null ? 0 : xp;
    }

    public void setXp(Integer xp) {
        this.xp = xp == null ? 0 : xp;
    }

    public Integer getNivel() {
        return nivel == null ? 1 : nivel;
    }

    public void setNivel(Integer nivel) {
        this.nivel = nivel == null ? 1 : nivel;
    }

    public Integer getTentativas() {
        return tentativas == null ? 0 : tentativas;
    }

    public void adicionarTentativas(Integer quantidade) {
        int incremento = Math.max(0, quantidade == null ? 0 : quantidade);
        tentativas = getTentativas() + incremento;
    }

    public String getCodigoIndicacao() {
        return codigoIndicacao;
    }

    public void setCodigoIndicacao(String codigoIndicacao) {
        this.codigoIndicacao = codigoIndicacao;
    }

    public Usuario getIndicadoPor() {
        return indicadoPor;
    }

    public void setIndicadoPor(Usuario indicadoPor) {
        this.indicadoPor = indicadoPor;
    }

    public String getEnderecoRua() {
        return enderecoRua;
    }

    public void setEnderecoRua(String enderecoRua) {
        this.enderecoRua = enderecoRua;
    }

    public String getEnderecoNumero() {
        return enderecoNumero;
    }

    public void setEnderecoNumero(String enderecoNumero) {
        this.enderecoNumero = enderecoNumero;
    }

    public String getEnderecoComplemento() {
        return enderecoComplemento;
    }

    public void setEnderecoComplemento(String enderecoComplemento) {
        this.enderecoComplemento = enderecoComplemento;
    }

    public String getEnderecoBairro() {
        return enderecoBairro;
    }

    public void setEnderecoBairro(String enderecoBairro) {
        this.enderecoBairro = enderecoBairro;
    }

    public String getEnderecoCidade() {
        return enderecoCidade;
    }

    public void setEnderecoCidade(String enderecoCidade) {
        this.enderecoCidade = enderecoCidade;
    }

    public String getEnderecoEstado() {
        return enderecoEstado;
    }

    public void setEnderecoEstado(String enderecoEstado) {
        this.enderecoEstado = enderecoEstado;
    }

    public String getEnderecoCep() {
        return enderecoCep;
    }

    public void setEnderecoCep(String enderecoCep) {
        this.enderecoCep = enderecoCep;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    @PrePersist
    void preencherDataCriacao() {
        if (role == null) {
            role = UsuarioRole.USER;
        }

        if (xp == null) {
            xp = 0;
        }

        if (nivel == null) {
            nivel = 1;
        }

        if (tentativas == null) {
            tentativas = 0;
        }

        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
    }
}
