# Configuración de IAjupiter
        HOST (Ubuntu Server)
        │
        ├── Ollama (DeepSeek)
        ├── Docker
        │ ├── Scraper
        │ ├── PostgreSQL
        │ ├── API(FastAPI)
        │ └── nginx


# Servicios en ejecución
    ✅ API (FastAPI) - Conectado a Ollama exitosamente
    ✅ PostgreSQL - Puerto 5432
    ✅ nginx - Proxy reverso en puerto 80    

# Todos estos endpoints ahora funcionan correctamente:
    # Swagger UI (200 OK)           http://192.168.1.37/api/docs         
    # OpenAPI schema (200 OK JSON)  http://192.168.1.37/api/openapi.json  
    # Acceso directo (200 OK)       http://192.168.1.37:8001/docs        
    
# ambiente de python
# Is done: Descripción explicativa de la actividad entregada
## Creación de un entorno virtual en Python 

### 1. Is done: Crear entorno virtual
    Se crea un entorno virtual de Python para la creación de la API de FastAPI
    y su base de datos mediante la postgres
    Se hizo mediante los siguientes comandos.
```bash
    # Windows
    python -m venv .venv
    .venv\Scripts\activate

    # Linux/Mac
    python -m venv .venv
    source .venv/bin/activate
```
### 2. Is done:  Instalar dependencias
    Mediante el archivo de  requirements.txt
    se realizar la inclusión de los requerimientos de la aplicación.
    Esto se realiza con el siguiente comando

```bash
    pip install -r requirements.txt
```
## Dependencias de PostgreSQL por entorno
    # Base compartida: IAjupiter-server/requirements-base.txt
    # Produccion (contenedor API): IAjupiter-server/requirements.txt (usa psycopg2)
    # Desarrollo local (VS Code/Pylance): IAjupiter-server/requirements-dev.txt (usa psycopg2-binary)

## Instalar dependencias en local (evita error de import en Pylance)
    cd /home/IAjupiter/IAjupiter-project
    ./.venv/bin/pip install -r IAjupiter-server/requirements-dev.txt


# Inicar en los contenedores
    cd dockerFiles
    docker-compose up -d nginx

# Recrear los archivos 
## Bajar los contenedores y luego actualizarlos
    docker-compose down
    docker-compose up -d nginx

    docker compose build --no-cache api
    docker compose up -d --force-recreate api
    docker compose logs --tail=100 api

## Para copiar portal web en nginx
    docker cp ../html_nginx/. nginx_proxy:/usr/share/nginx/html

## para confirmar los datos
    docker exec -it nginx_proxy ls -l /usr/share/nginx/html    

## para actualizar la api
    cd /home/IAjupiter/IAjupiter-project/dockerFiles
    docker compose up -d --force-recreate api

## Para borrarlos
    docker-compose stop IADeepSeek nginx
    docker-compose rm -f IADeepSeek nginx

## web de Inicio 
    curl -I http://192.168.1.37:8001    # fastapi
    curl -I http://192.168.1.37/        # nginx / IADeepSeek proxy
    curl -I http://192.168.1.37/IADeepSeek/    # IADeepSeek

## Esquema para Agregar prom
    {
    "data": {
        "nombre": "prompt base",
        "contenido": "Eres un asistente..."
    }
    }

## Esquema para editar prom
    {
    "id": 1,
    "id_column": "id",
    "data": {
        "contenido": "Nuevo contenido del prompt"
        }
    }

## Crear sitio web react

usando TypeScript + React 
crea un sitio web en nginx dentro de la carpeta \web basado en plantillas de React
con los siguientes objetivos:
    
    1) Crear un menú con sub menus adicionales IAjupiter, taskmanager y configuración .
    2) Crea una nueva pagina con la logica y frontend del archivo IAjupiter.html pero en React, para Interactual con Ollama (DeepSeek).   
    3) Une el menu IAjupiter a la nueva pagina de IAjupiter en react para poder llamar esta pagina desde este menú.   
    4) Crea  un pagina con el nombre tasksmanagement que use la API de endpointsTasks para mostrar las tareas disponibles de la tabla tasks, con el formato de cronograma de Gantt y que pueda agregar, editar y borrar tareas.
    5) Usa el backend API para exponer endpoints y consumirlos desde esas páginas y agrega mas endPoints adicionales si se requiere.   

