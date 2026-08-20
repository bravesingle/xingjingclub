-- ============================================================
-- 星竞电竞 · 数据库结构（xingjing）
-- 生成时间: 2026/8/17 01:14:41
-- 说明: 开发期后端 TypeORM synchronize=true 会自动建表，
--       本文件用于人工建表 / 结构对照 / 非同步环境初始化
-- 使用方法: mysql -uroot -p xingjing < schema.sql
-- ============================================================
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS `xingjing` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `xingjing`;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `username` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '管理员',
  `role` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `last_login_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_4ba6d0c734d53f8e1b2e24b6c5` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `boosters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `categories` text COLLATE utf8mb4_unicode_ci,
  `categoryNames` text COLLATE utf8mb4_unicode_ci,
  `mode` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hazard',
  `rank` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `rating` float NOT NULL DEFAULT '5',
  `order_count` int NOT NULL DEFAULT '0',
  `online` tinyint NOT NULL DEFAULT '0',
  `accepting` tinyint NOT NULL DEFAULT '0',
  `audit` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `joined_at` bigint DEFAULT NULL,
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `order_no` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `service_id` int NOT NULL,
  `service_title` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `mode_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cover_gradient` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cover_text` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `spec_label` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `spec_value` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` int NOT NULL,
  `amount` int NOT NULL,
  `status` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_pay',
  `remark` text COLLATE utf8mb4_unicode_ci,
  `contact` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `serve_by` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `pay_expire_at` bigint DEFAULT NULL,
  `paid_at` bigint DEFAULT NULL,
  `started_at` bigint DEFAULT NULL,
  `completed_at` bigint DEFAULT NULL,
  `cancelled_at` bigint DEFAULT NULL,
  `refund_reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `refund_from` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `refunded_at` bigint DEFAULT NULL,
  `refund_rejected_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_035026a83bef9740d7ad05df38` (`order_no`),
  KEY `IDX_a922b820eeef29ac1c6800e826` (`user_id`),
  KEY `IDX_775c9f06fc27ae3ff8fb26f2c4` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `service_specs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `service_id` int NOT NULL,
  `value` int NOT NULL,
  `label` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_7e3ae803cebc20974459c066261` (`service_id`),
  CONSTRAINT `FK_7e3ae803cebc20974459c066261` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `title` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `category` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `mode` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mode_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `price_unit` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_name` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `base_price` int NOT NULL,
  `cover` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cover_gradient` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cover_text` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `tags` text COLLATE utf8mb4_unicode_ci,
  `service_rules` text COLLATE utf8mb4_unicode_ci,
  `notice` text COLLATE utf8mb4_unicode_ci,
  `sales` int NOT NULL DEFAULT '0',
  `rating` float NOT NULL DEFAULT '5',
  `is_on_sale` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_c8639b7626fa94ba8265628f21` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `openid` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `game_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `level` int NOT NULL DEFAULT '1',
  `vip` tinyint NOT NULL DEFAULT '0',
  `banned` tinyint NOT NULL DEFAULT '0',
  `order_count` int NOT NULL DEFAULT '0',
  `total_spend` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_9c98f005249412c8333a3b2c59` (`openid`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;