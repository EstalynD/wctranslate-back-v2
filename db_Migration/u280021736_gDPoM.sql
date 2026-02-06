-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 05-02-2026 a las 15:38:06
-- Versión del servidor: 11.8.3-MariaDB-log
-- Versión de PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `u280021736_gDPoM`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_licenses`
--

CREATE TABLE `wp_training_wc_licenses` (
  `id` mediumint(9) NOT NULL,
  `license_key` varchar(50) NOT NULL,
  `site_url` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `expiry_date` date NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_models`
--

CREATE TABLE `wp_training_wc_models` (
  `id` mediumint(9) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `stage` varchar(50) NOT NULL DEFAULT 'iniciacion',
  `tokens_earned` int(11) NOT NULL DEFAULT 0,
  `tokens_spent` int(11) NOT NULL DEFAULT 0,
  `current_module_id` mediumint(9) DEFAULT NULL,
  `current_theme_id` mediumint(9) DEFAULT NULL,
  `current_task_id` mediumint(9) DEFAULT NULL,
  `last_task_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `streaming_platform` varchar(50) DEFAULT NULL,
  `acceso_superior` tinyint(1) NOT NULL DEFAULT 0,
  `studio_id` mediumint(9) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Volcado de datos para la tabla `wp_training_wc_models`
--

INSERT INTO `wp_training_wc_models` (`id`, `user_id`, `stage`, `tokens_earned`, `tokens_spent`, `current_module_id`, `current_theme_id`, `current_task_id`, `last_task_date`, `created_at`, `updated_at`, `streaming_platform`, `acceso_superior`, `studio_id`) VALUES
(1, 39, 'iniciacion', 84, 0, 0, NULL, NULL, NULL, '2025-05-04 18:44:12', '2025-06-16 14:00:39', 'Stripchat', 1, 0),
(2, 40, 'iniciacion', 162, 0, 1, 1, NULL, NULL, '2025-05-15 10:35:56', '2025-06-16 13:59:42', '', 0, 0),
(3, 41, 'iniciacion', 0, 0, 1, 15, 50, NULL, '2025-05-30 15:10:54', '2025-06-13 13:14:41', '', 0, 0),
(4, 42, 'iniciacion', 0, 0, 1, 15, 50, NULL, '2025-05-30 15:13:13', '2025-06-13 13:15:12', '', 0, 0),
(5, 44, 'iniciacion', 0, 0, 22, 15, 50, NULL, '2025-06-13 13:15:53', '2025-06-13 13:15:53', 'Stripchat', 0, NULL),
(6, 18, 'iniciacion', 0, 0, 22, 15, 50, NULL, '2025-06-17 02:20:30', '2025-07-02 21:45:45', '', 1, 0),
(8, 35, 'iniciacion', 0, 0, 22, 12, 36, NULL, '2025-09-18 18:11:54', '2025-09-30 16:49:03', '', 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_modules`
--

CREATE TABLE `wp_training_wc_modules` (
  `id` mediumint(9) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `duration` int(11) NOT NULL DEFAULT 30,
  `tokens` int(11) NOT NULL DEFAULT 0,
  `order_position` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `platform_specific` tinyint(1) NOT NULL DEFAULT 0,
  `platform_name` varchar(50) DEFAULT NULL,
  `module_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Volcado de datos para la tabla `wp_training_wc_modules`
--

INSERT INTO `wp_training_wc_modules` (`id`, `name`, `description`, `duration`, `tokens`, `order_position`, `status`, `created_at`, `updated_at`, `platform_specific`, `platform_name`, `module_order`) VALUES
(1, 'General', 'Módulo general para todas las plataformas', 5, 250, 10, 'active', '2025-05-05 07:51:54', '2025-06-12 09:51:30', 0, '', 0),
(5, 'Módulo Chaturbate', 'Módulo específico para la plataforma Chaturbate', 12, 253, 20, 'active', '2025-05-05 07:51:54', '2025-06-11 18:00:34', 1, 'Chaturbate', 0),
(6, 'Módulo Stripchat', 'Módulo específico para la plataforma Stripchat', 12, 253, 30, 'active', '2025-05-05 07:51:54', '2025-06-11 18:00:19', 1, 'Stripchat', 0),
(7, 'Módulo Cam4', 'Módulo específico para la plataforma Cam4', 30, 1000, 40, 'active', '2025-05-05 07:51:54', NULL, 1, 'cam4', 0),
(8, 'Módulo BongaCams', 'Módulo específico para la plataforma BongaCams', 30, 1000, 50, 'active', '2025-05-05 07:51:54', NULL, 1, 'bongacams', 0),
(9, 'Módulo MyFreeCams', 'Módulo específico para la plataforma MyFreeCams', 30, 1000, 60, 'active', '2025-05-05 07:51:54', NULL, 1, 'myfreecams', 0),
(10, 'Módulo Camsoda', 'Módulo específico para la plataforma Camsoda', 30, 1000, 70, 'active', '2025-05-05 07:51:54', NULL, 1, 'camsoda', 0),
(11, 'Módulo ImLive', 'Módulo específico para la plataforma ImLive', 30, 1000, 80, 'active', '2025-05-05 07:51:54', NULL, 1, 'imlive', 0),
(12, 'Módulo LiveJasmin', 'Módulo específico para la plataforma LiveJasmin', 30, 1000, 90, 'active', '2025-05-05 07:51:54', NULL, 1, 'livejasmin', 0),
(13, 'Módulo Streamate', 'Módulo específico para la plataforma Streamate', 30, 1000, 100, 'active', '2025-05-05 07:51:54', NULL, 1, 'streamate', 0),
(14, 'Módulo XLoveCam', 'Módulo específico para la plataforma XLoveCam', 30, 1000, 110, 'active', '2025-05-05 07:51:54', NULL, 1, 'xlovecam', 0),
(15, 'Módulo Flirt4Free', 'Módulo específico para la plataforma Flirt4Free', 30, 1000, 120, 'active', '2025-05-05 07:51:54', NULL, 1, 'flirt4free', 0),
(16, 'Módulo iFriends', 'Módulo específico para la plataforma iFriends', 30, 1000, 130, 'active', '2025-05-05 07:51:54', NULL, 1, 'ifriends', 0),
(17, 'Módulo DreamCam', 'Módulo específico para la plataforma DreamCam', 30, 1000, 140, 'active', '2025-05-05 07:51:54', NULL, 1, 'dreamcam', 0),
(18, 'Módulo NudeAudition', 'Módulo específico para la plataforma NudeAudition', 30, 1000, 150, 'active', '2025-05-05 07:51:54', NULL, 1, 'nudeaudition', 0),
(19, 'Módulo Sexier', 'Módulo específico para la plataforma Sexier', 30, 1000, 160, 'active', '2025-05-05 07:51:54', NULL, 1, 'sexier', 0),
(20, 'Módulo PassionSearch', 'Módulo específico para la plataforma PassionSearch', 30, 1000, 170, 'active', '2025-05-05 07:51:54', NULL, 1, 'passionsearch', 0),
(21, 'Psicología Webcam', 'Aprende como conectar correctamente con los usuarios.', 30, 382, 2, 'active', '2025-05-05 08:00:03', '2025-06-16 14:08:37', 0, '', 2),
(22, 'Los 50 fetiches mas rentables y como interpretarlos', 'Aprenderás a clasificar los diferentes tipos de fetiches según su naturaleza psicológica y nivel de demanda en plataformas webcam. Comprenderás las motivaciones subyacentes de cada categoría y cómo esto te permite conectar más profundamente con los usuarios interesados en ellos.', 23, 421, 1, 'active', '2025-05-15 11:04:05', '2025-05-15 11:04:05', 0, '', 0),
(23, 'Diseño de Room que Convierte: Ambientación y Psicología del Color', 'Conocerás los principios básicos de composición visual aplicados específicamente a transmisiones webcam. Aprenderás a organizar tu espacio para maximizar su atractivo visual y funcionalidad, creando profundidad y dimensión, incluso en espacios pequeños.', 30, 0, 1, 'active', '2025-05-15 11:05:02', '2025-05-15 11:05:02', 0, '', 0),
(25, 'Dominio del Lenguaje Corporal y Expresión Facial', 'Comprenderás cómo tu postura, gestos y microexpresiones transmiten mensajes poderosos a tu audiencia. Aprenderás a eliminar señales de inseguridad y a proyectar confianza y autenticidad a través de tu lenguaje corporal.', 30, 0, 1, 'active', '2025-05-19 18:22:50', '2025-05-19 18:22:50', 0, '', 0),
(26, 'Estrategias de Fidelización: De Espectador a Tipper Regular', 'Comprenderás los mecanismos psicológicos que transforman a un visitante casual en un seguidor leal.', 30, 0, 1, 'active', '2025-05-21 06:37:04', '2025-06-16 17:06:41', 0, '', 0),
(27, 'Multilingüismo Estratégico: Conquistando Audiencias Globales', 'Identificarás los mercados internacionales más lucrativos para modelos webcam según datos actualizados.', 30, 0, 1, 'active', '2025-05-21 08:45:16', '2025-05-21 08:45:16', 0, '', 0),
(28, 'Monetización Avanzada: Más Allá del Show en Vivo', 'Aprenderás a estructurar tus tarifas y crear paquetes de servicios que maximicen tus ingresos. Conocerás técnicas de psicología de precios y cómo comunicar el valor de tus servicios para justificar tarifas premium.', 30, 0, 1, 'active', '2025-05-21 15:56:24', '2025-05-21 15:56:24', 0, '', 0),
(29, 'Gestión Emocional y Prevención del Burnout', 'Desarrollarás habilidades para reconocer y gestionar tus emociones durante situaciones desafiantes.', 30, 0, 1, 'active', '2025-05-21 18:59:40', '2025-05-21 18:59:40', 0, '', 0),
(30, 'Dominio Técnico: Equipamiento y Software para Transmisiones Profesionales', 'Aprenderás a configurar profesionalmente las cámaras disponibles en el estudio. Dominarás ajustes como balance de blancos, exposición, profundidad de campo y resolución para lograr una imagen nítida y favorecedora en cualquier condición de iluminación.', 30, 0, 1, 'active', '2025-05-22 10:08:54', '2025-05-22 10:10:55', 0, '', 0),
(31, 'Tendencias y Evolución: El Futuro del Camming', 'Explorarás las últimas tecnologías que están transformando la industria, como realidad virtual, juguetes interactivos y streaming en 4K.', 30, 0, 1, 'active', '2025-05-22 14:52:05', '2025-05-22 14:52:05', 0, '', 0),
(32, 'Masterclass: Negociación y Desarrollo Profesional en la Industria', 'Perfeccionarás tus habilidades de comunicación profesional para expresar necesidades y preocupaciones de manera efectiva.', 30, 0, 1, 'active', '2025-05-22 17:45:43', '2025-05-22 17:45:43', 0, '', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_progress`
--

CREATE TABLE `wp_training_wc_progress` (
  `id` mediumint(9) NOT NULL,
  `model_id` mediumint(9) NOT NULL,
  `task_id` mediumint(9) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `quiz_score` int(11) DEFAULT NULL,
  `tokens_earned` int(11) NOT NULL DEFAULT 0,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Volcado de datos para la tabla `wp_training_wc_progress`
--

INSERT INTO `wp_training_wc_progress` (`id`, `model_id`, `task_id`, `status`, `quiz_score`, `tokens_earned`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 6, 50, 'pending', NULL, 0, NULL, '2025-06-17 02:20:30', NULL),
(3, 8, 36, 'pending', NULL, 0, NULL, '2025-09-18 18:11:54', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_quiz_answers`
--

CREATE TABLE `wp_training_wc_quiz_answers` (
  `id` mediumint(9) NOT NULL,
  `progress_id` mediumint(9) NOT NULL,
  `question_id` mediumint(9) NOT NULL,
  `answer` text NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_quiz_questions`
--

CREATE TABLE `wp_training_wc_quiz_questions` (
  `id` mediumint(9) NOT NULL,
  `task_id` mediumint(9) NOT NULL,
  `question` text NOT NULL,
  `options` longtext NOT NULL,
  `correct_answer` varchar(255) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'multiple',
  `quiz_position` varchar(10) NOT NULL DEFAULT 'pre',
  `order_position` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_settings`
--

CREATE TABLE `wp_training_wc_settings` (
  `id` mediumint(9) NOT NULL,
  `setting_name` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Volcado de datos para la tabla `wp_training_wc_settings`
--

INSERT INTO `wp_training_wc_settings` (`id`, `setting_name`, `setting_value`, `created_at`, `updated_at`) VALUES
(1, 'coins_animation_enabled', '1', '2025-06-12 15:46:51', NULL),
(2, 'coins_animation_duration', '3000', '2025-06-12 15:46:51', NULL),
(3, 'sound_enabled', '1', '2025-06-12 15:46:51', NULL),
(4, 'sound_file', '', '2025-06-12 15:46:51', NULL),
(5, 'give_tokens_for_tasks', '1', '2025-06-12 15:46:51', NULL),
(6, 'streaming_platforms', '{\"tokens\":[\"Chaturbate\",\"Stripchat\",\"Cam4\",\"BongaCams\",\"LiveJasmin\",\"MyFreeCams\",\"Flirt4Free\",\"XLoveCam\",\"Camsoda\",\"ImLive\"],\"private\":[\"LiveJasmin\",\"Streamate\",\"CamSoda\",\"XLoveCam\",\"Flirt4Free\",\"iFriends\",\"DreamCam\",\"NudeAudition\",\"Sexier\",\"PassionSearch\"]}', '2025-06-12 15:46:52', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_studios`
--

CREATE TABLE `wp_training_wc_studios` (
  `id` mediumint(9) NOT NULL,
  `name` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `whatsapp` varchar(100) NOT NULL,
  `models_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Volcado de datos para la tabla `wp_training_wc_studios`
--

INSERT INTO `wp_training_wc_studios` (`id`, `name`, `owner`, `whatsapp`, `models_count`, `created_at`, `updated_at`) VALUES
(1, 'Estudio Modelo Prime', 'Carlos Rodríguez', '+573101234567', 0, '2025-06-12 15:46:51', NULL),
(2, 'Webcam Studio Elite', 'Laura González', '+573109876543', 0, '2025-06-12 15:46:51', NULL),
(3, 'Top Models Agency', 'Miguel Sánchez', '+573105555555', 0, '2025-06-12 15:46:51', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_tasks`
--

CREATE TABLE `wp_training_wc_tasks` (
  `id` mediumint(9) NOT NULL,
  `theme_id` mediumint(9) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `content` longtext NOT NULL,
  `token_reward` int(11) NOT NULL DEFAULT 0,
  `order_position` int(11) DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `has_quiz` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Volcado de datos para la tabla `wp_training_wc_tasks`
--

INSERT INTO `wp_training_wc_tasks` (`id`, `theme_id`, `name`, `description`, `content`, `token_reward`, `order_position`, `status`, `has_quiz`, `created_at`, `updated_at`) VALUES
(2, 3, 'Configuración de shows y actividades', 'Conoce desde precios hasta los shows preferidos de la plataforma', '[html_file]training-wc-html/task-2-configuracion-de-shows-y-actividades.html[/html_file]', 21, 2, 'active', 1, '2025-05-15 09:44:35', '2025-06-11 18:00:19'),
(3, 3, 'Reglas de stripchat', 'Investigar y comprender las normas para evaluar cómo estas reglas impactan en la seguridad de modelos, usuarios y el cumplimiento legal dentro de la industria del entretenimiento para adultos.', '<h3><strong>1. Prohibido menores de 18 años</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: Modelos y usuarios deben ser mayores de 18 años (o 21 en ciertos países).</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Cumplir con leyes internacionales contra la explotación infantil (ej: <strong>18 U.S.C. § 2257</strong> en EE.UU.) y evitar contenido ilegal.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>2. No contenido con drogas o alcohol</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: Prohibido mostrar o promover el consumo de drogas, alcohol o sustancias ilegales en cámara.</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Para evitar glorificar adicciones y cumplir con leyes sanitarias.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>3. Juguetes sexuales permitidos, pero con restricciones</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: Algunos juguetes (ej: consoladores sin base) están permitidos, pero otros (como objetos punzantes o no diseñados para uso sexual) pueden estar prohibidos.</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Prevenir riesgos de salud y asegurar que los accesorios sean seguros para uso en vivo.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>4. Prohibidas las actividades extremas o peligrosas</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: No se permiten prácticas como <em>blood play</em> (juegos con sangre), asfixia o daño físico grave.</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Evitar emergencias médicas y contenido que incite a la autolesión.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>5. No contenido con animales (zoofilia)</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: Está prohibido interactuar con animales en las transmisiones, incluso si no hay contacto sexual.</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Cumplir leyes contra la crueldad animal y evitar contenido ilegal.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>6. Prohibido el contenido no consentido</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: Todas las interacciones en cámara deben ser acordadas previamente por los participantes.</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Garantizar la ética y evitar situaciones de abuso o coerción.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>7. Restricciones en contenido público vs. privado</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: En salas públicas, los modelos no pueden mostrar desnudez total o penetración. Estas actividades solo están permitidas en shows privados.</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Cumplir con políticas de acceso diferenciado (gratis vs. pagado) y regulaciones de contenido explícito.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>8. No compartir información personal</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: Prohibido revelar nombres reales, direcciones, redes sociales personales o números de teléfono.</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Proteger la privacidad y prevenir acoso, doxxing o estafas.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>9. Prohibido el <em>spam</em> o promoción externa</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: No se permite enviar enlaces a otras plataformas (ej: OnlyFans) o pedir pagos fuera de Stripchat.</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Evitar la competencia desleal y proteger el sistema de ganancias de la plataforma.</p>\n</li>\n</ul>\n<hr />\n<h3><strong>10. Reglas de vestimenta en shows gratuitos</strong></h3>\n<ul>\n<li>\n<p><strong>Qué dice</strong>: En transmisiones públicas, los modelos deben cubrir genitales o pezones (dependiendo de las políticas locales).</p>\n</li>\n<li>\n<p><strong>Por qué</strong>: Adaptarse a leyes de obscenidad de ciertos países y mantener un acceso escalonado (gratis vs. premium).</p>\n</li>\n</ul>', 21, 4, 'active', 0, '2025-05-15 10:04:49', '2025-06-11 18:00:19'),
(4, 3, 'tipos de usuarios stripchat', 'En Stripchat, los usuarios se clasifican en diferentes tipos según su rol, nivel de actividad o interacción en la plataforma. Estos roles suelen estar representados con colores o etiquetas específicas para facilitar su identificación en los chats y transmisiones. Aquí te explico los principales tipos:', '[html_file]training-wc-html/task-4-tipos-de-usuarios-stripchat.html[/html_file]', 21, 5, 'active', 0, '2025-05-15 10:38:51', '2025-06-11 18:00:19'),
(7, 1, 'Identificar los perfiles psicológicos de los usuarios', '', '[html_file]training-wc-html/task-7-identificar-los-perfiles-psicologicos-de-los-usuarios.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 12:10:25', '2025-06-16 14:25:36'),
(8, 1, 'Adaptar tu comunicación según el perfil psicológico', '', '[html_file]training-wc-html/task-8-adaptar-tu-comunicacion-segun-el-perfil-psicologico.html[/html_file]', 16, 2, 'active', 1, '2025-05-18 12:28:41', '2025-06-16 14:34:28'),
(9, 1, 'Crear gatillos emocionales para cada tipo de usuario', '', '[html_file]training-wc-html/task-9-crear-gatillos-emocionales-para-cada-tipo-de-usuario.html[/html_file]', 16, 3, 'active', 1, '2025-05-18 12:57:48', '2025-06-16 14:45:05'),
(10, 4, 'Establecer objetivos financieros realistas', '', '[html_file]training-wc-html/task-10-establecer-objetivos-financieros-realistas.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 14:29:45', '2025-06-16 16:36:27'),
(11, 4, 'Diversificar fuentes de ingresos', '', '[html_file]training-wc-html/task-11-diversificar-fuentes-de-ingresos.html[/html_file]', 16, 2, 'active', 1, '2025-05-18 14:34:51', '2025-06-16 17:01:38'),
(12, 4, 'Administrar e invertir tus ganancias', '', '[html_file]training-wc-html/task-12-administrar-e-invertir-tus-ganancias.html[/html_file]', 16, 3, 'active', 1, '2025-05-18 14:52:11', '2025-06-16 17:05:30'),
(13, 5, 'Crear tu marca personal única', '', '[html_file]training-wc-html/task-13-crear-tu-marca-personal-unica.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 14:56:15', '2025-06-17 21:45:12'),
(14, 5, 'Optimizar tu presencia en redes sociales', '', '[html_file]training-wc-html/task-14-optimizar-tu-presencia-en-redes-sociales.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 15:09:08', '2025-06-17 22:01:54'),
(15, 5, 'Implementar técnicas de email marketing', '', '[html_file]training-wc-html/task-15-implementar-tecnicas-de-email-marketing.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 15:14:33', '2025-06-17 22:08:03'),
(16, 6, 'Configurar un espacio de transmisión óptimo', '', '[html_file]training-wc-html/task-16-configurar-un-espacio-de-transmision-optimo.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 15:37:59', '2025-06-17 22:20:03'),
(17, 6, 'Dominar la configuración técnica de transmisión', '', '[html_file]training-wc-html/task-17-dominar-la-configuracion-tecnica-de-transmision.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 15:43:08', '2025-06-17 22:36:49'),
(18, 6, 'Técnicas de composición visual y presentación', '', '[html_file]training-wc-html/task-18-tecnicas-de-composicion-visual-y-presentacion.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 15:56:04', '2025-06-25 16:30:16'),
(19, 7, 'Identificar y adaptarse a diferentes culturas', '', '[html_file]training-wc-html/task-19-identificar-y-adaptarse-a-diferentes-culturas.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:02:05', '2025-06-26 23:06:26'),
(20, 7, 'Superar barreras lingüísticas efectivamente', '', '[html_file]training-wc-html/task-20-superar-barreras-linguisticas-efectivamente.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:07:58', '2025-06-26 23:13:16'),
(21, 7, 'Monetizar tu alcance internacional', '', '[html_file]training-wc-html/task-21-monetizar-tu-alcance-internacional.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:15:46', '2025-06-26 23:21:36'),
(22, 8, 'Desarrollar una rutina de autocuidado físico', '', '[html_file]training-wc-html/task-22-desarrollar-una-rutina-de-autocuidado-fisico.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:21:38', '2025-06-26 23:27:28'),
(23, 8, 'Gestionar el bienestar emocional y mental', '', '[html_file]training-wc-html/task-23-gestionar-el-bienestar-emocional-y-mental.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:26:24', '2025-06-28 20:17:59'),
(24, 8, 'Prevenir y manejar el burnout profesional', '', '[html_file]training-wc-html/task-24-prevenir-y-manejar-el-burnout-profesional.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:35:40', '2025-06-27 16:09:15'),
(25, 9, 'Comprender el marco legal de tu profesión', '', '[html_file]training-wc-html/task-25-comprender-el-marco-legal-de-tu-profesion.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:40:21', '2025-08-28 00:40:07'),
(26, 9, 'Proteger tu identidad digital y personal', '', '[html_file]training-wc-html/task-26-proteger-tu-identidad-digital-y-personal.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:44:10', '2025-08-28 00:40:16'),
(27, 9, 'Gestionar derechos de imagen y propiedad intelectual', '', '[html_file]training-wc-html/task-27-gestionar-derechos-de-imagen-y-propiedad-intelectual.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:48:11', '2025-08-28 00:40:28'),
(28, 10, 'Mantenerse actualizado con las tendencias tecnológicas', '', '[html_file]training-wc-html/task-28-mantenerse-actualizado-con-las-tendencias-tecnologicas.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:51:50', '2025-06-28 20:25:36'),
(29, 10, 'Crear experiencias interactivas innovadoras', '', '[html_file]training-wc-html/task-29-crear-experiencias-interactivas-innovadoras.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:55:40', '2025-06-28 20:33:06'),
(30, 10, 'Anticipar y adaptarse a cambios en el mercado', '', '[html_file]training-wc-html/task-30-anticipar-y-adaptarse-a-cambios-en-el-mercado.html[/html_file]', 16, 1, 'active', 1, '2025-05-18 16:58:46', '2025-06-28 20:45:58'),
(31, 11, 'Crear un diario de observación', '', '[html_file]training-wc-html/task-31-crear-un-diario-de-observacion.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 10:44:23', '2025-06-25 15:59:51'),
(32, 11, 'Desarrollar un mapa mental', '', '[html_file]training-wc-html/task-32-desarrollar-un-mapa-mental.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 10:55:45', '2025-06-25 16:07:18'),
(33, 11, 'Realizar un cuestionario anónimo', '', '[html_file]training-wc-html/task-33-realizar-un-cuestionario-anonimo.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 11:00:56', '2025-06-25 16:14:16'),
(34, 11, 'Analizar perfiles exitosos', '', '[html_file]training-wc-html/task-34-analizar-perfiles-exitosos.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 11:11:26', '2025-06-25 16:22:09'),
(35, 12, 'Crear un glosario personalizado', '', '[html_file]training-wc-html/task-35-crear-un-glosario-personalizado.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 11:21:15', '2025-06-23 20:16:52'),
(36, 12, 'Practicar expresiones faciales', '', '[html_file]training-wc-html/task-36-practicar-expresiones-faciales.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 11:26:52', '2025-06-23 20:22:22'),
(37, 12, 'Desarrollar personajes', '', '[html_file]training-wc-html/task-37-desarrollar-personajes.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 14:27:54', '2025-06-23 20:31:23'),
(38, 12, 'Seleccionar accesorios básicos', '', '[html_file]training-wc-html/task-38-seleccionar-accesorios-basicos.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 14:36:26', '2025-06-23 20:48:36'),
(39, 13, 'Inventariar tu vestuario actual', '', '[html_file]training-wc-html/task-39-inventariar-tu-vestuario-actual.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 14:43:13', '2025-06-22 20:32:31'),
(40, 13, 'Crear outfits multifuncionales', '', '[html_file]training-wc-html/task-40-crear-outfits-multifuncionales.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 14:46:54', '2025-06-22 22:15:42'),
(41, 13, 'Desarrollar una lista de compras estratégica', '', '[html_file]training-wc-html/task-41-desarrollar-una-lista-de-compras-estrategica.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 14:50:37', '2025-06-23 19:47:49'),
(42, 13, 'Practicar transformaciones rápidas', '', '[html_file]training-wc-html/task-42-practicar-transformaciones-rapidas.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 14:56:05', '2025-06-23 19:57:25'),
(43, 14, 'Escribir guiones básicos', '', '[html_file]training-wc-html/task-43-escribir-guiones-basicos.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 15:08:09', '2025-06-22 20:20:54'),
(44, 14, 'Practicar improvisación', '', '[html_file]training-wc-html/task-44-practicar-improvisacion.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 15:12:24', '2025-06-22 19:50:10'),
(45, 14, 'Crear un banco de frases', '', '[html_file]training-wc-html/task-45-crear-un-banco-de-frases.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 15:19:08', '2025-06-22 19:09:16'),
(46, 14, 'Desarrollar transiciones fluidas', '', '[html_file]training-wc-html/task-46-desarrollar-transiciones-fluidas.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 15:27:27', '2025-06-22 17:41:31'),
(47, 15, 'Crear tu lista de sí, no, tal vez', '', '[html_file]training-wc-html/task-47-crear-tu-lista-de-si-no-tal-vez.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 15:35:07', '2025-06-20 23:30:47'),
(48, 15, 'Desarrollar respuestas asertivas', '', '[html_file]training-wc-html/task-48-desarrollar-respuestas-asertivas.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 15:39:06', '2025-06-20 23:35:56'),
(49, 15, 'Crear alternativas para redirigir', '', '[html_file]training-wc-html/task-49-crear-alternativas-para-redirigir.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 15:43:26', '2025-06-20 23:52:46'),
(50, 15, 'Simular negociaciones difíciles', '', '[html_file]training-wc-html/task-50-simular-negociaciones-dificiles.html[/html_file]', 21, 1, 'active', 1, '2025-05-19 15:47:29', '2025-06-22 17:32:27'),
(51, 16, 'Analizar tu espacio actual', '', '[html_file]training-wc-html/task-51-analizar-tu-espacio-actual.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 16:37:36', '2025-06-28 21:17:08'),
(52, 16, 'Crear un moodboard', '', '[html_file]training-wc-html/task-52-crear-un-moodboard.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 16:43:57', '2025-06-28 21:17:16'),
(53, 16, 'Desarrollar un plan de profundidad', '', '[html_file]training-wc-html/task-53-desarrollar-un-plan-de-profundidad.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 16:48:34', '2025-06-28 21:17:27'),
(54, 16, 'Experimentar con composiciones', '', '[html_file]training-wc-html/task-54-experimentar-con-composiciones.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 16:52:24', '2025-06-28 21:17:36'),
(55, 17, 'Realizar un test de colores personal', '', '[html_file]training-wc-html/task-55-realizar-un-test-de-colores-personal.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:05:21', '2025-06-28 21:19:53'),
(56, 17, 'Experimentar con filtros de color', '', '[html_file]training-wc-html/task-56-experimentar-con-filtros-de-color.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:08:49', '2025-06-30 19:59:50'),
(57, 17, 'Crear paletas temáticas', '', '[html_file]training-wc-html/task-57-crear-paletas-tematicas.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:15:03', '2025-06-30 20:05:38'),
(58, 17, 'Implementar acentos de color estratégicos', '', '[html_file]training-wc-html/task-58-implementar-acentos-de-color-estrategicos.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:19:09', '2025-06-30 20:12:00'),
(59, 18, 'Mapear fuentes de luz actuales', '', '[html_file]training-wc-html/task-59-mapear-fuentes-de-luz-actuales.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:27:28', '2025-06-30 20:19:05'),
(60, 18, 'Experimentar con posiciones de luz', '', '[html_file]training-wc-html/task-60-experimentar-con-posiciones-de-luz.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:32:40', '2025-06-30 20:27:02'),
(61, 18, 'Crear difusores caseros', '', '[html_file]training-wc-html/task-61-crear-difusores-caseros.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:38:12', '2025-06-30 22:34:44'),
(62, 18, 'Desarrollar presets de iluminación', '', '[html_file]training-wc-html/task-62-desarrollar-presets-de-iluminacion.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:43:57', '2025-06-30 22:40:17'),
(63, 19, 'Dibujar un plano de tu espacio', '', '[html_file]training-wc-html/task-63-dibujar-un-plano-de-tu-espacio.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:49:58', '2025-06-30 22:46:47'),
(64, 19, 'Definir actividades por zona', '', '[html_file]training-wc-html/task-64-definir-actividades-por-zona.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 17:59:36', '2025-06-30 22:53:13'),
(65, 19, 'Practicar transiciones entre zonas', '', '[html_file]training-wc-html/task-65-practicar-transiciones-entre-zonas.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 18:04:09', '2025-06-30 23:00:40'),
(66, 19, 'Optimizar cada zona para la cámara', '', '[html_file]training-wc-html/task-66-optimizar-cada-zona-para-la-camara.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 18:16:40', '2025-06-30 23:06:56'),
(67, 20, 'Realizar un análisis de postura', '', '[html_file]training-wc-html/task-67-realizar-un-analisis-de-postura.html[/html_file]', 0, 1, 'active', 1, '2025-05-19 18:25:00', '2025-06-30 23:23:17'),
(68, 3, 'Configuración inicial de stripchat', 'Aprende como configurar tu cuenta de stripchat de la mejor manera para ser más visible antes los usuarios.', '[html_file]training-wc-html/task-68-configuracion-inicial-de-stripchat.html[/html_file]', 21, 1, 'active', 1, '2025-05-20 17:32:27', '2025-06-11 21:15:49'),
(69, 20, 'Practicar posiciones de poder', '', '[html_file]training-wc-html/task-69-practicar-posiciones-de-poder.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 20:16:53', '2025-06-30 23:30:21'),
(70, 20, 'Eliminar gestos nerviosos', '', '[html_file]training-wc-html/task-70-eliminar-gestos-nerviosos.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 20:23:30', '2025-07-01 16:05:39'),
(71, 20, 'Desarrollar un repertorio de gestos', '', '[html_file]training-wc-html/task-71-desarrollar-un-repertorio-de-gestos.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 20:27:13', '2025-07-01 16:10:26'),
(72, 21, 'Identificar tus ángulos favorables', '', '[html_file]training-wc-html/task-72-identificar-tus-angulos-favorables.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 20:31:58', '2025-07-01 16:16:50'),
(73, 21, 'Crear una secuencia de movimientos básica', '', '[html_file]training-wc-html/task-73-crear-una-secuencia-de-movimientos-basica.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 20:39:38', '2025-07-01 16:22:11'),
(74, 21, 'Practicar movimientos lentos y controlados', '', '[html_file]training-wc-html/task-74-practicar-movimientos-lentos-y-controlados.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 20:42:58', '2025-07-01 16:28:13'),
(75, 21, 'Desarrollar transiciones elegantes', '', '[html_file]training-wc-html/task-75-desarrollar-transiciones-elegantes.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 20:54:00', '2025-07-01 16:33:24'),
(76, 22, 'Practicar expresiones emocionales', '', '[html_file]training-wc-html/task-76-practicar-expresiones-emocionales.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 21:03:00', '2025-07-01 16:47:42'),
(77, 22, 'Desarrollar técnicas de contacto visual', '', '[html_file]training-wc-html/task-77-desarrollar-tecnicas-de-contacto-visual.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 21:09:32', '2025-07-01 21:12:22'),
(78, 22, 'Crear un banco de micro expresiones', '', '[html_file]training-wc-html/task-78-crear-un-banco-de-micro-expresiones.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 21:14:01', '2025-07-01 21:18:18'),
(79, 22, 'Grabar y analizar tus expresiones', '', '[html_file]training-wc-html/task-79-grabar-y-analizar-tus-expresiones.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 21:17:18', '2025-07-01 21:26:38'),
(80, 23, 'Desarrollar una biblioteca de movimientos', '', '[html_file]training-wc-html/task-80-desarrollar-una-biblioteca-de-movimientos.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 21:54:47', '2025-07-01 21:35:58'),
(81, 23, 'Crear mini-coreografías temáticas', '', '[html_file]training-wc-html/task-81-crear-mini-coreografias-tematicas.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 21:59:25', '2025-07-01 21:43:26'),
(82, 23, 'Practicar con música', '', '[html_file]training-wc-html/task-82-practicar-con-musica.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 22:03:35', '2025-07-01 21:50:49'),
(83, 23, 'Incorporar props en tus movimientos', '', '[html_file]training-wc-html/task-83-incorporar-props-en-tus-movimientos.html[/html_file]', 0, 1, 'active', 1, '2025-05-20 22:09:07', '2025-07-01 21:57:09'),
(84, 24, 'Crear perfiles de usuarios ideales', '', '[html_file]training-wc-html/task-84-crear-perfiles-de-usuarios-ideales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 06:48:51', '2025-07-02 21:06:44'),
(85, 24, 'Implementar técnicas de reciprocidad', '', '[html_file]training-wc-html/task-85-implementar-tecnicas-de-reciprocidad.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 07:14:06', '2025-07-02 21:42:27'),
(86, 24, 'Aplicar principios de escasez', '', '[html_file]training-wc-html/task-86-aplicar-principios-de-escasez.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 07:18:29', '2025-07-02 22:53:12'),
(87, 24, 'Analizar patrones de fidelización', '', '[html_file]training-wc-html/task-87-analizar-patrones-de-fidelizacion.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 07:24:31', '2025-07-02 23:00:13'),
(88, 25, 'Diseñar un programa de niveles', '', '[html_file]training-wc-html/task-88-disenar-un-programa-de-niveles.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 07:35:11', '2025-07-02 23:15:50'),
(89, 25, 'Desarrollar recompensas exclusivas', '', '[html_file]training-wc-html/task-89-desarrollar-recompensas-exclusivas.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 07:39:08', '2025-07-02 23:23:30'),
(90, 25, 'Crear un calendario de reconocimientos', '', '[html_file]training-wc-html/task-90-crear-un-calendario-de-reconocimientos.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 07:47:19', '2025-07-03 16:24:28'),
(91, 25, 'Implementar celebraciones de aniversario', '', '[html_file]training-wc-html/task-91-implementar-celebraciones-de-aniversario.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 07:51:46', '2025-07-03 16:31:49'),
(92, 26, 'Crear un sistema de registro de preferencias', '', '[html_file]training-wc-html/task-92-crear-un-sistema-de-registro-de-preferencias.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 07:57:03', '2025-07-03 16:38:31'),
(93, 26, 'Implementar saludos personalizados', '', '[html_file]training-wc-html/task-93-implementar-saludos-personalizados.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 08:01:42', '2025-07-03 16:48:16'),
(94, 26, 'Desarrollar shows temáticos basados en feedback', '', '[html_file]training-wc-html/task-94-desarrollar-shows-tematicos-basados-en-feedback.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 08:05:43', '2025-07-03 16:56:08'),
(95, 26, 'Crear momentos de conexión individual', '', '[html_file]training-wc-html/task-95-crear-momentos-de-conexion-individual.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 08:13:30', '2025-07-03 21:43:23'),
(96, 27, 'Establecer normas de comunidad', '', '[html_file]training-wc-html/task-96-establecer-normas-de-comunidad.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 08:17:51', '2025-07-03 21:48:43'),
(97, 27, 'Crear rituales de grupo', '', '[html_file]training-wc-html/task-97-crear-rituales-de-grupo.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 08:28:40', '2025-07-04 16:11:26'),
(98, 27, 'Implementar técnicas de moderación positiva', '', '[html_file]training-wc-html/task-98-implementar-tecnicas-de-moderacion-positiva.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 08:34:00', '2025-07-04 16:40:24'),
(99, 27, 'Desarrollar estrategias de integración', '', '[html_file]training-wc-html/task-99-desarrollar-estrategias-de-integracion.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 08:40:31', '2025-07-04 16:50:15'),
(100, 28, 'Analizar tus estadísticas actuales', '', '[html_file]training-wc-html/task-100-analizar-tus-estadisticas-actuales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 08:53:01', '2025-07-04 16:56:55'),
(101, 28, 'Investigar horarios internacionales', '', '[html_file]training-wc-html/task-101-investigar-horarios-internacionales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 09:15:28', '2025-07-04 17:02:36'),
(102, 28, 'Desarrollar un calendario de eventos culturales', '', '[html_file]training-wc-html/task-102-desarrollar-un-calendario-de-eventos-culturales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 09:23:13', '2025-07-04 22:56:38'),
(103, 28, 'Crear perfiles de usuarios por región', '', '[html_file]training-wc-html/task-103-crear-perfiles-de-usuarios-por-region.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 10:02:25', '2025-07-04 23:02:37'),
(104, 29, 'Crear tarjetas de estudio bilingües', '', '[html_file]training-wc-html/task-104-crear-tarjetas-de-estudio-bilingues.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 10:09:50', '2025-07-04 23:09:32'),
(105, 29, 'Practicar pronunciación básica', '', '[html_file]training-wc-html/task-105-practicar-pronunciacion-basica.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 10:16:48', '2025-07-04 23:15:08'),
(106, 29, 'Desarrollar un guion multilingüe', '', '[html_file]training-wc-html/task-106-desarrollar-un-guion-multilingue.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 10:26:13', '2025-07-04 23:26:46'),
(107, 29, 'Implementar práctica diaria', '', '[html_file]training-wc-html/task-107-implementar-practica-diaria.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 10:47:56', '2025-07-04 23:32:04'),
(108, 30, 'Configurar el Webcam Translator', '', '[html_file]training-wc-html/task-108-configurar-el-webcam-translator.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 10:55:31', '2025-07-04 23:39:21'),
(109, 30, 'Crear plantillas de respuesta traducidas', '', '[html_file]training-wc-html/task-109-crear-plantillas-de-respuesta-traducidas.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 11:03:10', '2025-07-05 16:57:58'),
(110, 30, 'Practicar con herramientas de traducción en vivo', '', '[html_file]training-wc-html/task-110-practicar-con-herramientas-de-traduccion-en-vivo.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 11:06:37', '2025-07-05 17:03:39'),
(111, 30, 'Desarrollar un sistema de atajos', '', '[html_file]training-wc-html/task-111-desarrollar-un-sistema-de-atajos.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 11:10:20', '2025-07-05 17:10:10'),
(112, 31, 'Investigar tabúes culturales', '', '[html_file]training-wc-html/task-112-investigar-tabues-culturales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 11:25:00', '2025-07-05 17:16:53'),
(113, 31, 'Crear un calendario de celebraciones internacionales', '', '[html_file]training-wc-html/task-113-crear-un-calendario-de-celebraciones-internacionales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 15:07:50', '2025-07-05 17:23:19'),
(114, 31, 'Adaptar tu estilo de comunicación', '', '[html_file]training-wc-html/task-114-adaptar-tu-estilo-de-comunicacion.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 15:46:52', '2025-07-05 17:30:01'),
(115, 31, 'Desarrollar conocimiento cultural básico', '', '[html_file]training-wc-html/task-115-desarrollar-conocimiento-cultural-basico.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 15:52:10', '2025-07-05 23:08:32'),
(116, 32, 'Analizar tu estructura de precios actual', '', '[html_file]training-wc-html/task-116-analizar-tu-estructura-de-precios-actual.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 15:59:57', '2025-07-05 23:14:12'),
(117, 32, 'Crear paquetes de servicios escalonados', '', '[html_file]training-wc-html/task-117-crear-paquetes-de-servicios-escalonados.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 16:04:32', '2025-07-05 23:19:12'),
(118, 32, 'Implementar técnicas de anclaje de precios', '', '[html_file]training-wc-html/task-118-implementar-tecnicas-de-anclaje-de-precios.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 16:18:35', '2025-07-05 23:31:01'),
(119, 32, 'Desarrollar ofertas de tiempo limitado', '', '[html_file]training-wc-html/task-119-desarrollar-ofertas-de-tiempo-limitado.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 16:45:16', '2025-07-05 23:36:13'),
(120, 33, 'Crear guiones para diferentes tipos de shows', '', '[html_file]training-wc-html/task-120-crear-guiones-para-diferentes-tipos-de-shows.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 16:53:43', '2025-07-06 21:35:23'),
(121, 33, 'Practicar transiciones eficientes', '', '[html_file]training-wc-html/task-121-practicar-transiciones-eficientes.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 16:58:26', '2025-07-06 21:40:06'),
(122, 33, 'Desarrollar técnicas de manejo del tiempo', '', '[html_file]training-wc-html/task-122-desarrollar-tecnicas-de-manejo-del-tiempo.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:03:15', '2025-07-06 21:45:55'),
(123, 33, 'Crear un sistema de seguimiento post-show', '', '[html_file]training-wc-html/task-123-crear-un-sistema-de-seguimiento-post-show.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:09:12', '2025-07-06 21:51:48'),
(124, 34, 'Diseñar 3-5 conceptos de eventos especiales', '', '[html_file]training-wc-html/task-124-disenar-3-5-conceptos-de-eventos-especiales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:15:28', '2025-07-06 21:59:08'),
(125, 34, 'Crear un calendario de eventos trimestral', '', '[html_file]training-wc-html/task-125-crear-un-calendario-de-eventos-trimestral.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:24:15', '2025-07-06 22:08:05'),
(126, 34, 'Desarrollar estrategias de promoción', '', '[html_file]training-wc-html/task-126-desarrollar-estrategias-de-promocion.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:35:08', '2025-07-07 20:20:13'),
(127, 34, 'Preparar listas de materiales y ensayos', '', '[html_file]training-wc-html/task-127-preparar-listas-de-materiales-y-ensayos.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:39:07', '2025-07-07 20:28:31'),
(128, 35, 'Identificar colaboradoras potenciales', '', '[html_file]training-wc-html/task-128-identificar-colaboradoras-potenciales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:44:09', '2025-07-07 20:35:36'),
(129, 35, 'Desarrollar conceptos de shows colaborativos', '', '[html_file]training-wc-html/task-129-desarrollar-conceptos-de-shows-colaborativos.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:50:11', '2025-07-07 20:41:25'),
(130, 35, 'Crear un acuerdo de colaboración claro', '', '[html_file]training-wc-html/task-130-crear-un-acuerdo-de-colaboracion-claro.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:56:11', '2025-07-07 20:46:14'),
(131, 35, 'Planificar estrategias de cross-promotion', '', '[html_file]training-wc-html/task-131-planificar-estrategias-de-cross-promotion.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 17:59:48', '2025-07-07 20:59:22'),
(132, 36, 'Crear un diario de emociones', '', '[html_file]training-wc-html/task-132-crear-un-diario-de-emociones.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 19:04:36', '2025-07-07 21:05:32'),
(133, 36, 'Desarrollar técnicas de regulación emocional', '', '[html_file]training-wc-html/task-133-desarrollar-tecnicas-de-regulacion-emocional.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 19:11:59', '2025-07-08 16:17:20'),
(134, 36, 'Implementar check-ins emocionales', '', '[html_file]training-wc-html/task-134-implementar-check-ins-emocionales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 19:17:35', '2025-07-08 16:23:44'),
(135, 36, 'Crear un banco de recursos motivacionales', '', '[html_file]training-wc-html/task-135-crear-un-banco-de-recursos-motivacionales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 19:23:32', '2025-07-08 20:43:35'),
(136, 37, 'Documentar tus límites personales', '', '[html_file]training-wc-html/task-136-documentar-tus-limites-personales.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 19:52:32', '2025-07-08 20:49:18'),
(137, 37, 'Practicar frases asertivas', '', '[html_file]training-wc-html/task-137-practicar-frases-asertivas.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 19:57:23', '2025-07-08 20:54:36'),
(138, 37, 'Crear un sistema de señales de alerta', '', '[html_file]training-wc-html/task-138-crear-un-sistema-de-senales-de-alerta.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 20:01:51', '2025-07-08 21:04:33'),
(139, 37, 'Desarrollar rutinas de transición', '', '[html_file]training-wc-html/task-139-desarrollar-rutinas-de-transicion.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 20:08:05', '2025-07-08 21:10:37'),
(140, 38, 'Diseñar una rutina de autocuidado diaria', '', '[html_file]training-wc-html/task-140-disenar-una-rutina-de-autocuidado-diaria.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 20:14:57', '2025-07-08 21:17:43'),
(141, 38, 'Implementar prácticas de cuidado físico', '', '[html_file]training-wc-html/task-141-implementar-practicas-de-cuidado-fisico.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 20:18:56', '2025-07-08 21:26:57'),
(142, 38, 'Crear un espacio de descompresión', '', '[html_file]training-wc-html/task-142-crear-un-espacio-de-descompresion.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 20:32:11', '2025-07-09 16:16:38'),
(143, 38, 'Desarrollar un plan de descanso semanal', '', '[html_file]training-wc-html/task-143-desarrollar-un-plan-de-descanso-semanal.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 20:36:00', '2025-07-09 16:21:33'),
(144, 39, 'Aprender técnicas de respiración', '', '[html_file]training-wc-html/task-144-aprender-tecnicas-de-respiracion.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 20:40:02', '2025-07-09 16:26:38'),
(145, 39, 'Implementar meditaciones breves', '', '[html_file]training-wc-html/task-145-implementar-meditaciones-breves.html[/html_file]', 0, 1, 'active', 1, '2025-05-21 20:46:29', '2025-07-09 16:32:32'),
(148, 40, 'Realizar pruebas de configuración', '', '[html_file]training-wc-html/task-148-realizar-pruebas-de-configuracion.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 10:15:24', '2025-07-10 15:10:29'),
(149, 39, 'Crear anclajes de atención plena', '', '[html_file]training-wc-html/task-149-crear-anclajes-de-atencion-plena.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 10:43:39', '2025-07-09 16:37:40'),
(150, 39, 'Practicar escaneos corporales', '', '[html_file]training-wc-html/task-150-practicar-escaneos-corporales.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 10:50:19', '2025-07-09 16:43:20'),
(151, 41, 'Identificar tu red de apoyo actual', '', '[html_file]training-wc-html/task-151-identificar-tu-red-de-apoyo-actual.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 10:56:06', '2025-07-09 21:56:57'),
(152, 41, 'Establecer conexiones con otras modelos', '', '[html_file]training-wc-html/task-152-establecer-conexiones-con-otras-modelos.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 11:02:46', '2025-07-09 22:02:09'),
(153, 41, 'Crear un grupo de apoyo pequeño', '', '[html_file]training-wc-html/task-153-crear-un-grupo-de-apoyo-pequeno.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 11:06:33', '2025-07-09 22:07:54'),
(154, 41, 'Investigar recursos profesionales', '', '[html_file]training-wc-html/task-154-investigar-recursos-profesionales.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 11:13:05', '2025-07-09 22:14:45'),
(155, 40, 'Crear presets personalizados', '', '[html_file]training-wc-html/task-155-crear-presets-personalizados.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 11:45:02', '2025-07-10 15:16:00'),
(156, 40, 'Practicar ajustes en vivo', '', '[html_file]training-wc-html/task-156-practicar-ajustes-en-vivo.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 11:50:23', '2025-07-10 15:21:00'),
(157, 40, 'Desarrollar soluciones para problemas comunes', '', '[html_file]training-wc-html/task-157-desarrollar-soluciones-para-problemas-comunes.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 11:55:12', '2025-07-10 16:30:50'),
(158, 42, 'Realizar una auditoría acústica', '', '[html_file]training-wc-html/task-158-realizar-una-auditoria-acustica.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 12:00:43', '2025-07-10 20:44:24'),
(159, 42, 'Experimentar con posicionamiento de micrófono', '', '[html_file]training-wc-html/task-159-experimentar-con-posicionamiento-de-microfono.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 12:10:24', '2025-07-10 20:51:28'),
(160, 42, 'Crear soluciones de aislamiento acústico caseras', '', '[html_file]training-wc-html/task-160-crear-soluciones-de-aislamiento-acustico-caseras.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 12:27:40', '2025-07-10 20:59:15'),
(161, 42, 'Desarrollar una rutina de verificación de audio', '', '[html_file]training-wc-html/task-161-desarrollar-una-rutina-de-verificacion-de-audio.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 12:45:39', '2025-07-10 21:06:46'),
(162, 43, 'Dominar funciones básicas de OBS', '', '[html_file]training-wc-html/task-162-dominar-funciones-basicas-de-obs.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 12:53:43', '2025-07-11 16:30:39'),
(163, 43, 'Crear overlays personalizados', '', '[html_file]training-wc-html/task-163-crear-overlays-personalizados.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 13:04:25', '2025-07-11 16:36:04'),
(164, 43, 'Configurar alertas y notificaciones', '', '[html_file]training-wc-html/task-164-configurar-alertas-y-notificaciones.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 13:08:18', '2025-07-11 16:41:36'),
(165, 43, 'Desarrollar escenas temáticas', '', '[html_file]training-wc-html/task-165-desarrollar-escenas-tematicas.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 13:14:45', '2025-07-11 21:01:35'),
(166, 44, 'Crear un manual de soluciones rápidas', '', '[html_file]training-wc-html/task-166-crear-un-manual-de-soluciones-rapidas.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 13:50:16', '2025-07-11 21:06:07'),
(167, 44, 'Practicar recuperación de fallos', '', '[html_file]training-wc-html/task-167-practicar-recuperacion-de-fallos.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 14:07:26', '2025-07-11 21:17:09'),
(168, 44, 'Implementar verificaciones preventivas', '', '[html_file]training-wc-html/task-168-implementar-verificaciones-preventivas.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 14:13:03', '2025-07-11 21:25:05'),
(169, 44, 'Crear un kit de emergencia técnica', '', '[html_file]training-wc-html/task-169-crear-un-kit-de-emergencia-tecnica.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 14:20:34', '2025-07-11 21:37:06'),
(170, 45, 'Investigar tecnologías emergentes', '', '[html_file]training-wc-html/task-170-investigar-tecnologias-emergentes.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 15:07:54', '2025-07-14 19:53:29'),
(171, 45, 'Evaluar juguetes interactivos', '', '[html_file]training-wc-html/task-171-evaluar-juguetes-interactivos.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 15:27:34', '2025-07-14 20:04:16'),
(172, 45, 'Experimentar con nuevas funcionalidades', '', '[html_file]training-wc-html/task-172-experimentar-con-nuevas-funcionalidades.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 15:42:22', '2025-07-14 20:09:46'),
(173, 45, 'Crear un plan de actualización tecnológica', '', '[html_file]training-wc-html/task-173-crear-un-plan-de-actualizacion-tecnologica.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 15:56:21', '2025-07-14 20:16:22'),
(174, 46, 'Monitorear tendencias en redes sociales', '', '[html_file]training-wc-html/task-174-monitorear-tendencias-en-redes-sociales.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 16:02:46', '2025-07-14 20:22:45'),
(175, 46, 'Analizar estadísticas de tus transmisiones', '', '[html_file]training-wc-html/task-175-analizar-estadisticas-de-tus-transmisiones.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 16:17:14', '2025-07-16 15:45:18'),
(176, 46, 'Crear encuestas para usuarios', '', '[html_file]training-wc-html/task-176-crear-encuestas-para-usuarios.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 16:29:57', '2025-07-16 15:51:54'),
(177, 46, 'Implementar pruebas A/B', '', '[html_file]training-wc-html/task-177-implementar-pruebas-a-b.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 16:38:59', '2025-07-16 16:18:01'),
(178, 47, 'Revisar regularmente términos de servicio', '', '[html_file]training-wc-html/task-178-revisar-regularmente-terminos-de-servicio.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 16:45:18', '2025-07-16 16:24:11'),
(179, 47, 'Crear planes de contingencia', '', '[html_file]training-wc-html/task-179-crear-planes-de-contingencia.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 16:51:31', '2025-07-16 16:32:04'),
(180, 47, 'Diversificar tu presencia', '', '[html_file]training-wc-html/task-180-diversificar-tu-presencia.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 17:00:40', '2025-07-16 20:10:00'),
(181, 47, 'Participar en comunidades profesionales', '', '[html_file]training-wc-html/task-181-participar-en-comunidades-profesionales.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 17:05:49', '2025-07-16 20:15:31'),
(182, 48, 'Crear un plan de carrera a 5 años', '', '[html_file]training-wc-html/task-182-crear-un-plan-de-carrera-a-5-anos.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 17:12:40', '2025-07-16 20:40:09'),
(183, 48, 'Identificar habilidades transferibles', '', '[html_file]training-wc-html/task-183-identificar-habilidades-transferibles.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 17:18:42', '2025-07-16 20:46:00'),
(184, 48, 'Explorar especializaciones', '', '[html_file]training-wc-html/task-184-explorar-especializaciones.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 17:23:22', '2025-07-16 20:51:31'),
(185, 48, 'Desarrollar un portafolio de habilidades', '', '[html_file]training-wc-html/task-185-desarrollar-un-portafolio-de-habilidades.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 17:38:39', '2025-07-18 16:21:00'),
(186, 49, 'Practicar conversaciones difíciles', '', '[html_file]training-wc-html/task-186-practicar-conversaciones-dificiles.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 17:54:03', '2025-07-18 16:26:02'),
(187, 49, 'Desarrollar plantillas de comunicación', '', '[html_file]training-wc-html/task-187-desarrollar-plantillas-de-comunicacion.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 18:46:34', '2025-07-18 16:33:29'),
(188, 49, 'Implementar técnicas de escucha activa', '', '[html_file]training-wc-html/task-188-implementar-tecnicas-de-escucha-activa.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 18:56:22', '2025-07-18 16:39:04'),
(189, 49, 'Crear un registro de comunicaciones', '', '[html_file]training-wc-html/task-189-crear-un-registro-de-comunicaciones.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 18:59:59', '2025-07-18 16:52:15'),
(190, 50, 'Crear una matriz de decisión personalizada', '', '[html_file]training-wc-html/task-190-crear-una-matriz-de-decision-personalizada.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 19:05:55', '2025-07-18 16:57:38'),
(191, 50, 'Implementar periodos de reflexión', '', '[html_file]training-wc-html/task-191-implementar-periodos-de-reflexion.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 19:09:16', '2025-07-18 21:44:07'),
(192, 50, 'Desarrollar una red de mentores', '', '[html_file]training-wc-html/task-192-desarrollar-una-red-de-mentores.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 19:12:49', '2025-07-18 21:54:00'),
(193, 50, 'Crear un diario de lecciones aprendidas', '', '[html_file]training-wc-html/task-193-crear-un-diario-de-lecciones-aprendidas.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 19:16:57', '2025-07-18 22:00:19'),
(194, 51, 'Realizar un análisis FODA personal', '', '[html_file]training-wc-html/task-194-realizar-un-analisis-foda-personal.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 19:21:02', '2025-07-18 22:08:12'),
(195, 51, 'Desarrollar una declaración de valor único', '', '[html_file]training-wc-html/task-195-desarrollar-una-declaracion-de-valor-unico.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:13:48', '2025-07-18 22:15:44'),
(196, 51, 'Crear un plan de visibilidad interna', '', '[html_file]training-wc-html/task-196-crear-un-plan-de-visibilidad-interna.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:17:49', '2025-07-21 17:21:49'),
(197, 51, 'Implementar coherencia de marca', '', '[html_file]training-wc-html/task-197-implementar-coherencia-de-marca.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:21:57', '2025-07-21 17:27:01'),
(198, 52, 'Crear mapa de hitos profesionales', '', '[html_file]training-wc-html/task-198-crear-mapa-de-hitos-profesionales.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:26:54', '2025-07-21 17:35:21'),
(199, 52, 'Desarrollar un sistema de seguimiento de progreso', '', '[html_file]training-wc-html/task-199-desarrollar-un-sistema-de-seguimiento-de-progreso.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:30:44', '2025-07-21 17:40:39'),
(200, 52, 'Identificar oportunidades de crecimiento', '', '[html_file]training-wc-html/task-200-identificar-oportunidades-de-crecimiento.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:35:19', '2025-07-21 17:49:11'),
(201, 52, 'Establecer relaciones estratégicas', '', '[html_file]training-wc-html/task-201-establecer-relaciones-estrategicas.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:39:55', '2025-07-21 17:54:27'),
(202, 53, 'Crear un presupuesto profesional', '', '[html_file]training-wc-html/task-202-crear-un-presupuesto-profesional.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:45:34', '2025-07-21 18:29:24'),
(203, 53, 'Implementar un plan de ahorro', '', '[html_file]training-wc-html/task-203-implementar-un-plan-de-ahorro.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:49:39', '2025-07-21 18:38:17'),
(204, 53, 'Desarrollar un fondo de emergencia', '', '[html_file]training-wc-html/task-204-desarrollar-un-fondo-de-emergencia.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 20:56:52', '2025-07-21 22:54:48'),
(205, 53, 'Investigar opciones de inversión', '', '[html_file]training-wc-html/task-205-investigar-opciones-de-inversion.html[/html_file]', 0, 1, 'active', 1, '2025-05-22 21:00:50', '2025-07-21 23:00:57'),
(208, 3, 'Contenedor de chat y configuración de transmisión', 'En esta tarea aprenderas sobre la sesión de configuración de transmisión y conocerás el contenedor de chat y sus funciones.', '[html_file]training-wc-html/task-208-contenedor-de-chat-y-configuracion-de-transmision.html[/html_file]', 21, 7, 'active', 0, '2025-06-01 10:13:51', '2025-06-11 18:00:19');
INSERT INTO `wp_training_wc_tasks` (`id`, `theme_id`, `name`, `description`, `content`, `token_reward`, `order_position`, `status`, `has_quiz`, `created_at`, `updated_at`) VALUES
(209, 3, 'Tipos y categorías de shows', 'Vamos a definir los tipos de shows y la categoría que te ayudara a llegar a un público objetivo', '\n\n\n  \n  \n  <title>Tipos de shows</title>\n  <!-- Bootstrap CSS -->\n  \n  \n    body {\n      background-color: #f8f9fa;\n    }\n    .section-card {\n      border-radius: 0.5rem;\n      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);\n      margin: 2rem auto;\n      max-width: 800px;\n      background-color: #ffffff;\n      padding: 1.5rem;\n    }\n    .section-title {\n      font-size: 1.4rem;\n      font-weight: 600;\n    }\n    .section-desc {\n      font-size: 0.95rem;\n      color: #555;\n      margin-bottom: 1rem;\n    }\n    .annotated-list li {\n      margin-bottom: 0.5rem;\n      line-height: 1.4;\n    }\n    .img-container {\n      cursor: pointer;\n      transition: transform 0.2s, box-shadow 0.2s;\n      border-radius: 0.25rem;\n      overflow: hidden;\n      border: 1px solid #dee2e6;\n      margin-bottom: 1rem;\n    }\n    .img-container:hover {\n      transform: scale(1.02);\n      box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.15);\n    }\n  \n\n\n  <header class=\\\"bg-white py-4 mb-4 shadow-sm text-center\\\">\n    <div class=\\\"container\\\">\n      <h1 class=\\\"mb-0\\\">Tipos de shows</h1>\n      <p class=\\\"text-muted\\\">\n        Como configurar tu cuenta sobre tipos de shows que atraeran usuarios a tu sala.\n      </p>\n    </div>\n  </header>\n\n  <section class=\\\"section-card\\\">\n    <div class=\\\"img-container\\\">\n      <img src=\\\"https://iam.jcstudios.com.co/wp-content/uploads/2025/06/5.png\\\" alt=\\\"Panel Perfil de Modelo\\\" class=\\\"img-fluid\\\" />\n    </div>\n    <p class=\\\"section-desc\\\">\n      Este panel muestra la información que los espectadores ven de ti. Cada campo de ejemplo ayuda a entender qué se puede escribir. Tú debes llenarlo con tus propios datos y estilo.\n    </p>\n    <ul class=\\\"annotated-list\\\">\n      <li>\n        <strong>En shows publicos hago:</strong> Debes elegir los tipos de shows que hacer en show publico \\\\\\\"gratuito\\\\\\\" para que los usuarios deseen ingresar a tu sala o show.\n      </li>\n      <li>\n        <strong>En shows privados tambien hago:</strong> Elige las actividades que realizas en shows publicos pero que tambien lo haces en shows privados o a petición de los usuarios.\n      </li>\n      <li>\n        <strong>Privado exclusivo:</strong> Elige las actividades \\\\\\\"mas exclusivas\\\\\\\" que realizas en shows privados.\n      </li>\n        <strong>Guardar Cambios:</strong> Botón para aplicar todo lo que escribas. Hasta que no pulses aquí, los cambios son solo ejemplos.\n      </li>\n    </ul>\n    <p class=\\\"text-muted fst-italic\\\">\n      <em>\n        Consejo: Usa palabras cortas, emojis moderados y un estilo coherente con tu marca personal. Todo lo que ves en la imagen es de muestra; personalízalo tú misma.\n      </em>\n    </p>\n  </section>\n\n  <!-- Bootstrap JS -->\n  \n\n\n\n\n\n\n\n  \n  \n  <title>Detalles de la Transmisión</title>\n  <!-- Bootstrap CSS -->\n  \n  \n    body {\n      background-color: #f8f9fa;\n    }\n    .section-card {\n      border-radius: 0.5rem;\n      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);\n      margin: 2rem auto;\n      max-width: 800px;\n      background-color: #ffffff;\n      padding: 1.5rem;\n    }\n    .section-title {\n      font-size: 1.4rem;\n      font-weight: 600;\n      margin-bottom: 1rem;\n    }\n    .section-desc {\n      font-size: 0.95rem;\n      color: #555;\n      margin-bottom: 1rem;\n    }\n    .annotated-list li {\n      margin-bottom: 0.5rem;\n      line-height: 1.4;\n    }\n    .img-container {\n      cursor: pointer;\n      transition: transform 0.2s, box-shadow 0.2s;\n      border-radius: 0.25rem;\n      overflow: hidden;\n      border: 1px solid #dee2e6;\n      margin-bottom: 1rem;\n    }\n    .img-container:hover {\n      transform: scale(1.02);\n      box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.15);\n    }\n  \n\n\n  <header class=\\\"bg-white py-4 mb-4 shadow-sm text-center\\\">\n    <div class=\\\"container\\\">\n      <h1 class=\\\"mb-0\\\">Detalles de la transmisión</h1>\n      <p class=\\\"text-muted\\\">\n        Si tienes una categoría definida, este es el lugar para seleccionarlo y llegar a tu público objetivo.\n      </p>\n    </div>\n  </header>\n\n  <section class=\\\"section-card\\\">\n    <div class=\\\"img-container\\\">\n      <img src=\\\"https://iam.jcstudios.com.co/wp-content/uploads/2025/06/17.png\\\" alt=\\\"Panel Configuración Avanzada de Transmisión\\\" class=\\\"img-fluid\\\" />\n    </div>\n    <p class=\\\"section-desc\\\">\n      Definir una categoría clara y coherente como modelo webcam es fundamental para que los usuarios te encuentren más fácilmente y sepan desde el primer vistazo qué tipo de contenido ofreces. A continuación, tienes una guía paso a paso para elegir y ubicar correctamente tu categoría, junto con las razones de por qué es tan importante: .\n    </p>\n    <ul class=\\\"annotated-list\\\">\n      <li>\n        <strong>ASMR:</strong> Contenido que se enfoca en producir sonidos suaves (susurros, toques, movimientos) para generar sensaciones de hormigueo o relajación en los espectadores..\n      </li>\n      <li>\n        <strong>BDSM:</strong> Incluye dinámicas de dominación y sumisión, juegos de roles con elementos como esposas, látigos, ataduras o control de poder entre pareja dominante y sumisa.\n      </li>\n      <li>\n        <strong>Embarazada:</strong> Muestra a una modelo que está en estado de gestación. La atención se centra en el cuerpo embarazado y la sensualidad propia de esta etapa.\n      </li>\n      <li>\n        <strong>Interracial:</strong> Escenas o shows donde la pareja (o la modelo con otros participantes) son de razas distintas, resaltando la combinación étnica o cultural.\n      </li>\n      <li>\n        <strong>Máquina Sexual:</strong> Uso de aparatos motorizados (máquinas sexuales o “sex machines”) que mueven un accesorio (por ejemplo, un consolador) para estimular a la modelo.\n      </li>\n      <li>\n        <strong>Piercing:</strong> Enfocado en modelos que tienen perforaciones corporales (piercings) visibles, ya sea en zonas íntimas o en otras partes; a muchos usuarios les atrae ver y jugar con esos accesorios..\n      </li>\n      <li>\n        <strong>Tatuajes:</strong> Modelos que lucen tatuajes en distintas partes del cuerpo, donde el arte y diseño de la tinta forman parte del atractivo visual del show.\n      </li>\n      <li>\n        <strong>Guardar Cambios:</strong> Botón para aplicar estos ajustes de ejemplo. Sin embargo, los valores reales los fijará el equipo de soporte en OBS; tú solo haces clic para confirmar que viste cómo se ve en pantalla.\n      </li>\n    </ul>\n    <p class=\\\"text-muted fst-italic\\\">\n      <em>\n        Consejo: Si aún no tienes un estilo o categoría definido, deja este espacio en blanco hasta tenerlo definido.\n      </em>\n    </p>\n  </section>\n\n  <!-- Bootstrap JS -->\n  \n\n', 21, 5, 'active', 0, '2025-06-01 11:59:01', '2025-06-11 18:00:19'),
(219, 3, 'Shows, precios y categorías', 'Configuremos el tipo de shows que haces, los precios de los shows y definamos tu categoría como modelo', '[html_file]training-wc-html/task-219-shows-precios-y-categorias.html[/html_file]', 21, 3, 'active', 0, '2025-06-07 11:22:42', '2025-06-11 18:00:19'),
(220, 3, 'Promocionarse en stripchat', 'Autopublicación de x o twitter para promocionarse', '[html_file]training-wc-html/task-1749570627-promocionarse-en-stripchat.html[/html_file]', 21, 9, 'active', 0, '2025-06-10 10:50:27', '2025-06-11 18:00:19'),
(221, 3, 'Maneja el chat con confianza', 'Conoce el contenedor de chat y como conectar de manera exitosa con tus usuarios o visitantes', '[html_file]training-wc-html/task-221-maneja-el-chat-con-confianza.html[/html_file]', 21, 9, 'active', 0, '2025-06-10 11:07:56', '2025-06-11 18:00:19'),
(222, 3, 'Seguridad en tu sala stripchat', 'Ten en cuenta estos pasos vitales para evitar sufrir estafas en tu sala y perder tokens o la cuenta', '[html_file]training-wc-html/task-222-seguridad-en-tu-sala-stripchat.html[/html_file]', 21, 10, 'active', 0, '2025-06-10 16:23:00', '2025-06-11 18:00:19'),
(223, 3, 'Contenido multimedia', 'Gana dinero y mantén el interés de los usuarios en tu cuenta mientras no estás en línea.', '[html_file]training-wc-html/task-223-contenido-multimedia.html[/html_file]', 21, 11, 'active', 0, '2025-06-10 16:45:36', '2025-06-11 18:00:19'),
(224, 3, 'Interactividad de la sala', 'Cuando usas las herramientas interactivas que ofrece la página no solo sales de la monotonía sino que generas más dinero', '[html_file]training-wc-html/task-1749594235-interactividad-de-la-sala.html[/html_file]', 21, 12, 'active', 0, '2025-06-10 17:23:55', '2025-06-11 18:00:19'),
(225, 54, 'Paneles de transmisión navegador y OBS', 'Conoce los paneles de transmisión a través de navegador y OBS', '[html_file]training-wc-html/task-1749599419-paneles-de-transmision-navegador-y-obs.html[/html_file]', 42, 1, 'active', 0, '2025-06-10 18:50:19', '2025-06-11 18:00:34'),
(226, 54, 'Tokens ganados y el histórico de tokens', 'Vamos a conocer donde verás una parte de los tokens ganados y el histórico de tokens', '[html_file]training-wc-html/task-1749602764-tokens-ganados-y-el-historico-de-tokens.html[/html_file]', 42, 1, 'active', 0, '2025-06-10 19:46:04', '2025-06-11 18:00:34'),
(227, 54, 'Apps y bots que hacen diferencia', 'La decisión de usar apps y bots es la diferencia entre un día normal y uno muy rentable.', '[html_file]training-wc-html/task-227-apps-y-bots-que-hacen-diferencia.html[/html_file]', 42, 3, 'active', 0, '2025-06-11 09:06:15', '2025-06-11 18:00:34'),
(228, 54, 'Zona de chat en chaturbate', 'El contenedor de chat es el lugar donde generas la mayor conexión con tus visitantes', '[html_file]training-wc-html/task-1749680139-zona-de-chat-en-chaturbate.html[/html_file]', 42, 4, 'active', 0, '2025-06-11 17:15:39', '2025-06-11 18:00:34'),
(229, 54, 'Crea y configura una biografía exitosa', 'Vamos a guiarte para crear una estructura en tu biografía para que sea exitosa y tenga una conexión efectiva con tus visitantes', '[html_file]training-wc-html/task-1749680843-crea-y-configura-una-biografia-exitosa.html[/html_file]', 42, 5, 'active', 0, '2025-06-11 17:27:23', '2025-06-11 18:00:34'),
(230, 54, 'Seguridad, privacidad y ajustes de tu cuenta', 'Vamos a guiarte paso a paso  de manera óptima de la seguridad, privacidad y ajustes de tu cuenta', '[html_file]training-wc-html/task-1749682791-seguridad-privacidad-y-ajustes-de-tu-cuenta.html[/html_file]', 42, 6, 'active', 0, '2025-06-11 17:59:51', '2025-06-11 18:00:34'),
(231, 55, 'Conoce las diferencias entre chaturbate y stripchat', 'Conoce las diferencias entre chaturbate y stripchat y como realizar una transmisión dual exitosa', '[html_file]training-wc-html/task-231-conoce-las-diferencias-entre-chaturbate-y-stripchat.html[/html_file]', 16, 1, 'active', 0, '2025-06-11 21:40:19', '2025-06-12 22:00:22'),
(232, 56, 'Historia y Evolución del Modelaje Webcam', 'Descubre cómo nació esta industria y por qué es una oportunidad real de ingresos', '[html_file]training-wc-html/task-232-historia-y-evolucion-del-modelaje-webcam.html[/html_file]', 16, 1, 'active', 0, '2025-06-12 09:59:16', '2025-06-12 22:00:22'),
(233, 56, 'Tipos de Plataformas y Sus Diferencias', 'Aprende las diferencias entre páginas de tokens, privados y venta de contenido', '[html_file]training-wc-html/task-233-tipos-de-plataformas-y-sus-diferencias.html[/html_file]', 16, 2, 'active', 0, '2025-06-12 10:01:37', '2025-06-12 22:00:22'),
(234, 56, 'Cualidades Esenciales para el Éxito', 'Identifica si tienes lo necesario y cómo desarrollar las habilidades clave', '[html_file]training-wc-html/task-234-cualidades-esenciales-para-el-exito.html[/html_file]', 16, 3, 'active', 0, '2025-06-12 12:24:50', '2025-06-12 22:00:22'),
(235, 57, 'Protección de identidad real', 'Crea una identidad artística segura que proteja tu vida personal', '[html_file]training-wc-html/task-1749749634-proteccion-de-identidad-real.html[/html_file]', 16, 1, 'active', 0, '2025-06-12 12:33:54', '2025-06-12 22:00:22'),
(236, 57, '¿Por qué Bloquear Países es Contraproducente?', 'Descubre por qué esto reduce tus ingresos y no te protege realmente', '[html_file]training-wc-html/task-1749750362-por-que-bloquear-paises-es-contraproducente.html[/html_file]', 16, 2, 'active', 0, '2025-06-12 12:46:02', '2025-06-12 22:00:22'),
(237, 57, 'Verificación Práctica de VPN y Geo-blocking', 'Prueba tú misma cómo cualquiera puede evitar bloqueos geográficos', '[html_file]training-wc-html/task-237-verificacion-practica-de-vpn-y-geo-blocking.html[/html_file]', 16, 3, 'active', 0, '2025-06-12 13:10:37', '2025-06-12 22:00:22'),
(238, 58, 'Páginas de Tokens vs Privados vs Contenido', 'Compara rentabilidad y elige la mejor estrategia para tu perfil', '[html_file]training-wc-html/task-238-paginas-de-tokens-vs-privados-vs-contenido.html[/html_file]', 16, 1, 'active', 0, '2025-06-12 13:14:32', '2025-06-12 22:00:22'),
(239, 58, 'Las 12 Formas de Generar Ingresos', 'Diversifica tus fuentes de dinero más allá de shows en vivo', '[html_file]training-wc-html/task-1749779317-las-12-formas-de-generar-ingresos.html[/html_file]', 16, 2, 'active', 0, '2025-06-12 20:48:37', '2025-06-12 22:00:22'),
(240, 58, 'Psicología de las Propinas y Motivación', 'Técnicas probadas para que users quieran darte dinero voluntariamente', '[html_file]training-wc-html/task-1749779922-psicologia-de-las-propinas-y-motivacion.html[/html_file]', 16, 3, 'active', 0, '2025-06-12 20:58:42', '2025-06-12 22:00:22'),
(241, 59, 'Construcción de Marca Personal', 'Crea una personalidad única que te diferencie de miles de modelos', '[html_file]training-wc-html/task-1749780623-construccion-de-marca-personal.html[/html_file]', 16, 1, 'active', 0, '2025-06-12 21:10:23', '2025-06-12 22:00:22'),
(242, 59, 'Estrategias de Visibilidad y Ranking', 'Técnicas para aparecer en primeras páginas y atraer más viewers', '[html_file]training-wc-html/task-1749781035-estrategias-de-visibilidad-y-ranking.html[/html_file]', 16, 2, 'active', 0, '2025-06-12 21:17:15', '2025-06-12 22:00:22'),
(243, 59, 'Redes Sociales y Promoción', 'Usa Instagram, Twitter y TikTok para multiplicar tus ingresos', '[html_file]training-wc-html/task-1749781649-redes-sociales-y-promocion.html[/html_file]', 16, 3, 'active', 0, '2025-06-12 21:27:29', '2025-06-12 22:00:22'),
(244, 60, 'Psicología del Viewer y Conexión Emocional', 'Entiende qué buscan realmente los usuarios y cómo dárselo', '[html_file]training-wc-html/task-244-psicologia-del-viewer-y-conexion-emocional.html[/html_file]', 16, 1, 'active', 0, '2025-06-12 21:39:21', '2025-06-12 22:00:40'),
(245, 60, 'Técnicas de Persuasión y Engagement', 'Métodos psicológicos para aumentar tips y tiempo de permanencia', '[html_file]training-wc-html/task-245-tecnicas-de-persuasion-y-engagement.html[/html_file]', 16, 2, 'active', 0, '2025-06-12 21:42:24', '2025-06-12 22:00:44'),
(246, 60, 'Mantenimiento de Energía y Motivación Personal', 'Cómo mantenerte motivada y evitar el burnout en esta industria', '[html_file]training-wc-html/task-246-mantenimiento-de-energia-y-motivacion-personal.html[/html_file]', 16, 3, 'active', 0, '2025-06-12 22:00:22', '2025-06-12 22:01:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_task_ratings`
--

CREATE TABLE `wp_training_wc_task_ratings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL,
  `understanding_stars` int(11) NOT NULL,
  `usefulness_stars` int(11) NOT NULL,
  `improvement_text` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_themes`
--

CREATE TABLE `wp_training_wc_themes` (
  `id` mediumint(9) NOT NULL,
  `module_id` mediumint(9) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `order_position` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Volcado de datos para la tabla `wp_training_wc_themes`
--

INSERT INTO `wp_training_wc_themes` (`id`, `module_id`, `name`, `description`, `order_position`, `status`, `created_at`, `updated_at`) VALUES
(1, 21, 'Manejo de la psicología webcam', 'El autocontrol y el manejo de la psicología es vital para tener el resultado que esperas', 1, 'active', '2025-05-05 08:01:00', '2025-06-16 14:07:27'),
(2, 4, 'Psicologia usuario', '', 1, 'active', '2025-05-06 21:23:58', NULL),
(3, 6, 'Configuración inicial de stripchat', 'Primero debemos conocer la interfaz de la plataforma y realizar las primeras configuraciones', 1, 'active', '2025-05-15 09:09:06', '2025-06-10 11:10:25'),
(4, 21, 'Gestión Financiera para Modelos Webcam', 'Establecer objetivos financieros realistas', 1, 'active', '2025-05-18 13:04:16', '2025-05-18 14:55:23'),
(5, 21, 'Marketing Digital para Modelos Webcam', 'Crear tu marca personal única', 1, 'active', '2025-05-18 14:55:36', NULL),
(6, 21, 'Producción Audiovisual Profesional', 'Configurar un espacio de transmisión óptimo', 1, 'active', '2025-05-18 15:37:35', '2025-05-18 15:38:16'),
(7, 21, 'Comunicación Intercultural y Multilingüe', 'Identificar y adaptarse a diferentes culturas', 1, 'active', '2025-05-18 15:58:58', NULL),
(8, 21, 'Bienestar Físico y Mental para Modelos', 'Desarrollar una rutina de autocuidado físico', 1, 'active', '2025-05-18 16:20:56', NULL),
(9, 21, 'Aspectos Legales y Seguridad Digital', 'Comprender el marco legal de tu profesión', 1, 'active', '2025-05-18 16:39:19', NULL),
(10, 21, 'Innovación y Tendencias en la Industria Webcam', 'Mantenerse actualizado con las tendencias tecnológicas', 1, 'active', '2025-05-18 16:51:12', NULL),
(11, 22, 'Categorización y psicología de los fetiches', 'Descubre los fetiches más solicitados globalmente y aprende técnicas para satisfacerlos de manera segura y profesional.', 1, 'active', '2025-05-19 10:41:15', NULL),
(12, 22, 'Fetiches de Dominación y Sumisión', 'Explorarás el mundo BDSM desde una perspectiva profesional, aprendiendo técnicas seguras para interpretar roles dominantes o sumisos.', 1, 'active', '2025-05-19 11:17:30', '2025-05-19 11:17:45'),
(13, 22, 'Fetiches de Vestimenta y Transformación', 'Descubrirás cómo implementar fetiches relacionados con ropa específica (lencería, uniformes, cosplay) y transformaciones (sissy, crossdressing).', 1, 'active', '2025-05-19 14:42:16', NULL),
(14, 22, 'Roleplay y Fetiches Situacionales', 'Desarrollarás habilidades de actuación para interpretar escenarios de fantasía como profesor-estudiante, médico-paciente o jefe-empleado', 1, 'active', '2025-05-19 15:07:17', NULL),
(15, 22, 'Límites Personales y Negociación con Usuarios', 'Aprenderás a establecer límites claros sobre los fetiches que estás dispuesta a interpretar y cómo comunicarlos efectivamente.', 1, 'active', '2025-05-19 15:34:10', NULL),
(16, 23, 'Fundamentos de Diseño Visual para Webcam', 'Conocerás los principios básicos de composición visual aplicados específicamente a transmisiones webcam.', 1, 'active', '2025-05-19 16:36:30', NULL),
(17, 23, 'Psicología del Color en Entornos Digitales', 'Descubrirás cómo diferentes colores evocan respuestas emocionales específicas en los espectadores.', 1, 'active', '2025-05-19 17:04:12', NULL),
(18, 23, 'Iluminación Profesional con Presupuesto Limitado', 'Dominarás técnicas de iluminación de tres puntos adaptadas a espacios de transmisión webcam.', 1, 'active', '2025-05-19 17:26:31', NULL),
(19, 23, 'Zonificación Estratégica del Espacio', 'Aprenderás a dividir tu área de transmisión en zonas funcionales que permitan diferentes tipos de interacción y contenido.', 1, 'active', '2025-05-19 17:49:17', NULL),
(20, 25, 'Fundamentos de Comunicación No Verbal', 'Comprenderás cómo tu postura, gestos y microexpresiones transmiten mensajes poderosos a tu audiencia. Aprenderás a eliminar señales de inseguridad y a proyectar confianza y autenticidad a través de tu lenguaje corporal.', 1, 'active', '2025-05-19 18:24:03', NULL),
(21, 25, 'Técnicas de Movimiento Frente a Cámara', 'Dominarás movimientos fluidos y favorecedores específicamente diseñados para transmisiones webcam.', 1, 'active', '2025-05-20 20:30:09', NULL),
(22, 25, 'Expresión Facial y Contacto Visual Efectivo', 'Desarrollarás mayor control sobre tus expresiones faciales para comunicar emociones de forma convincente.', 1, 'active', '2025-05-20 20:57:13', NULL),
(23, 25, 'Coreografías y Rutinas para Shows Temáticos', 'Crearás secuencias de movimiento planificadas para diferentes tipos de shows (sensuales, juguetones, dominantes).', 1, 'active', '2025-05-20 21:51:20', NULL),
(24, 26, 'Psicología de la Lealtad del Usuario', 'Aprenderás a aplicar principios de reciprocidad, escasez y consistencia para crear vínculos emocionales duraderos con tus usuarios.', 1, 'active', '2025-05-21 06:38:35', NULL),
(25, 26, 'Sistemas de Recompensa y Reconocimiento', 'Diseñarás programas de fidelización personalizados que premien diferentes niveles de apoyo. Aprenderás a crear sistemas de beneficios escalables que motiven a los usuarios a aumentar progresivamente su inversión en tu room.', 1, 'active', '2025-05-21 07:28:36', NULL),
(26, 26, 'Personalización de la Experiencia del Usuario', 'Desarrollarás métodos para recordar y utilizar información personal de tus seguidores regulares. Aprenderás a crear experiencias a medida que hagan sentir especial a cada usuario frecuente, aumentando su compromiso emocional y financiero.', 1, 'active', '2025-05-21 07:55:04', NULL),
(27, 26, 'Gestión de Comunidad y Ambiente de Room', 'Aprenderás a cultivar una atmósfera positiva y acogedora en tu sala que fomente la interacción entre usuarios. Conocerás técnicas para manejar conflictos, integrar nuevos miembros y crear un sentido de pertenencia que incentive visitas recurrentes.', 1, 'active', '2025-05-21 08:16:05', NULL),
(28, 27, 'Mapeo de Mercados Internacionales Rentables', 'Aprenderás a reconocer patrones de comportamiento específicos de cada región y a adaptar tu oferta para atraer a estas audiencias.', 1, 'active', '2025-05-21 08:46:35', NULL),
(29, 27, 'Frases Clave y Vocabulario Esencial en Múltiples Idiomas', 'ominarás un conjunto práctico de expresiones en los idiomas más rentables del camming (inglés, alemán, francés, japonés).', 1, 'active', '2025-05-21 10:05:30', NULL),
(30, 27, 'Herramientas Tecnológicas para Comunicación Multilingüe', 'Aprenderás a utilizar eficientemente traductores en tiempo real y otras herramientas tecnológicas durante tus transmisiones.', 1, 'active', '2025-05-21 10:52:10', NULL),
(31, 27, 'Adaptación Cultural y Sensibilidad Internacional', 'Comprenderás las diferencias culturales clave que afectan la interacción con usuarios de distintas regiones.', 1, 'active', '2025-05-21 11:17:51', NULL),
(32, 28, 'Estrategias de Precio y Paquetes de Servicios', 'Conocerás técnicas de psicología de precios y cómo comunicar el valor de tus servicios para justificar tarifas premium.', 1, 'active', '2025-05-21 15:58:29', NULL),
(33, 28, 'Optimización de Shows Privados y Grupales', 'Dominarás el arte de conducir shows privados y grupales que generen máxima satisfacción y propinas adicionales.', 1, 'active', '2025-05-21 16:51:00', '2025-05-21 16:51:14'),
(34, 28, 'Eventos Especiales y Maratones Temáticos', 'Diseñarás y promocionarás eventos especiales que generen expectativa y asistencia masiva.', 1, 'active', '2025-05-21 17:12:39', NULL),
(35, 28, 'Colaboraciones Estratégicas con Otras Modelos', 'Explorarás cómo realizar shows colaborativos que amplíen tu base de seguidores.', 1, 'active', '2025-05-21 17:41:59', '2025-05-21 17:42:20'),
(36, 29, 'Inteligencia Emocional para Modelos Webcam', 'Aprenderás técnicas para mantener una actitud positiva y auténtica incluso en días difíciles, sin comprometer tu bienestar emocional.', 1, 'active', '2025-05-21 19:00:34', NULL),
(37, 29, 'Establecimiento de Límites Profesionales y Personales', 'Crearás un sistema claro para definir y comunicar tus límites. Aprenderás a decir \\\"no\\\" de manera asertiva pero amable, y a redirigir solicitudes inapropiadas sin perder al cliente.', 1, 'active', '2025-05-21 19:49:24', NULL),
(38, 29, 'Técnicas de Autocuidado y Recuperación', 'Implementarás rutinas de autocuidado físico y emocional específicamente diseñadas para modelos webcam.', 1, 'active', '2025-05-21 20:12:59', NULL),
(39, 29, 'Manejo del Estrés y Técnicas de Mindfulness', 'Dominarás técnicas de respiración, meditación y mindfulness adaptadas a las necesidades específicas de tu profesión.', 1, 'active', '2025-05-21 20:38:49', '2025-05-22 09:35:28'),
(40, 30, 'Configuración Óptima de Cámaras y Video', 'Aprenderás a configurar profesionalmente las cámaras disponibles en el estudio.', 1, 'active', '2025-05-22 10:11:17', NULL),
(41, 29, 'Construcción de Sistemas de Apoyo', 'Desarrollarás estrategias para crear redes de apoyo profesional y personal. Aprenderás a identificar relaciones saludables dentro de la industria y a establecer conexiones genuinas con otras modelos que entiendan los desafíos únicos de tu profesión.', 1, 'active', '2025-05-22 10:53:52', NULL),
(42, 30, 'Ingeniería de Audio para Transmisiones Claras', 'Optimizarás la calidad de audio de tus transmisiones eliminando ruidos de fondo y mejorando la claridad de tu voz.', 1, 'active', '2025-05-22 11:57:36', '2025-05-22 11:57:48'),
(43, 30, 'Software de Streaming y Personalización', 'Dominarás el uso de programas como OBS Studio para crear transmisiones profesionales.', 1, 'active', '2025-05-22 12:50:43', NULL),
(44, 30, 'Solución de Problemas Técnicos Comunes', 'Desarrollarás habilidades para diagnosticar y resolver rápidamente problemas técnicos durante las transmisiones.', 1, 'active', '2025-05-22 13:41:03', NULL),
(45, 31, 'Innovaciones Tecnológicas en la Industria Webcam', 'Aprenderás a evaluar qué innovaciones vale la pena adoptar según tu nicho y estilo.', 1, 'active', '2025-05-22 14:57:01', NULL),
(46, 31, 'Análisis de Tendencias de Consumo y Comportamiento', 'Comprenderás cómo están evolucionando las preferencias y hábitos de los usuarios de plataformas webcam.', 1, 'active', '2025-05-22 16:00:20', NULL),
(47, 31, 'Adaptación a Cambios en Plataformas y Políticas', 'Desarrollarás estrategias para mantenerte resiliente ante cambios en las políticas de las plataformas o fluctuaciones del mercado.', 1, 'active', '2025-05-22 16:42:30', NULL),
(48, 31, 'Desarrollo Profesional y Evolución de Carrera', 'Explorarás diferentes trayectorias profesionales dentro de la industria del entretenimiento adulto.', 1, 'active', '2025-05-22 17:10:31', NULL),
(49, 32, 'Comunicación Asertiva con Managers y Estudio', 'Perfeccionarás tus habilidades de comunicación profesional para expresar necesidades y preocupaciones de manera efectiva.', 1, 'active', '2025-05-22 17:51:31', NULL),
(50, 32, 'Evaluación de Oportunidades y Toma de Decisiones', 'Desarrollarás un marco para evaluar objetivamente diferentes oportunidades profesionales dentro del estudio.', 1, 'active', '2025-05-22 19:04:38', NULL),
(51, 32, 'Construcción de Marca Personal dentro del Estudio', 'Aprenderás a desarrollar y comunicar tu valor único como modelo mientras trabajas dentro del marco del estudio.', 1, 'active', '2025-05-22 19:19:52', NULL),
(52, 32, 'Planificación de Carrera a Largo Plazo', 'Crearás un plan de desarrollo profesional con objetivos a corto, mediano y largo plazo.', 1, 'active', '2025-05-22 20:25:09', '2025-05-22 20:43:15'),
(53, 32, 'Finanzas Personales para Modelos Webcam', 'Dominarás conceptos básicos de gestión financiera adaptados a las particularidades de tu profesión.', 1, 'active', '2025-05-22 20:42:52', NULL),
(54, 5, 'Configuración inicial chaturbate', 'Aprende a configurar tu cuenta de chaturbate', 1, 'active', '2025-06-10 18:41:36', NULL),
(55, 1, 'Transmisión dual en chaturbate y stripchat', 'Si transmitiras en chaturbate y stripchat en simultáneo, esta tarea es de gran importancia para ti', 1, 'active', '2025-06-11 21:39:14', '2025-06-12 13:13:03'),
(56, 1, 'Introducción al modelaje webcam', 'Fundamentos esenciales que cualquier modelo debe conocer antes de empezar', 1, 'active', '2025-06-12 09:57:08', NULL),
(57, 1, 'Seguridad y privacidad', 'Protege tu identidad y maximiza tu seguridad sin limitar tus ingresos', 3, 'active', '2025-06-12 12:31:01', NULL),
(58, 1, 'Estrategias de monetización', 'Domina todas las formas de generar ingresos como modelo webcam', 4, 'active', '2025-06-12 13:11:45', NULL),
(59, 1, 'Marketing y posicionamiento', 'Construye una marca personal que genere ingresos constantes', 5, 'active', '2025-06-12 20:59:38', '2025-06-12 20:59:54'),
(60, 1, 'Conexión emocional y performance', 'Domina la psicologia humana para crear fans leales que gasten contigo', 6, 'active', '2025-06-12 21:28:34', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wp_training_wc_tokens`
--

CREATE TABLE `wp_training_wc_tokens` (
  `id` mediumint(9) NOT NULL,
  `model_id` mediumint(9) NOT NULL,
  `amount` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `reference_id` mediumint(9) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `wp_training_wc_licenses`
--
ALTER TABLE `wp_training_wc_licenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `license_key` (`license_key`);

--
-- Indices de la tabla `wp_training_wc_models`
--
ALTER TABLE `wp_training_wc_models`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indices de la tabla `wp_training_wc_modules`
--
ALTER TABLE `wp_training_wc_modules`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `wp_training_wc_progress`
--
ALTER TABLE `wp_training_wc_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `model_task` (`model_id`,`task_id`),
  ADD KEY `model_id` (`model_id`),
  ADD KEY `task_id` (`task_id`);

--
-- Indices de la tabla `wp_training_wc_quiz_answers`
--
ALTER TABLE `wp_training_wc_quiz_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `progress_id` (`progress_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indices de la tabla `wp_training_wc_quiz_questions`
--
ALTER TABLE `wp_training_wc_quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

--
-- Indices de la tabla `wp_training_wc_settings`
--
ALTER TABLE `wp_training_wc_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_name` (`setting_name`);

--
-- Indices de la tabla `wp_training_wc_studios`
--
ALTER TABLE `wp_training_wc_studios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `wp_training_wc_tasks`
--
ALTER TABLE `wp_training_wc_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `theme_id` (`theme_id`);

--
-- Indices de la tabla `wp_training_wc_task_ratings`
--
ALTER TABLE `wp_training_wc_task_ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `model_id` (`model_id`);

--
-- Indices de la tabla `wp_training_wc_themes`
--
ALTER TABLE `wp_training_wc_themes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module_id` (`module_id`);

--
-- Indices de la tabla `wp_training_wc_tokens`
--
ALTER TABLE `wp_training_wc_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `model_id` (`model_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_licenses`
--
ALTER TABLE `wp_training_wc_licenses`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_models`
--
ALTER TABLE `wp_training_wc_models`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_modules`
--
ALTER TABLE `wp_training_wc_modules`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_progress`
--
ALTER TABLE `wp_training_wc_progress`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_quiz_answers`
--
ALTER TABLE `wp_training_wc_quiz_answers`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_quiz_questions`
--
ALTER TABLE `wp_training_wc_quiz_questions`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_settings`
--
ALTER TABLE `wp_training_wc_settings`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_studios`
--
ALTER TABLE `wp_training_wc_studios`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_tasks`
--
ALTER TABLE `wp_training_wc_tasks`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=247;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_task_ratings`
--
ALTER TABLE `wp_training_wc_task_ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_themes`
--
ALTER TABLE `wp_training_wc_themes`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT de la tabla `wp_training_wc_tokens`
--
ALTER TABLE `wp_training_wc_tokens`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
