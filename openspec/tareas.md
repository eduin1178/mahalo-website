## Cambios en los pasos del checkout
Vamos a redefinir que hay en cada paso del checkout
1. En el paso uno (Plan) solo queda la seleccion del plan, tres columnas de cards y navega al sigueinte paso al hacer clic en el botón seleccionar plan.
2. En el paso dos, ahora lo llamaremos Customize, van los add-ons, si aplican, si no hay se salta al paso 3, igualmente va sin la card de summary
3. En el paso tres (antes dos) llamado Details, se mantneien lo mismo pero va sin la card Summary
4. En el paso cuatro (antes tres) llamado Installation, vamos a hacer los siguientes cambios: 
- Los horarios elegibles son solo los siguientes: 8 - 10 am, 10-12 pm y 2 - 4 pm
- La seleccion de los horarios puede quedar dentro de la misma card donde se elige la fecha (fecha a la izquierda y horarios a la derecha)
- No va la card de Summary (la que está a la derecha)
- Se mantiene el Review
- Se cambia el texto del botón Confirm order por Place order

## Correccion de error
En el backoffice tenemos un error. Los sigueintes son los pasos para reproducir el error
- Selecciona planes en el menú de la izquierda
- Haz clic en el botón Open localizado al frente del proveedor
- En la parte superior elige el tab Plans
- Haz clic en el botón Edit de alguno de los planes (se abrirá un modal)
- Modifica el price (standar) y el price (autopay) y haz clic en el botón Save
- Se redirige a una pantalla negra con el texto This page couldn't load y con un botón Reload, la url queda en /admin/provieers/{uui} y no se guarda ningún cambio

Nota: El error encontrón en el entorno de producción, no se han hecho pruebas en enetorno de desarrollo