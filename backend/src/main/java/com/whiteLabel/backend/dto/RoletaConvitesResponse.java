package com.whiteLabel.backend.dto;

public record RoletaConvitesResponse(
        String codigoConvite,
        String urlConvite,
        Long quantidadeConvertida,
        Long convitesConvertidos,
        Integer girosGanhosPorConvite,
        Integer girosPorConvite
) {
}
