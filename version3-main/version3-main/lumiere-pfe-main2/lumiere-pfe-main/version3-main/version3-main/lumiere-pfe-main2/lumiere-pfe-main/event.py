import mysql.connector
import sys
import json
import logging
from decimal import Decimal
from datetime import datetime

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def convert_to_dict(row, columns):
    result_dict = {}
    for i, col in enumerate(columns):
        if isinstance(row[i], Decimal):
            result_dict[col] = float(row[i])
        elif isinstance(row[i], datetime):
            result_dict[col] = row[i].strftime('%Y-%m-%d %H:%M:%S')
        else:
            result_dict[col] = row[i]
    return result_dict

def fetch_values(param):
    host = '172.18.3.65'
    database = 'mobilite_lumiere'
    user = 'requeteur'
    password = 'user123456'

    logging.info("Démarrage de la récupération des données pour le voycle : %s", param)
    
    try:
        logging.info("Connexion à la base de données MySQL...")
        conn = mysql.connector.connect(
            host=host,
            database=database,
            user=user,
            password=password
        )
        cursor = conn.cursor()
        logging.info("Connexion réussie.")

        query = """
            SELECT voycle, chauff, camion, name_event, date_saisi, KM 
            FROM mobilite_lumiere.event_voyage 
            WHERE voycle = %s
        """
        logging.info("Exécution de la requête SQL...")
        cursor.execute(query, (param,))
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        logging.info("Requête exécutée avec succès. %d lignes récupérées.", len(rows))

        logging.info("Conversion des lignes en dictionnaires...")
        results = [convert_to_dict(row, columns) for row in rows]

        logging.info("Fermeture de la connexion à la base de données.")
        conn.close()

        return results

    except Exception as e:
        logging.error("Erreur pendant la récupération des données : %s", str(e))
        return [{'error': str(e)}]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logging.error("Aucun paramètre fourni. Utilisation : python event.py <voycle>")
        sys.exit(1)

    param = sys.argv[1]
    logging.info("Lancement du script avec le paramètre : %s", param)
    
    results = fetch_values(param)

    logging.info("Affichage des résultats au format JSON :")
    print(json.dumps(results, indent=4, ensure_ascii=False))