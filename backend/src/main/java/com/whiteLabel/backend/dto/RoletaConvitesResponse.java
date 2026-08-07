package com.whiteLabel.backend.dto;

public record RoletaConvitesResponse(
        String codigoConvite,
        String urlConvite,
        Long quantidadeConvertida,
        Integer girosGanhosPorConvite
) {
}
