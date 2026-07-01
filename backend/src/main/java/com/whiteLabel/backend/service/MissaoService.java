package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.dto.MissaoRequest;
import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.repository.MissaoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class MissaoService {

    private final MissaoRepository missaoRepository;

    public MissaoService(MissaoRepository missaoRepository) {
        this.missaoRepository = missaoRepository;
    }

    @Transactional
    public MissaoResponse criar(MissaoRequest request) {
        Missao missao = new Missao(
                request.titulo().trim(),
                request.icone().trim(),
                request.metaProgresso(),
                request.tipoAcao().trim()
        );

        return MissaoResponse.from(missaoRepository.save(missao));
    }

    @Transactional(readOnly = true)
    public List<MissaoResponse> listar() {
        return missaoRepository.findAllByAtivaTrueOrderByIdAsc()
                .stream()
                .map(MissaoResponse::from)
                .toList();
    }

    @Transactional
    public MissaoResponse atualizar(Long id, MissaoRequest request) {
        Missao missao = buscarMissaoAtiva(id);
        missao.setTitulo(request.titulo().trim());
        missao.setIcone(request.icone().trim());
        missao.setMetaProgresso(request.metaProgresso());
        missao.setTipoAcao(request.tipoAcao().trim());

        return MissaoResponse.from(missaoRepository.save(missao));
    }

    @Transactional
    public void excluir(Long id) {
        Missao missao = buscarMissaoAtiva(id);
        missao.desativar();
        missaoRepository.save(missao);
    }

    private Missao buscarMissaoAtiva(Long id) {
        return missaoRepository.findByIdAndAtivaTrue(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Missao nao encontrada"
                ));
    }
}
