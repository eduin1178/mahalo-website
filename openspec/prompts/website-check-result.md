# Corrección segun revision de sitio web | Parte 2

Se me solicitó hacer ajustes al proyecto de acuerdo con los resultados de la revision que fueron varios, en este cambio vamos a abordar el segundo:

2. Base searches on zip code only. Collect address for a price return will require the nutrition labels.

Realmente no comprendo muy bien este segundo requerimiento de cambio pero si se que está relacionado con la búsqueda, por lo tanto, quiero que además de explicarme que debemos hacer en este punto, explores sobre lo siguiente.

- Al hacer la búsqueda deben salir los proveedores coincidentes, no los planes directamente, 
- Una vez el usuario elija el proveedor podrá ver los planes. -- Es decir, si solo hay un proveedor que se vea directamente los planes, pero si hay mas de un proveedor, debe mostrar los proveedores cada uno en una card del ancho del contenedor, puede incluir información previa como: Planes desde $... con XX Mbps, etc. pero sin mencionar el plan. Al hacer clic en la respectiva card, debería desplegarse (tipo acordion) los planes del respectivo proveedor, para no añadir un nuevo paso. La siguiente figura muestra un boceto de baja fidelidad de la idea pero debe ser algo bien bominto

-------------------------------------------------------------
| LOGO    Nombre del Proveedor      Planes desde $...       |
|                                   300Mbps ...           < |
-------------------------------------------------------------
* El simbolo '<' lo usé para indicarte que es desplegable.


Ejemplo desplegado

-------------------------------------------------------------
| LOGO    Nombre del Proveedor      Planes desde $...       |
|                                   300Mbps ...           > |
-------------------------------------------------------------
|                                                           |
| Plan 1          |     Plan 2        | Plan 3              |
|                 |                   |                     |
|                 |                   |                     |
|      Seleccionar|      Seleccionmar |         Seleccionar |
-------------------------------------------------------------


