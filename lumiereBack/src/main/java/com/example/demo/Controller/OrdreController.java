package com.example.demo.Controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.format.annotation.DateTimeFormat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.example.demo.Entity.Ordre;
import com.example.demo.Entity.Statut;
import com.example.demo.Service.OrdreService;
import com.example.demo.Service.PlaFileService;

@RestController
@RequestMapping("/api/v1/ordres")
@CrossOrigin("*")
public class OrdreController {

	@Autowired
	private OrdreService ordreService;

	@Autowired
	private PlaFileService plaFileService;

	// ✅ GET tous les ordres
	@GetMapping
	public List<Ordre> getAllOrdres() {
		return ordreService.findAll();
	}

	// ✅ GET ordres par code client
	@GetMapping("/client/{clientCode}")
	public List<Ordre> getOrdresByClient(@PathVariable String clientCode) {
		return ordreService.findByClientCode(clientCode);
	}

	// ✅ GET un ordre par ID
	@GetMapping("/{id}")
	public Optional<Ordre> getOrdreById(@PathVariable(value = "id") Long id) {
		return ordreService.findById(id);
	}

	// ✅ POST créer un ordre
	@PostMapping
	public Ordre createOrdre(@RequestBody Ordre ordre) {
		return ordreService.save(ordre);
	}

	// ✅ PUT mettre à jour un ordre
	@PutMapping("/{id}")
	public ResponseEntity<Ordre> updateOrdre(@PathVariable(value = "id") Long id, @RequestBody Ordre ordreDetails) {
		Ordre updatedOrdre = ordreService.update(id, ordreDetails);
		return ResponseEntity.ok(updatedOrdre);
	}

	// ✅ POST mettre à jour la position GPS (Webhook pour Tracker Matériel)
	@PostMapping("/{id}/gps")
	public ResponseEntity<Ordre> updateGpsPosition(@PathVariable(value = "id") Long id, @RequestBody com.example.demo.Entity.GpsCoordinates coords) {
		Ordre updatedOrdre = ordreService.updateGpsPosition(id, coords.getLat(), coords.getLon());
		return ResponseEntity.ok(updatedOrdre);
	}

	// ✅ DELETE un ordre
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteOrdre(@PathVariable(value = "id") Long id) {
		ordreService.deleteById(id);
		return ResponseEntity.noContent().build();
	}

	// ✅ PUT confirmer un ordre (ancienne URL — conservée pour compatibilité web)
	@PutMapping("/confirmer/{id}")
	public void confirmerOrdreOldUrl(@PathVariable(value = "id") Long id) {
		this.ordreService.confirmer(id);
		Optional<Ordre> ordre = ordreService.findById(id);
		ordre.ifPresent(o -> {
			try {
				plaFileService.generatePlaFile(o);
			} catch (IOException e) {
				// Exception gérée silencieusement
			}
		});
	}

