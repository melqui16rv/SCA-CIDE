classDiagram
direction BT
class sca_cide_aprendices {
   int(11) ID
   text Nombre
   text Correo electrónico
   text Teléfono
   text foto
   text expedicion_documento
   text cargar _documento
}


[registros_regional_cundinamarca.csv](file;file:///Users/melquiromero/Documents/GitHub/SCA-CIDE/requerimientos/adjuntos/registros_regional_cundinamarca.csv)

tenemos algo que no se contemplo y es que algunas personas no les tenemos la información inicial, puden ser al rededor de 100 registros, para esto quiero que generes una tabla nueva llamda personal_cundinamarca, la intensión de esta tabla es llenar la información inicial para luego cuando esten todos los registros faltantes los pasamos a la tabla sca_cide_aprendices, por cierto esta mal el nombre pero no lo vamos a cambiar ya que necesitamos salir de eso rapido(se que esa tabla tiene mas personas y no solo aprendices como se da a entender)

los campos que deben diligenciar las personas en esta nueva tabla llamada "datos_regional" son los que dicen "llenar" en el archivo [registros_regional_cundinamarca.csv](file;file:///Users/melquiromero/Documents/GitHub/SCA-CIDE/requerimientos/adjuntos/registros_regional_cundinamarca.csv) 

requerimientos/adjuntos/registros_regional_cundinamarca.csv

por ende debes generar un formulario que quede publico al igual que el primer formulario, la url deberia ser asi carnetizacion.vermqen.com/cundinamarca
o en local ejemplo:
http://localhost:8002/cundinamarca

debes generar el formulario para que esas personas que faltaron puedan suministrar la información base para que despues hagamos migración hacia la otra tabla y puedan llenar el formuario principal el cual les pide la foto y información del documento..

parametros para el formulario, debe validar igual que el primero si ya tiene datos ese numero de documento o no, debe estar bien en IU UX, el campo "rol" debe tener "INSTRUCTOR,ADMINISTRATIVO" y en modalidad contrato debe tener las opciones "PLANTA, CONTRATISTA"
algunos campos van a quedar nullos ya que se piden en el otro formulario