-- Script de inicialização para desenvolvimento local
-- Configurações otimizadas para ambiente Windows com Docker

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configurações de performance para desenvolvimento local
-- Valores otimizados para containers Docker em ambiente Windows
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '512MB';
ALTER SYSTEM SET maintenance_work_mem = '32MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '8MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configurações específicas para desenvolvimento
-- Logs detalhados para debugging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Configurações de conexão otimizadas para desenvolvimento
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Configurações de timeout para desenvolvimento
ALTER SYSTEM SET statement_timeout = '30min';
ALTER SYSTEM SET lock_timeout = '10min';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '1h';

-- Recarregar configurações
SELECT pg_reload_conf();

-- Criar usuário adicional para desenvolvimento (opcional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dev_user') THEN
        CREATE ROLE dev_user WITH LOGIN PASSWORD 'dev123';
        GRANT CONNECT ON DATABASE cracha_virtual_dev TO dev_user;
        GRANT USAGE ON SCHEMA public TO dev_user;
        GRANT CREATE ON SCHEMA public TO dev_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dev_user;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dev_user;
        
        -- Garantir privilégios em tabelas futuras
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dev_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dev_user;
    END IF;
END
$$;

-- Criar função para verificar saúde do banco
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE(
    metric TEXT,
    value TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        'OK'::TEXT
    UNION ALL
    SELECT 
        'Active Connections'::TEXT,
        count(*)::TEXT,
        CASE WHEN count(*) < 50 THEN 'OK' ELSE 'WARNING' END::TEXT
    FROM pg_stat_activity 
    WHERE state = 'active'
    UNION ALL
    SELECT 
        'Database Version'::TEXT,
        version()::TEXT,
        'OK'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Criar função para estatísticas de performance
CREATE OR REPLACE FUNCTION get_performance_stats()
RETURNS TABLE(
    query_type TEXT,
    total_calls BIGINT,
    avg_time_ms NUMERIC,
    total_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN query LIKE 'SELECT%' THEN 'SELECT'
            WHEN query LIKE 'INSERT%' THEN 'INSERT'
            WHEN query LIKE 'UPDATE%' THEN 'UPDATE'
            WHEN query LIKE 'DELETE%' THEN 'DELETE'
            ELSE 'OTHER'
        END::TEXT as query_type,
        sum(calls)::BIGINT as total_calls,
        round(avg(mean_exec_time), 2)::NUMERIC as avg_time_ms,
        round(sum(total_exec_time), 2)::NUMERIC as total_time_ms
    FROM pg_stat_statements
    WHERE calls > 0
    GROUP BY 1
    ORDER BY total_calls DESC;
END;
$$ LANGUAGE plpgsql;

-- Mensagem de inicialização
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Sistema de Crachás Virtuais - Banco Inicializado';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'User: %', current_user;
    RAISE NOTICE 'Version: %', version();
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Funções disponíveis:';
    RAISE NOTICE '- SELECT * FROM check_database_health();';
    RAISE NOTICE '- SELECT * FROM get_performance_stats();';
    RAISE NOTICE '=================================================';
END
$$;

