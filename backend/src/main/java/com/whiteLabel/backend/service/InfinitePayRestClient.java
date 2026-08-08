package com.whiteLabel.backend.service;

import com.whiteLabel.backend.dto.InfinitePayLinkRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InfinitePayRestClient implements InfinitePayClient {

    private final RestClient restClient;
    private final String linksUrl;
    private final String apiKey;

    public InfinitePayRestClient(
            @Value("${infinitepay.links-url}") String linksUrl,
            @Value("${infinitepay.api-key:}") String apiKey
    ) {
        this.restClient = RestClient.builder().build();
        this.linksUrl = linksUrl;
        this.apiKey = apiKey;
    }

    @Override
    public InfinitePayLinkResponse criarLink(InfinitePayLinkRequest request) {
        try {
            RestClient.RequestBodySpec spec = restClient.post()
                    .uri(linksUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON);

            if (apiKey != null && !apiKey.isBlank()) {
                spec.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey.trim());
            }

            return spec.body(request)
                    .retrieve()
                    .body(InfinitePayLinkResponse.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Nao foi possivel criar link de pagamento na InfinitePay",
                    exception
            );
        }
    }
}
