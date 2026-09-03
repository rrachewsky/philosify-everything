-- ============================================================
-- DIAGNÓSTICO — usuários Google sem preferred_language (2026-09-02)
-- ============================================================
-- Contexto: os e-mails de auth (email.js) são localizados por
-- auth.users.raw_user_meta_data->>'preferred_language'. Usuários que entraram
-- por Google OAuth chegam SEM esse campo, então recebem inglês por fallback.
--
-- CRITÉRIO DE BACKFILL: não há fonte confiável do idioma real desses usuários.
-- NÃO preencher um valor agora. O backfill no worker (backfillPreferredLanguage,
-- proxy.js) só grava o campo quando ele está AUSENTE — logo, setar 'en' aqui
-- BLOQUEARIA a auto-correção. Deixando ausente: recebem 'en' por fallback e se
-- auto-corrigem no PRÓXIMO LOGIN (que grava o idioma ativo da UI).
--
-- Esta SQL é apenas DIAGNÓSTICA (SELECT). Rode para ver quantos/quais são.
-- ============================================================

SELECT
  u.id,
  u.email,
  u.raw_app_meta_data->>'provider'              AS provider,
  u.raw_app_meta_data->'providers'              AS providers,
  u.raw_user_meta_data->>'preferred_language'   AS preferred_language,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE (
        u.raw_app_meta_data->>'provider' = 'google'
        OR u.raw_app_meta_data->'providers' ? 'google'
      )
  AND COALESCE(u.raw_user_meta_data->>'preferred_language', '') = ''
ORDER BY u.created_at;

-- Contagem rápida:
-- SELECT count(*) FROM auth.users u
-- WHERE (u.raw_app_meta_data->>'provider' = 'google'
--        OR u.raw_app_meta_data->'providers' ? 'google')
--   AND COALESCE(u.raw_user_meta_data->>'preferred_language','') = '';

-- ------------------------------------------------------------
-- (OPCIONAL — NÃO RECOMENDADO) Se você quiser MESMO materializar 'en' agora,
-- ciente de que isso impede a auto-correção no próximo login:
--
-- UPDATE auth.users u
-- SET raw_user_meta_data =
--       jsonb_set(COALESCE(u.raw_user_meta_data, '{}'::jsonb),
--                 '{preferred_language}', '"en"', true)
-- WHERE (u.raw_app_meta_data->>'provider' = 'google'
--        OR u.raw_app_meta_data->'providers' ? 'google')
--   AND COALESCE(u.raw_user_meta_data->>'preferred_language','') = '';
-- ------------------------------------------------------------
