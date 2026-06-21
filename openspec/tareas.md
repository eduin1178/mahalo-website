1. Separar paso de elegir proveedor

Actualmente, cuando el resultado de la búsqueda retonra varios proveedores, estos se agrupan como card/acordion, pero el cliente solicita que se debe separa la seleccion del proveedor en un paso previo, además que resulta conveniente para insertar opcionalmente el disclaimer en la seleccion del plan o al agregar add-ons. 

En resumen, ahora si hay varios proveedores, se debe mostrar previamente la seleccion del proveedor en un paso separado de la seccion del plan. (Ya no sería una card colapsible)

2. Dislaimer. 

En las cards de los planes (donde el usuario elige el plan) se debe hacer lo sigueinte: 
- Mostrar el siguiente texto como tooltip en el botón: 
    Click for details.
    Have the [Provider] disclaimer pop-up on click
- Al hacer clic se debe mostrar el pop-up (modal) con el siguiente texto


By clicking the button or entering your information, you consent for Mahalo Enterprise, and any of its affiliate service providers to use automated technology. Including but not limited to: texts, phone calls, prerecorded messages, email or digital technology to contact you at the number and email provided about Mahalo Enterprise offers which may or may not be directly related to this specific marketing campaign using other affiliate companies.  
This consent is not required to make a purchase. Clicking the button below constitutes your electronic signature.

- Se debe tener en cuenta que este dislaimer se debe poner en en el paso Customize (es decir después de agregar los add-ons) en caso de existir estos, caso en el cual no debe aparecer al seleccionar el plan. 

3. Las card de planes que aparecen directamente en la landig page <PlanHighlights /> se debe poner el texto "Starting at" antes del precio.

4. ProvidersCarousel. Este componente actualmente muestra la imagen que se usa actualmente, se debe mostrar únicamente el logo, es decir logo_url en lugar de landing_image_url, por lo que es conveniente ajustar el diseño de las respectivas cards.

5. En el flujo de checkout aparece actualmente un componente summary que se debe quitar en todos los pasos donde aparezca. Se debe reajustar el diseño para optimizar el uso del espacio resultante de quitar la card de summary.

6. En la sección donde se capturan los datos, ahora ya no será necesario capturar datos de billing, es decir se quita la card: 
"Use a different billing address" y en consecuencia los datos de la base de datos tambien son innecesarios, se debe aplicar las migraciones aunque sean destructivas. 

7. En el último paso del checkout ahora no debe incluir review order

