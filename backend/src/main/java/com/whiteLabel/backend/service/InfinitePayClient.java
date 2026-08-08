package com.whiteLabel.backend.service;

import com.whiteLabel.backend.dto.InfinitePayLinkRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkResponse;

public interface InfinitePayClient {

    InfinitePayLinkResponse criarLink(InfinitePayLinkRequest request);
}
