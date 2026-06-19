# Corrección segun revision de sitio web

Se me solicitó hacer ajustes al proyecto de acuerdo con los resultados de la revision que fueron varios, en este cambio vamos a abordar el primero:

1. Please remove the ability to collect credit card data. That information needs to be collected over the phone.

En consecuencia vamos a quitar todo lo relacionado con la recoleccion de datos de pago tanto en el proceso de checkout como en el backoffice y claro, hacer las migraciones, aunque sean destructivas, en la base de datos.