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

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class BackendApplicationTests {

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
		assertNotNull(idOriginal);

		TokenResponse response = authService.verifyOtp(
				new VerifyOtpRequest(telefone, usuario.getOtp())
		);

		assertEquals(idOriginal, response.usuario().id());
		assertEquals("Ana", response.usuario().nome());
		assertEquals(telefone, response.usuario().telefone());

		authService.requestOtp(new RequestOtpRequest(telefone, "Ana Atualizada"));
		Usuario mesmoUsuario = usuarioRepository.findByTelefone(telefone).orElseThrow();

		assertEquals(idOriginal, mesmoUsuario.getId());
		assertEquals("Ana Atualizada", mesmoUsuario.getNome());
	}
}
