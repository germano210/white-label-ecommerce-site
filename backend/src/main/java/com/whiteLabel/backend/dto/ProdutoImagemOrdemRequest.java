package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ProdutoImagemOrdemRequest(
        @NotEmpty List<Long> imagemIds
) {
}
