# facial-recognition-service-py/face_processor.py
import face_recognition
import numpy as np
from PIL import Image
import requests
import io

# NOTA: dlib (usado por face_recognition) pode precisar ser treinado
# com modelos específicos, mas face_recognition geralmente os inclui.

def get_image_from_url(image_url):
    """Baixa uma imagem de uma URL e a carrega."""
    try:
        response = requests.get(image_url, stream=True)
        response.raise_for_status() # Lança erro para status ruins (4xx, 5xx)
        image = Image.open(io.BytesIO(response.content)).convert('RGB')
        return np.array(image) # Converte para array numpy
    except requests.exceptions.RequestException as e:
        print(f"Erro ao baixar imagem de {image_url}: {e}")
        return None
    except Exception as e:
        print(f"Erro ao abrir imagem de {image_url}: {e}")
        return None

def get_image_from_buffer(image_buffer):
    """Carrega uma imagem a partir de um buffer de bytes."""
    try:
        image = Image.open(io.BytesIO(image_buffer)).convert('RGB')
        return np.array(image) # Converte para array numpy
    except Exception as e:
        print(f"Erro ao abrir imagem do buffer: {e}")
        return None

def get_face_descriptor(image_np):
    """Calcula o descritor facial (embedding) para a primeira face encontrada."""
    if image_np is None:
        return None
    try:
        # Localiza as caixas delimitadoras das faces
        face_locations = face_recognition.face_locations(image_np, model="cnn") # 'cnn' é mais preciso, 'hog' é mais rápido

        if not face_locations:
            print("Nenhuma face encontrada na imagem.")
            return None
        if len(face_locations) > 1:
            print("Múltiplas faces encontradas, processando a primeira.")
            # Poderia tentar encontrar a maior face aqui

        # Calcula o embedding para a primeira face encontrada
        face_encodings = face_recognition.face_encodings(image_np, known_face_locations=[face_locations[0]], num_jitters=1) # num_jitters pode aumentar precisão

        if face_encodings:
            return face_encodings[0].tolist() # Retorna como lista python
        else:
            print("Não foi possível calcular o encoding da face.")
            return None
    except Exception as e:
        print(f"Erro no processamento facial: {e}")
        return None

def find_best_match(descriptor_to_match, known_descriptors_data, tolerance=0.5):
    """Encontra o melhor match para um descritor em uma lista conhecida."""
    if descriptor_to_match is None or not known_descriptors_data:
        return None

    try:
        known_encodings = [np.array(kd['descriptor']) for kd in known_descriptors_data]
        known_user_ids = [kd['userId'] for kd in known_descriptors_data]

        if not known_encodings:
             return None

        # Compara o descritor a ser comparado com a lista de conhecidos
        matches = face_recognition.compare_faces(known_encodings, np.array(descriptor_to_match), tolerance=tolerance)
        face_distances = face_recognition.face_distance(known_encodings, np.array(descriptor_to_match))

        best_match_index = -1
        min_distance = 1.0 # Distância máxima possível

        if True in matches:
             # Encontra o índice do melhor match (menor distância) entre os que deram True
             matched_indices = [i for i, match in enumerate(matches) if match]
             distances_for_matches = [face_distances[i] for i in matched_indices]
             best_match_index_in_matches = np.argmin(distances_for_matches)
             best_match_index = matched_indices[best_match_index_in_matches]
             min_distance = distances_for_matches[best_match_index_in_matches]

        if best_match_index != -1:
            best_match_user_id = known_user_ids[best_match_index]
            print(f"Melhor match (Python): User {best_match_user_id}, Distância: {min_distance}")
            return {"userId": best_match_user_id, "distance": min_distance}
        else:
            print("Nenhum match encontrado dentro da tolerância.")
            return None
    except Exception as e:
        print(f"Erro na comparação facial: {e}")
        return None