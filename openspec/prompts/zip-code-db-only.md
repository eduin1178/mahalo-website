# Buscar zipcode solo en la base de datos

Actualmente el input de busqueda del zip code hace peticiones a la api de USPC, pero dada como está la especificación hoy ya no es necesario. Solo se debe buscar el zip code en la base de datos sin pasar por la busqueda de direcciones en USPC api.

Si un zip code no se encuentra se muestran los planes del proveedor IsFallback
