package com.whiteLabel.backend.repository;

import com.whiteLabel.backend.domain.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    Optional<Pagamento> findByCheckoutId(String checkoutId);

    Optional<Pagamento> findByPaymentId(String paymentId);

    Optional<Pagamento> findByEventId(String eventId);
}