## Crear arbol de TaskManager

Modifica la pagina de tasksmanagement con el siguientes objetivos:
    1) Usa la relación del campos:(id, id_padre) de la tabla 'tasks' relacion que se usa para anidar varias tareas hijas a un registro un padre.
    2) Una tarea se debe poder: crear, editar y borrar. 
    3) En el Frontend se debe poder Crear, editar y borrar tareas.
    4) En el Frontend se debe poder mover las tareas hijas de un padre a otro padre arrastrando la tarea con el mouse.
    5) Las tareas padres deben poder contraer y expandir sus tareas hijas.
    6) Las tareas hijas deben mostrarse indentadas .
    7) Modifica la API si es necesario.
    8) Convierte el Formulario CRUD en un popup.  
    9) No pierdas el modo duirno y nocturno.

el objetivo general es convertir el tasksmanagement en un gantt chart

# Crear tabla CRUD

Agrega la pagina de usuarios cumpliendo con los siguientes objetivos:

1) El Frontend agrega la página de usuario, esta debe mostrar la tabla de 'users' con todas sus colunmas excepto (id, password).
2) En el Frontend de usuarios se debe poder Crear, editar y borrar usuarios.
3) La edicion de los datos de un usuario se debe hacer mediante un Formulario CRUD en un popup.  
4) la pagina de usuario se debe llamar desde el sub menu Usuarios la puedes agregar en la seccion (<section className="page-area">)  de la app.
5) Usa la API de users y modificala si es necesario.
6) No pierdas el modo duirno y nocturno.
7) No modifiques las paginas: TasksManagementPage, IAjupiterPage, ConfigPage 

El objetivo general es lograr modificar los datos de un usuario


## Agregar campo id_user como usuario responsable a cada tarea

Se ha agregado el campo id_user a la tabla 'tasks' que es un campo foraneo
que se debe llemar desde la tabla users(id),  el objetivo generar es agregar un nuevo campo desplegable que se llame 'responsable de la tarea' y que la tarea tenga un usuario reponsable(usuario), para esto se debe cumplir los siguientes objetivos:

objetivos:
    1) Validar que la Api de endpointsTasks incluya este nuevo campo id_user al Crear o editar tareas.
    2) En el Frontend de tasksmanagement dentro del Formulario CRUD, se debe agrega un nuevo campo de tipo lista despleglable con el nombre 'responsable', esta lista se debe llenar con los usuarios de la tabla 'users' usando la API de usuarios.
    3) Al Crear o editar una tarea se debe poder seleccionar en la lista de 'responsables' debe guardar el id_user del usuario seleccionado.
    4) El Formulario CRUD de edicion de tareas que debe seguir siendo un popup.
    5) No pierdas el modo duirno y nocturno..
    6) No modifiques las paginas: IAjupiterPage, ConfigPage y UsersPage.
    5) Usa la API de users y tasks, modificalas si es necesario.
    6) en el frontend en el gantt-page despues del titulo de la tarea muetra el usuario responsable de la tarea.

## reoganizar las columnas

Modifica el código para separar gantt-label-col en dos columnas de la siguiente forma: 
    1) gantt-task-title y gantt-task-owner en una celda con dos lineas, donde el task.titulo en una linea y debajo el gantt-task-owner() 
    2) gantt-task-dates en otra columna.

El objetivo es que se muestre el titulo de la tarea y debajo el responsable, y en la siguiente columna  {toInputDate(task.startline ?? task.created_at)} — {toInputDate(task.deadline)}

