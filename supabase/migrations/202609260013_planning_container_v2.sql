-- Admite PlanningContainer 2.0 manteniendo lectura/escritura del contrato 1.0.

ALTER TABLE public.planning_containers
    DROP CONSTRAINT IF EXISTS planning_container_schema_v1;

ALTER TABLE public.planning_containers
    ADD CONSTRAINT planning_container_supported_schema CHECK (
        jsonb_typeof(container_data) = 'object'
        AND schema_version IN ('1.0', '2.0')
        AND container_data ->> 'schemaVersion' = schema_version
    );

COMMENT ON COLUMN public.planning_containers.schema_version IS
    'Versión del contrato PlanningContainer. Se conservan 1.0 y 2.0 para compatibilidad.';
