package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CheckoutProdutosRequest(
        @NotEmpty
        List<@NotNull Long> produtoIds
) {
}
