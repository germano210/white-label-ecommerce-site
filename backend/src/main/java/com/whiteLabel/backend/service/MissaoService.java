package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoCiclo;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.MissaoRequest;
import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.repository.MissaoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class MissaoService {

    private final MissaoRepository missaoRepository;
    private final UsuarioService usuarioService;
    private final MissaoProgressService missaoProgressService;

    public MissaoService(
            MissaoRepository missaoRepository,
            UsuarioService usuarioService,
            MissaoProgressService missaoProgressService
    ) {
        this.missaoRepository = missaoRepository;
        this.usuarioService = usuarioService;
        this.missaoProgressService = missaoProgressService;
    }

    @Transactional
    public MissaoResponse criar(MissaoRequest request) {
        Missao missao = new Missao(
                request.titulo().trim(),
                request.icone().trim(),
                request.metaProgresso(),
                normalizarTipoAcao(request.tipoAcao()),
                request.valorBase(),
                request.peso()
        );
        missao.setDescricao(normalizarDescricao(request.descricao()));
        missao.setCiclo(normalizarCiclo(request.ciclo()));
        missao.setTentativasRecompensa(request.tentativasRecompensa());

        return MissaoResponse.from(missaoRepository.save(missao));
    }

    @Transactional(readOnly = true)
    public List<MissaoResponse> listar() {
        return missaoProgressService.listarMissoesAtivas(obterUsuarioAutenticadoOpcional());
    }

    @Transactional(readOnly = true)
    public List<MissaoResponse> listarAdmin() {
        return missaoRepository.findAllByAtivaTrueOrderByIdAsc()
                .stream()
                .map(MissaoResponse::from)
                .toList();
    }

    @Transactional
    public MissaoResponse atualizar(Long id, MissaoRequest request) {
        Missao missao = buscarMissaoAtiva(id);
        missao.setTitulo(request.titulo().trim());
        missao.setDescricao(normalizarDescricao(request.descricao()));
        missao.setIcone(request.icone().trim());
        missao.setMetaProgresso(request.metaProgresso());
        missao.setTipoAcao(normalizarTipoAcao(request.tipoAcao()));
        missao.setCiclo(normalizarCiclo(request.ciclo()));
        missao.setValorBase(request.valorBase());
        missao.setPeso(request.peso());
        missao.setTentativasRecompensa(request.tentativasRecompensa());

        return MissaoResponse.from(missaoRepository.save(missao));
    }

    @Transactional
    public Usuario concluir(Long id, Usuario usuario) {
        Missao missao = buscarMissaoAtiva(id);

        return usuarioService.adicionarXp(
                usuario,
                missao.getValorBase(),
                missao.getPeso()
        );
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

    private String normalizarTipoAcao(String tipoAcao) {
        return MissaoTipoAcao.from(tipoAcao)
                .map(Enum::name)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "tipo_acao invalido. Tipos permitidos: "
                                + MissaoTipoAcao.valoresPermitidos()
                ));
    }

    private MissaoCiclo normalizarCiclo(String ciclo) {
        return MissaoCiclo.from(ciclo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "ciclo invalido. Tipos permitidos: NORMAL, SEMANAL"
                ));
    }

    private String normalizarDescricao(String descricao) {
        if (descricao == null || descricao.isBlank()) {
            return null;
        }

        return descricao.trim();
    }

    private UUID obterUsuarioAutenticadoOpcional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
