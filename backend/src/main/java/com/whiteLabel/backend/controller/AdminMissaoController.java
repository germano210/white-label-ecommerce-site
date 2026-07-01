package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.MissaoRequest;
import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.service.MissaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Centraliza o CRUD de missoes no painel administrativo e exige autoridade ADMIN
 * para impedir que tokens comuns do fluxo OTP mobile alterem regras de gamificacao.
 */
@RestController
@RequestMapping("/api/admin/missoes")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
public class AdminMissaoController {

    private final MissaoService missaoService;

    public AdminMissaoController(MissaoService missaoService) {
        this.missaoService = missaoService;
    }

    /**
     * Cria missoes somente para usuarios administrativos autenticados por JWT.
     */
    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public MissaoResponse criar(@Valid @RequestBody MissaoRequest request) {
        return missaoService.criar(request);
    }

    /**
     * Lista missoes ativas apenas no contexto administrativo protegido por ADMIN.
     */
    @GetMapping({"", "/"})
    public List<MissaoResponse> listar() {
        return missaoService.listar();
    }

    /**
     * Atualiza dados de missao somente quando o JWT possuir autoridade ADMIN.
     */
    @PutMapping("/{id}")
    public MissaoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody MissaoRequest request
    ) {
        return missaoService.atualizar(id, request);
    }

    /**
     * Desativa missoes via painel admin sem expor exclusao logica a usuarios comuns.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        missaoService.excluir(id);
    }
}
