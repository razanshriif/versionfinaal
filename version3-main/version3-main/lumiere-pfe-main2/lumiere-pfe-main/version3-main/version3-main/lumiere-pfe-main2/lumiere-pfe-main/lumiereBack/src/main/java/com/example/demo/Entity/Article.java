package com.example.demo.Entity;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
@Data
@Entity

public class Article {
	  
	
	    @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;
	 
	    private String codeArticle;
	    private String Label;
	    private String type;
	    private int typeDeMarchandise;
	    private String typeDeRemorque;
	    private String unite;
	    private double quantiteMinimum;
	    private double prixUnitaire;
	    
	    private double vente;
	    private double achat;
		public Long getId() {
			return id;
		}
		public void setId(Long id) {
			this.id = id;
		}
		public String getCodeArticle() {
			return codeArticle;
		}
		public void setCodeArticle(String codeArticle) {
			this.codeArticle = codeArticle;
		}
		public String getLabel() {
			return Label;
		}
		public void setLabel(String label) {
			Label = label;
		}
		public String getType() {
			return type;
		}
		public void setType(String type) {
			this.type = type;
		}
		public int getTypeDeMarchandise() {
			return typeDeMarchandise;
		}
		public void setTypeDeMarchandise(int typeDeMarchandise) {
			this.typeDeMarchandise = typeDeMarchandise;
		}
		public String getTypeDeRemorque() {
			return typeDeRemorque;
		}
		public void setTypeDeRemorque(String typeDeRemorque) {
			this.typeDeRemorque = typeDeRemorque;
		}
		public String getUnite() {
			return unite;
		}
		public void setUnite(String unite) {
			this.unite = unite;
		}
		public double getQuantiteMinimum() {
			return quantiteMinimum;
		}
		public void setQuantiteMinimum(double quantiteMinimum) {
			this.quantiteMinimum = quantiteMinimum;
		}
		public double getPrixUnitaire() {
			return prixUnitaire;
		}
		public void setPrixUnitaire(double prixUnitaire) {
			this.prixUnitaire = prixUnitaire;
		}
		public double getVente() {
			return vente;
		}
		public void setVente(double vente) {
			this.vente = vente;
		}
		public double getAchat() {
			return achat;
		}
		public void setAchat(double achat) {
			this.achat = achat;
		}

	    
}
