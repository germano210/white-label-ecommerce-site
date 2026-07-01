package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
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

    @Column(nullable = false, unique = true, length = 15)
    private String telefone;

    @Column(length = 6)
    private String otp;

    @Column(name = "otp_expiracao")
    private LocalDateTime otpExpiracao;

    @Enumerated(EnumType.STRING)
    @Column(name = "perfil_acesso", length = 30)
    private UsuarioRole role = UsuarioRole.USER;

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

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    @PrePersist
    void preencherDataCriacao() {
        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
    }
}
