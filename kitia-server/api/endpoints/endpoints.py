
from fastapi import FastAPI, APIRouter
from .endpointsProms import router as proms_router
from .endpointsProducts import router as product_router
from .endpointsTasks import router as task_router
from .endpointsUsers import router as user_router
    
router = APIRouter()
router.include_router(proms_router)
router.include_router(product_router)
router.include_router(task_router)
router.include_router(user_router)

def init_fastapi():
    description = """
    IAjupiter server - Contenedores y Virtualización. 

    ## Objetivos:
        1) Aplicar principios de programación orientada a objetos y desarrollar código que se englobe en este paradigma de programación.
        2) Desarrollar aplicaciones web backend con el framework FastAPI, basado en Python.
        3) Usar diferentes verbos HTTP y diferentes técnicas habituales en el mundo backend, en arquitecturas REST (enviar payload, responder con el código HTTP adecuado a cada caso...).
        4) Desplegar aplicaciones backend en entornos locales.
        5) Crear código en Python usando la librería requests para interactuar con APIs
        6) se agrega un manejador de excepciones personalizado para capturar los errores de validación de solicitudes (RequestValidationError) y registrar los detalles del error utilizando el logger configurado. Esto permitirá que los errores de validación se registren con un nivel de advertencia (warning) en lugar de error (error), lo que facilitará la identificación y solución de problemas relacionados con la validación de solicitudes en la API.
        7) se agrega un logger.info para registrar los mensajes de log en el módulo "api.endpoints". Esto permite que los mensajes de log se identifiquen claramente como provenientes de este módulo específico y generar la trazabilidad de los errores de validación en el módulo "api.endpoints" para facilitar la identificación y solución de problemas relacionados con la validación de solicitudes en la API.        
    ## Tecnologías utilizadas:
        - Python 3.8+
        - FastAPI
        - PostgreSQL
        - psycopg2
        - Pydantic
    ## Modelo de DB:
        - TaskDB: id, titulo, contenido, status, deadline, created_at, updated_at
        - Pydantic: TaskCreate, TaskUpdate, TaskResponse (hereda orm_mode)
        - TaskManager con encapsulamiento + abstracción:  _clean_text() (normaliza / censura palabras malsonantes) 
    ## Notas:
        - El proyecto se desarrollará usando FastAPI, un framework moderno y rápido para construir APIs con Python.
        - Se implementarán endpoints para crear tareas, obtener detalles de tareas, marcar tareas como completadas y listar tareas caducadas.
        - La persistencia de datos se realizará utilizando PostgreSQL, lo que permitirá almacenar las tareas de manera eficiente.
        - Se aplicarán principios de programación orientada a objetos para estructurar el código de manera modular y mantenible.
        - Se utilizarán modelos Pydantic para validar y serializar los datos de entrada y salida de la API.
        - Se implementa una clase TaskManager para encapsular la lógica de negocio relacionada con las tareas, incluyendo una función _clean_text() para normalizar o censurar palabras malsonantes en los títulos y contenidos de las tareas.   
    """
    app = FastAPI(title="Task Management API",
                description=description,
                version="1.0.5",
                contact={
                    "url": "https://www.linkedin.com/in/german-dario-realpe-zambrano/",
                    "name": "Creador: German Dario realpe zambrano",
                    "email": "gedorz@gmail.com",
                })
    return app


@router.get("/")
def root():
    return {"status": "ok", "hint": "Ir a /docs o usar POST /analyze o POST /analyze-system"}