	// ✅ PUT confirmer un ordre (nouvelle URL — pour le mobile)
	@PutMapping("/{id}/confirmer")
	public ResponseEntity<Ordre> confirmerOrdre(@PathVariable(value = "id") Long id) {
		this.ordreService.confirmer(id);
		Optional<Ordre> ordre = ordreService.findById(id);
		ordre.ifPresent(o -> {
			try {
				plaFileService.generatePlaFile(o);
			} catch (IOException e) {
				// Exception gérée silencieusement
			}
		});
		return ordreService.findById(id)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	// ✅ POST annuler un ordre (mobile)
	@PostMapping("/{id}/annuler")
	public ResponseEntity<Ordre> annulerOrdre(@PathVariable Long id,
			@RequestBody(required = false) Map<String, String> body) {
		Optional<Ordre> optOrdre = ordreService.findById(id);
		if (optOrdre.isEmpty())
			return ResponseEntity.notFound().build();

		Ordre ordre = optOrdre.get();
		String motif = body != null ? body.getOrDefault("motif", "") : "";
		if (!motif.isEmpty()) {
			Set<String> commentaires = ordre.getCommentaires() != null
					? new HashSet<>(ordre.getCommentaires())
					: new HashSet<>();
			commentaires.add("Annulation: " + motif);
			ordre.setCommentaires(commentaires);
		}
		ordre.setStatut(Statut.NON_CONFIRME);
		Ordre updated = ordreService.save(ordre);
		return ResponseEntity.ok(updated);
	}

	// ✅ POST dupliquer un ordre (mobile)
	@PostMapping("/{id}/dupliquer")
	public ResponseEntity<Ordre> dupliquerOrdre(@PathVariable Long id) {
		Optional<Ordre> optOrdre = ordreService.findById(id);
		if (optOrdre.isEmpty())
			return ResponseEntity.notFound().build();

		Ordre original = optOrdre.get();
		Ordre copie = new Ordre();
		copie.setClient(original.getClient());
		copie.setNomclient(original.getNomclient());
		copie.setSiteclient(original.getSiteclient());
		copie.setIdedi(original.getIdedi());
		copie.setCodeclientcharg(original.getCodeclientcharg());
		copie.setChargementNom(original.getChargementNom());
		copie.setChargementAdr1(original.getChargementAdr1());
		copie.setChargementAdr2(original.getChargementAdr2());
		copie.setChargementVille(original.getChargementVille());
		copie.setChargementDate(original.getChargementDate());
		copie.setCodeclientliv(original.getCodeclientliv());
		copie.setLivraisonNom(original.getLivraisonNom());
		copie.setLivraisonAdr1(original.getLivraisonAdr1());
		copie.setLivraisonAdr2(original.getLivraisonAdr2());
		copie.setCodepostalliv(original.getCodepostalliv());
		copie.setLivraisonVille(original.getLivraisonVille());
		copie.setLivraisonDate(original.getLivraisonDate());
		copie.setCodeArticle(original.getCodeArticle());
		copie.setDesignation(original.getDesignation());
		copie.setPoids(original.getPoids());
		copie.setVolume(original.getVolume());
		copie.setNombrePalettes(original.getNombrePalettes());
		copie.setNombreColis(original.getNombreColis());
		copie.setLongueur(original.getLongueur());
		copie.setStatut(Statut.NON_CONFIRME);
		copie.setOrderNumber("COPIE-" + original.getOrderNumber());

		Ordre saved = ordreService.save(copie);
		return ResponseEntity.ok(saved);
	}

	// ✅ POST dupliquer un ordre N fois (web)
	@PostMapping("/{id}/dupliquer-multiple")
	public ResponseEntity<List<Ordre>> dupliquerMultiple(@PathVariable Long id,
			@RequestParam(defaultValue = "1") int count) {
		Optional<Ordre> optOrdre = ordreService.findById(id);
		if (optOrdre.isEmpty())
			return ResponseEntity.notFound().build();

		if (count < 1 || count > 50)
			count = 1;

		Ordre original = optOrdre.get();
		List<Ordre> copies = new ArrayList<>();

		for (int i = 0; i < count; i++) {
			Ordre copie = new Ordre();
			copie.setClient(original.getClient());
			copie.setNomclient(original.getNomclient());
			copie.setSiteclient(original.getSiteclient());
			copie.setIdedi(original.getIdedi());
			copie.setCodeclientcharg(original.getCodeclientcharg());
			copie.setChargementNom(original.getChargementNom());
			copie.setChargementAdr1(original.getChargementAdr1());
			copie.setChargementAdr2(original.getChargementAdr2());
			copie.setChargementVille(original.getChargementVille());
			copie.setChargementDate(original.getChargementDate());
			copie.setCodeclientliv(original.getCodeclientliv());
			copie.setLivraisonNom(original.getLivraisonNom());
			copie.setLivraisonAdr1(original.getLivraisonAdr1());
			copie.setLivraisonAdr2(original.getLivraisonAdr2());
			copie.setCodepostalliv(original.getCodepostalliv());
			copie.setLivraisonVille(original.getLivraisonVille());
			copie.setLivraisonDate(original.getLivraisonDate());
			copie.setCodeArticle(original.getCodeArticle());
			copie.setDesignation(original.getDesignation());
			copie.setPoids(original.getPoids());
			copie.setVolume(original.getVolume());
			copie.setNombrePalettes(original.getNombrePalettes());
			copie.setNombreColis(original.getNombreColis());
			copie.setLongueur(original.getLongueur());
			copie.setStatut(Statut.NON_CONFIRME);
			Ordre saved = ordreService.save(copie);
			copies.add(saved);
		}

		return ResponseEntity.ok(copies);
	}

	// ✅ GET historique d'un ordre (commentaires) — pour le mobile
	@GetMapping("/{id}/historique")
	public ResponseEntity<Set<String>> getHistorique(@PathVariable Long id) {
		Optional<Ordre> optOrdre = ordreService.findById(id);
		if (optOrdre.isEmpty())
			return ResponseEntity.notFound().build();
		Set<String> commentaires = optOrdre.get().getCommentaires();
		return ResponseEntity.ok(commentaires != null ? commentaires : new HashSet<>());
	}

	// ✅ GET statistiques — pour le mobile
	@GetMapping("/statistiques")
	public ResponseEntity<Map<String, Long>> getStatistiques() {
		Map<String, Long> stats = new HashMap<>();
		stats.put("total", ordreService.countAllOrders());
		stats.put("nonPlanifie", ordreService.countNonPlanifieOrders());
		stats.put("planifie", ordreService.countPlanifieOrders());
		stats.put("enCoursDeChargement", ordreService.getEnCoursDeChargementOrdersCount());
		stats.put("charge", ordreService.getChargeOrdersCount());
		stats.put("enCoursDeLivraison", ordreService.getEnCoursDeLivraisonOrdersCount());
		stats.put("livre", ordreService.getLivreOrdersCount());
		return ResponseEntity.ok(stats);
	}

	@PostMapping("/generate-pla-file")
	public ResponseEntity<Void> generatePlaFileBulk(@RequestBody List<Long> ids) {
		List<Ordre> ordres = ids.stream()
				.map(ordreService::findById)
				.filter(Optional::isPresent)
				.map(Optional::get)
				.toList();

		if (ordres.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		try {
			plaFileService.generatePlaFileForOrders(ordres);
			return ResponseEntity.ok().build();
		} catch (IOException e) {
			return ResponseEntity.internalServerError().build();
		}
	}

	@PostMapping("/confirmer-multiple")
	public ResponseEntity<Void> confirmerMultiple(@RequestBody List<Long> ids) {
		List<Ordre> confirmed = ordreService.confirmerMultiple(ids);
		if (confirmed.isEmpty()) {
			return ResponseEntity.notFound().build();
		}
		try {
			plaFileService.generatePlaFileForOrders(confirmed);
			return ResponseEntity.ok().build();
		} catch (IOException e) {
			return ResponseEntity.internalServerError().build();
		}
	}

	@GetMapping("/search")
	public List<Ordre> searchOrdres(
			@RequestParam(required = false) String client,
			@RequestParam(required = false) Statut statut,
			@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
			@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
			@RequestParam(required = false) String chauffeur,
			@RequestParam(required = false) String site,
			@RequestParam(required = false) String destination) {
		return ordreService.search(client, statut, startDate, endDate, chauffeur, site, destination);
	}

	// --- Endpoints comptages individuels (compatibilité web) ---
	@GetMapping("/count")
	public long countOrders() {
		return ordreService.countAllOrders();
	}

	@GetMapping("/countNonPlanifie")
	public long countNonPlanifieOrders() {
		return ordreService.countNonPlanifieOrders();
	}

	@GetMapping("/countPlanifie")
	public long countPlanifieOrders() {
		return ordreService.countPlanifieOrders();
	}

	@GetMapping("/count/en-cours-de-chargement")
	public long countEnCoursDeChargementOrders() {
		return ordreService.getEnCoursDeChargementOrdersCount();
	}

	@GetMapping("/count/charge")
	public long countChargeOrders() {
		return ordreService.getChargeOrdersCount();
	}

	@GetMapping("/count/en-cours-de-livraison")
	public long countEnCoursDeLivraisonOrders() {
		return ordreService.getEnCoursDeLivraisonOrdersCount();
	}

	@GetMapping("/count/livre")
	public long countLivreOrders() {
		return ordreService.getLivreOrdersCount();
	}
}
