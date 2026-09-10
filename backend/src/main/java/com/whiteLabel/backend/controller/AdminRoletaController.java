package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.AdminRoletaRequest;
import com.whiteLabel.backend.dto.AdminRoletaResponse;
import com.whiteLabel.backend.service.RoletaService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@RestController
@RequestMapping("/api/admin/roleta")
public class AdminRoletaController {

    private static final Logger log = LoggerFactory.getLogger(AdminRoletaController.class);

    private final RoletaService roletaService;

    public AdminRoletaController(RoletaService roletaService) {
        this.roletaService = roletaService;
    }

    @GetMapping({"", "/"})
    public AdminRoletaResponse status() {
        return roletaService.obterAdmin();
    }

    @PutMapping({"", "/"})
    public AdminRoletaResponse atualizar(@Valid @RequestBody AdminRoletaRequest request) {
        try {
            return roletaService.atualizarAdmin(request);
        } catch (DataIntegrityViolationException exception) {
            log.warn(
                    "Falha de integridade ao salvar configuracao da roleta admin: {}",
                    detalheErroBanco(exception)
            );
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    mensagemAmigavelErroBanco(exception),
                    exception
            );
        }
    }

    private String mensagemAmigavelErroBanco(DataIntegrityViolationException exception) {
        String detalhe = detalheErroBanco(exception).toLowerCase(Locale.ROOT);
        if (detalhe.contains("ux_roleta_niveis_ordem")) {
            return "Ja existe um nivel ativo com essa ordem.";
        }
        if (detalhe.contains("ux_roleta_niveis_nome")) {
            return "Ja existe um nivel ativo com esse nome.";
        }

        return "Nao foi possivel salvar a configuracao da roleta.";
    }

    private String detalheErroBanco(DataIntegrityViolationException exception) {
        Throwable causa = exception.getMostSpecificCause();
        return causa == null || causa.getMessage() == null
                ? exception.getMessage()
                : causa.getMessage();
    }
}
