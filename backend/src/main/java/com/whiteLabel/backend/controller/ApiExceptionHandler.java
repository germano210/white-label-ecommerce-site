package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.service.ImagemStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSizeExceeded() {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse(ImagemStorageService.MENSAGEM_IMAGEM_GRANDE));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException exception) {
        String mensagem = exception.getReason() == null
                ? exception.getStatusCode().toString()
                : exception.getReason();

        return ResponseEntity
                .status(exception.getStatusCode())
                .body(new ApiErrorResponse(mensagem));
    }

    public record ApiErrorResponse(String message) {
    }
}
