package com.example.demo.Entity;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Data
@Entity

public class Tranck {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Date departureDateTime;
	private Boolean depart;

	private Date loadingDateD;
	private Date loadingDateF;

	private Boolean chargement;

	private Date deliveryDateD;
	private Date deliveryDateF;

	private Boolean livraison;

	@OneToOne(mappedBy = "trancking")
	@JsonIgnore
	@ToString.Exclude
	@EqualsAndHashCode.Exclude
	private Ordre ordre;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Date getDepartureDateTime() {
		return departureDateTime;
	}

	public void setDepartureDateTime(Date departureDateTime) {
		this.departureDateTime = departureDateTime;
	}

	public Boolean getDepart() {
		return depart;
	}

	public void setDepart(Boolean depart) {
		this.depart = depart;
	}

	public Date getLoadingDateD() {
		return loadingDateD;
	}

	public void setLoadingDateD(Date loadingDateD) {
		this.loadingDateD = loadingDateD;
	}

	public Date getLoadingDateF() {
		return loadingDateF;
	}

	public void setLoadingDateF(Date loadingDateF) {
		this.loadingDateF = loadingDateF;
	}

	public Boolean getChargement() {
		return chargement;
	}

	public void setChargement(Boolean chargement) {
		this.chargement = chargement;
	}

	public Date getDeliveryDateD() {
		return deliveryDateD;
	}

	public void setDeliveryDateD(Date deliveryDateD) {
		this.deliveryDateD = deliveryDateD;
	}

	public Date getDeliveryDateF() {
		return deliveryDateF;
	}

	public void setDeliveryDateF(Date deliveryDateF) {
		this.deliveryDateF = deliveryDateF;
	}

	public Boolean getLivraison() {
		return livraison;
	}

	public void setLivraison(Boolean livraison) {
		this.livraison = livraison;
	}

	public Ordre getOrdre() {
		return ordre;
	}

	public void setOrdre(Ordre ordre) {
		this.ordre = ordre;
	}

}
