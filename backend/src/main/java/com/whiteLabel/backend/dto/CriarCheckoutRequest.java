package com.whiteLabel.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CriarCheckoutRequest(
        @NotEmpty
        List<@Valid Item> itens
) {

    public record Item(
            @NotNull
            Long produtoId,

            @NotNull
            @Min(1)
            Integer quantidade
    ) {
    }
}
