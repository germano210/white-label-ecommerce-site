package com.whiteLabel.backend;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.RequestOtpRequest;
import com.whiteLabel.backend.dto.TokenResponse;
import com.whiteLabel.backend.dto.VerifyOtpRequest;
import com.whiteLabel.backend.repository.UsuarioRepository;
import com.whiteLabel.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class BackendApplicationTests {

	private static final List<String> NOMES_INICIAIS = List.of(
			"Birdperson",
			"Meeseeks",
			"Squanchy",
			"Solenya",
			"Terry",
			"Nubnub",
			"Jaguar",
			"Curtis",
			"Wing",
			"Diane",
			"Golden fold",
			"Jessica",
			"Brad",
			"Ice-t",
			"Planetina",
			"Morty",
			"Rick",
			"Jerry",
			"Beth"
	);

	@Autowired
	private AuthService authService;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Test
	void contextLoads() {
	}

	@Test
	@Transactional
	void shouldPreserveAccountAndReturnPersistedUserData() {
		String telefone = "5511988887777";
		authService.requestOtp(new RequestOtpRequest(telefone, "Ana"));

		Usuario usuario = usuarioRepository.findByTelefone(telefone).orElseThrow();
		UUID idOriginal = usuario.getId();
		String nomeInicial = usuario.getNome();
		assertNotNull(idOriginal);
		assertNotNull(nomeInicial);
		assertTrue(NOMES_INICIAIS.contains(nomeInicial));

		TokenResponse response = authService.verifyOtp(
				new VerifyOtpRequest(telefone, usuario.getOtp())
		);

		assertEquals(idOriginal, response.usuario().id());
		assertEquals(nomeInicial, response.usuario().nome());
		assertEquals(telefone, response.usuario().telefone());

		authService.requestOtp(new RequestOtpRequest(telefone, "Ana Atualizada"));
		Usuario mesmoUsuario = usuarioRepository.findByTelefone(telefone).orElseThrow();

		assertEquals(idOriginal, mesmoUsuario.getId());
		assertEquals(nomeInicial, mesmoUsuario.getNome());
	}
}
