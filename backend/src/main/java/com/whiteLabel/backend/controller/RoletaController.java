package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.CheckoutResponse;
import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.dto.RoletaConvitesRequest;
import com.whiteLabel.backend.dto.RoletaConvitesResponse;
import com.whiteLabel.backend.dto.RoletaGiroResponse;
import com.whiteLabel.backend.dto.RoletaSaqueResponse;
import com.whiteLabel.backend.dto.RoletaStatusResponse;
import com.whiteLabel.backend.service.RoletaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/roleta")
public class RoletaController {

    private final RoletaService roletaService;

    public RoletaController(RoletaService roletaService) {
        this.roletaService = roletaService;
    }

    @GetMapping({"", "/"})
    public RoletaStatusResponse status() {
        return roletaService.obterStatus();
    }

    @PostMapping("/girar")
    public RoletaGiroResponse girar() {
        return roletaService.girar();
    }

    @GetMapping("/produtos")
    public List<ProdutoResponseDTO> produtos() {
        return roletaService.listarProdutosRoleta();
    }

    @PostMapping("/produtos/{produtoId}/resgatar")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse resgatarProduto(@PathVariable Long produtoId) {
        return roletaService.resgatarProduto(produtoId);
    }

    @GetMapping("/convites")
    public RoletaConvitesResponse convites() {
        return roletaService.obterConvites();
    }

    @PostMapping("/convites")
    public RoletaConvitesResponse registrarConvite(
            @Valid @RequestBody RoletaConvitesRequest request
    ) {
        return roletaService.registrarConvite(request);
    }

    @PostMapping("/saques")
    @ResponseStatus(HttpStatus.CREATED)
    public RoletaSaqueResponse sacarValorDisponivel() {
        return roletaService.sacarValorDisponivel();
    }
}
