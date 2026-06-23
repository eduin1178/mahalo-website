# Mostrar el Proveedor Earling solo si no hay otros proveedores.

Earlink es un proveedor que está en todos los codigos postales y solo se debe mostrar al cliente en caso que su código postal no tenga ningún otro proveedor, incluso si el código postal de un cliente no está en la lista de códigos postales de earlink se debe mostrar al cliente. 

Como no quiero que esta lógica dependa exclusivamente del nombre del proveeodr, entonces vamos a adicionar un atributo que se pueda administrar desde el backoffice para decidir que proveedor se muestra cuando no hay resultados de otros proveedores.
