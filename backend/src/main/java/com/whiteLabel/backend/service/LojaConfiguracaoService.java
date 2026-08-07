package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.LojaConfiguracao;
import com.whiteLabel.backend.dto.LojaConfiguracaoAdminResponse;
import com.whiteLabel.backend.dto.LojaConfiguracaoPublicaResponse;
import com.whiteLabel.backend.dto.LojaConfiguracaoRequest;
import com.whiteLabel.backend.repository.LojaConfiguracaoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LojaConfiguracaoService {

    private static final Long CONFIG_ID = 1L;

    private final LojaConfiguracaoRepository lojaConfiguracaoRepository;

    public LojaConfiguracaoService(LojaConfiguracaoRepository lojaConfiguracaoRepository) {
        this.lojaConfiguracaoRepository = lojaConfiguracaoRepository;
    }

    @Transactional
    public LojaConfiguracaoPublicaResponse obterPublica() {
        LojaConfiguracao configuracao = obterOuCriar();
        return new LojaConfiguracaoPublicaResponse(configuracao.getCondicaoCasasDecimais());
    }

    @Transactional
    public LojaConfiguracaoAdminResponse obterAdmin() {
        return montarAdminResponse(obterOuCriar());
    }

    @Transactional
    public LojaConfiguracaoAdminResponse atualizar(LojaConfiguracaoRequest request) {
        validarCasasDecimais(request.condicaoCasasDecimais());

        LojaConfiguracao configuracao = obterOuCriar();
        configuracao.setCondicaoCasasDecimais(request.condicaoCasasDecimais());

        return montarAdminResponse(lojaConfiguracaoRepository.save(configuracao));
    }

    private LojaConfiguracao obterOuCriar() {
        return lojaConfiguracaoRepository.findById(CONFIG_ID)
                .orElseGet(() -> lojaConfiguracaoRepository.save(criarPadrao()));
    }

    private LojaConfiguracao criarPadrao() {
        LojaConfiguracao configuracao = new LojaConfiguracao();
        configuracao.setId(CONFIG_ID);
        configuracao.setCondicaoCasasDecimais(1);
        return configuracao;
    }

    private void validarCasasDecimais(Integer condicaoCasasDecimais) {
        if (condicaoCasasDecimais == null
                || (condicaoCasasDecimais != 1 && condicaoCasasDecimais != 2)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Casas decimais da condicao deve ser 1 ou 2"
            );
        }
    }

    private LojaConfiguracaoAdminResponse montarAdminResponse(LojaConfiguracao configuracao) {
        return new LojaConfiguracaoAdminResponse(
                configuracao.getCondicaoCasasDecimais(),
                configuracao.getAtualizadaEm()
        );
    }
}
