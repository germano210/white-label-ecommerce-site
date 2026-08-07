package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoletaConvitesRequest(
        @NotBlank @Size(max = 40) String codigoConvite
) {
}
