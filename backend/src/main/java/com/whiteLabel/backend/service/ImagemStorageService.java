package com.whiteLabel.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ImagemStorageService {

    private static final Set<String> EXTENSOES_PERMITIDAS =
            Set.of(".jpg", ".jpeg", ".png", ".webp");

    private final Path uploadsPath = Path.of("uploads").toAbsolutePath().normalize();

    public String guardar(MultipartFile imagem) {
        validarImagem(imagem);

        String extensao = obterExtensao(imagem.getOriginalFilename());
        String nomeArquivo = UUID.randomUUID() + extensao;
        Path destino = uploadsPath.resolve(nomeArquivo).normalize();

        if (!destino.getParent().equals(uploadsPath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome de arquivo invalido");
        }

        try {
            Files.createDirectories(uploadsPath);
            Files.copy(imagem.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + nomeArquivo;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Nao foi possivel guardar a imagem",
                    exception
            );
        }
    }

    private void validarImagem(MultipartFile imagem) {
        if (imagem == null || imagem.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem e obrigatoria");
        }

        String contentType = imagem.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O arquivo enviado deve ser uma imagem"
            );
        }

        String extensao = obterExtensao(imagem.getOriginalFilename());
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Formato de imagem nao permitido"
            );
        }
    }

    private String obterExtensao(String nomeOriginal) {
        if (nomeOriginal == null) {
            return "";
        }

        int ultimoPonto = nomeOriginal.lastIndexOf('.');
        if (ultimoPonto < 0) {
            return "";
        }

        return nomeOriginal.substring(ultimoPonto).toLowerCase(Locale.ROOT);
    }
}
