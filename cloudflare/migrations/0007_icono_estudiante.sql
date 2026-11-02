-- ---------------------------------------------------------------------------
-- Migracion 0007: icono por estudiante (entrada sin leer, para Transicion).
--
-- NO destructiva: agrega una columna nueva y nullable, no borra ni toca
-- datos existentes. Los estudiantes que ya existan quedan con icono = NULL
-- (la asignacion automatica solo corre al CREAR un estudiante nuevo); la
-- entrada maneja ese caso mostrando la inicial del nombre como hasta ahora,
-- y el panel permite asignarle un icono a mano en cualquier momento.
--
--   npx wrangler d1 execute mateguarida-db --remote --command "ALTER TABLE estudiante ADD COLUMN icono TEXT"
-- ---------------------------------------------------------------------------

ALTER TABLE estudiante ADD COLUMN icono TEXT;
