diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1 +1,55 @@
-# granada
\ No newline at end of file
+# Gestor de Citas Avanzado
+
+Este repositorio contiene una implementación desde cero de un gestor de citas sencillo pero robusto. Incluye:
+
+- Modelos de dominio (`Client` y `Appointment`).
+- Servicio de negocio con validaciones de solapamientos y filtros de consulta.
+- Persistencia ligera en ficheros JSON.
+- Interfaz de línea de comandos para crear, listar y actualizar citas.
+- Suite de pruebas con `pytest` que cubre la lógica central.
+
+## Requisitos
+
+- Python 3.10 o superior.
+- `pip` para instalar dependencias opcionales de desarrollo.
+
+## Instalación y uso
+
+1. Crear y activar un entorno virtual (opcional pero recomendado).
+2. Instalar las dependencias de desarrollo:
+
+   ```bash
+   pip install -r requirements-dev.txt
+   ```
+
+3. Ejecutar la herramienta de línea de comandos:
+
+   ```bash
+   python -m gestor_citas_avanzado.cli add --name "Cliente 1" \
+       --service "Consulta" --start 2024-02-01T10:00 --duration 60
+
+   python -m gestor_citas_avanzado.cli list
+   ```
+
+   Los datos se almacenan por defecto en `appointments.json`, aunque se puede cambiar la ruta con `--database`.
+
+## Ejecutar las pruebas
+
+```bash
+pytest
+```
+
+## Estructura principal
+
+```
+├── README.md
+├── src/
+│   └── gestor_citas_avanzado/
+│       ├── __init__.py
+│       ├── cli.py
+│       ├── models.py
+│       ├── service.py
+│       └── storage.py
+└── tests/
+    └── test_scheduler.py
+```
