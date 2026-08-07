package com.whiteLabel.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ImagemStorageService {

    private static final long TAMANHO_MAXIMO_IMAGEM_BYTES = 15L * 1024L * 1024L;
    public static final String MENSAGEM_IMAGEM_GRANDE =
            "Imagem muito grande. Envie fotos de até 15 MB cada.";

    private static final Set<String> EXTENSOES_PERMITIDAS =
            Set.of(".jpg", ".jpeg", ".png", ".webp", ".svg");
    private static final Set<String> CONTENT_TYPES_PERMITIDOS =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml");
    private static final Pattern SVG_ATRIBUTO_EVENTO_PATTERN =
            Pattern.compile("[\\s<]on[a-z0-9_-]*\\s*=", Pattern.CASE_INSENSITIVE);

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

        if (imagem.getSize() > TAMANHO_MAXIMO_IMAGEM_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, MENSAGEM_IMAGEM_GRANDE);
        }

        String contentType = imagem.getContentType();
        if (
                contentType == null
                        || !CONTENT_TYPES_PERMITIDOS.contains(
                        contentType.toLowerCase(Locale.ROOT))
        ) {
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

        if (isSvg(extensao, contentType)) {
            validarSvgSeguro(imagem);
        }
    }

    private boolean isSvg(String extensao, String contentType) {
        return ".svg".equals(extensao)
                || "image/svg+xml".equals(contentType.toLowerCase(Locale.ROOT));
    }

    private void validarSvgSeguro(MultipartFile imagem) {
        String conteudo = lerUtf8(imagem).toLowerCase(Locale.ROOT);
        if (conteudo.contains("<script")
                || conteudo.contains("javascript:")
                || SVG_ATRIBUTO_EVENTO_PATTERN.matcher(conteudo).find()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SVG inválido ou inseguro.");
        }
    }

    private String lerUtf8(MultipartFile imagem) {
        try {
            return StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(imagem.getBytes()))
                    .toString();
        } catch (CharacterCodingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SVG inválido ou inseguro.");
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Nao foi possivel validar a imagem",
                    exception
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
