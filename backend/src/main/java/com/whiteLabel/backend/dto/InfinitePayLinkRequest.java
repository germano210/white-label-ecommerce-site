package com.whiteLabel.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record InfinitePayLinkRequest(
        String handle,

        @JsonProperty("redirect_url")
        String redirectUrl,

        @JsonProperty("webhook_url")
        String webhookUrl,

        @JsonProperty("order_nsu")
        String orderNsu,

        List<Item> items
) {

    public record Item(
            Integer quantity,
            Long price,
            String description
    ) {
    }
}
