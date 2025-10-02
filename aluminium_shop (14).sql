-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 02, 2025 at 04:36 PM
-- Server version: 5.7.24
-- PHP Version: 8.0.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `aluminium_shop`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `password`) VALUES
(1, 'admin', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `category_name`, `image_url`) VALUES
(1, 'หน้าต่างบานเลื่อน2', '1757304916356-59572597.jpg'),
(2, 'หน้าต่างบานเลื่อน4', '1757304924416-731225313.jpg'),
(3, 'ประตูบานเลื่อน2', '1757408292376-230615221.png'),
(4, 'ประตูบานเลื่อน4', '1757408299243-532662444.png'),
(5, 'ประตูสวิง', '1757511778205-871029258.png'),
(6, 'ประตูรางแขวน', '1757511939500-350086640.png'),
(7, 'ประตูมุ้ง', NULL),
(8, 'บานเฟี้ยม', '1757513143502-401520915.jpg'),
(9, 'บานปิดตาย', '1757513022013-801861416.png'),
(10, 'บานกระทุ้ง', '1757513130994-432737618.png'),
(11, 'ชาวเวอร์', NULL),
(12, 'ตู้เฟอร์นิเจอร์', NULL),
(13, 'หน้าต่างมุ้ง', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `contact`
--

CREATE TABLE `contact` (
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tel` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `gmail` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `map` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id` int(1) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact`
--

INSERT INTO `contact` (`name`, `tel`, `gmail`, `map`, `address`, `time`, `logo`, `qr_image`, `bank_account`, `bank_name`, `account_name`, `id`, `status`) VALUES
('Aluglaue Pro', '099-999-9998', 'A&G@gmail.com', 'https://www.google.com/maps/embed?pb=!4v1752974298441!6m8!1m7!1s8mYw-Ou6n1GQUv1RwTxmsQ!2m2!1d20.36825582310125!2d99.87733385345288!3f247.06!4f-8.099999999999994!5f0.7820865974627469', '168/ 2', '08:00 - 16:00 น.', '', '', '-', '-', '-', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('active','inactive','banned') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `profile_picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` mediumtext COLLATE utf8mb4_unicode_ci,
  `postal_code` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subdistrict_id` int(11) DEFAULT NULL,
  `district_id` int(11) DEFAULT NULL,
  `province_id` int(11) DEFAULT NULL,
  `last_seen_notifications_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `email`, `password`, `name`, `created_at`, `updated_at`, `status`, `profile_picture`, `is_verified`, `verification_token`, `reset_token`, `reset_token_expires`, `phone`, `address`, `postal_code`, `subdistrict_id`, `district_id`, `province_id`, `last_seen_notifications_at`) VALUES
(2, 'test@gmail.com', '$2b$10$8z.xBLdlYfFzT1dHhVR9uetRP6ilSTBj5KuMliRjS9fCcwX6UC2W2', 'test', '2025-06-21 09:12:09', '2025-10-02 09:30:18', 'active', '/uploads/profiles/1757515832713-389545290.png', 0, NULL, NULL, NULL, '099-999-9999', '11/1', '57000', 1, 32, 3, '2025-10-02 16:30:18'),
(6, 'test2@gmail.com', '$2b$10$VvPYgDUQj1Dq.7dAhweMzOjtG/6YDokkquER3BymR1vktiu1g5iyK', 'test2', '2025-08-04 02:19:49', '2025-09-10 14:58:55', 'active', '/uploads/profiles/1757516334534-299931082.png', 0, NULL, NULL, NULL, '099-999-9999', '12/1', '', NULL, NULL, NULL, NULL),
(7, 'test3@gmail.com', '$2b$10$yDk6tDhEyRGJ3HQKb2JDmOTke0cioR979POqOkrkBeR7mWqVtiCum', 'test3', '2025-09-04 10:57:26', '2025-09-05 14:23:52', 'active', '/uploads/profiles/1756983671988-205085063.png', 0, NULL, NULL, NULL, '011-111-1111', '21/2', '', NULL, NULL, NULL, NULL),
(25, 'koy40199@gmail.com', '$2b$10$72j36sRlO0konnpUQR/.SOqc/QPjK5UbfMl3vimBE9vXJAN4AA9x6', 'nkk', '2025-09-26 03:51:50', '2025-09-29 13:37:52', 'active', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-29 20:37:52');

-- --------------------------------------------------------

--
-- Table structure for table `customer_addresses`
--

CREATE TABLE `customer_addresses` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `label` varchar(50) DEFAULT NULL,
  `recipient_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` mediumtext,
  `postal_code` varchar(5) DEFAULT NULL,
  `subdistrict_id` int(11) DEFAULT NULL,
  `district_id` int(11) DEFAULT NULL,
  `province_id` int(11) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `customer_addresses`
--

INSERT INTO `customer_addresses` (`id`, `customer_id`, `label`, `recipient_name`, `phone`, `address`, `postal_code`, `subdistrict_id`, `district_id`, `province_id`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 25, 'บ้าน', 'nkk', '11111111111', '11/1', '57000', 3, 32, 3, 1, '2025-09-26 11:07:05', '2025-09-26 12:01:03'),
(2, 2, 'บ้าน', 'test', '099-999-9999', '11/1', '57000', 2, 32, 3, 1, '2025-09-27 22:22:15', '2025-09-29 15:53:26'),
(3, 2, 'บ้าน', 'test', '099-999-9999', '11/2', '57100', 13, 32, 3, 0, '2025-09-29 15:52:51', '2025-09-29 15:53:26');

-- --------------------------------------------------------

--
-- Table structure for table `custom_orders`
--

CREATE TABLE `custom_orders` (
  `id` int(11) NOT NULL,
  `custom_code` varchar(24) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `category` varchar(64) NOT NULL,
  `product_type` varchar(100) NOT NULL,
  `width` decimal(10,2) NOT NULL,
  `height` decimal(10,2) NOT NULL,
  `unit` enum('cm','m') NOT NULL DEFAULT 'cm',
  `color` varchar(50) DEFAULT '',
  `quantity` int(11) NOT NULL DEFAULT '1',
  `details` text,
  `has_screen` tinyint(1) NOT NULL DEFAULT '0',
  `round_frame` tinyint(1) NOT NULL DEFAULT '0',
  `swing_type` varchar(50) DEFAULT 'บานเดี่ยว',
  `mode` varchar(50) DEFAULT 'มาตรฐาน',
  `fixed_left_m2` decimal(10,3) NOT NULL DEFAULT '0.000',
  `fixed_right_m2` decimal(10,3) NOT NULL DEFAULT '0.000',
  `price` int(11) NOT NULL DEFAULT '0',
  `shipping_method` enum('pickup','delivery') NOT NULL DEFAULT 'pickup',
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shipping_address` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `province_id` int(11) DEFAULT NULL,
  `district_id` int(11) DEFAULT NULL,
  `subdistrict_id` int(11) DEFAULT NULL,
  `postal_code` varchar(5) DEFAULT NULL,
  `status` enum('pending','approved','waiting_payment','paid','in_production','delivering','completed','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `custom_orders`
--

INSERT INTO `custom_orders` (`id`, `custom_code`, `user_id`, `category`, `product_type`, `width`, `height`, `unit`, `color`, `quantity`, `details`, `has_screen`, `round_frame`, `swing_type`, `mode`, `fixed_left_m2`, `fixed_right_m2`, `price`, `shipping_method`, `shipping_fee`, `shipping_address`, `phone`, `province_id`, `district_id`, `subdistrict_id`, `postal_code`, `status`, `created_at`, `updated_at`) VALUES
(1, 'OC#20250917-0001', 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'ชา', 1, '-', 0, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 3000, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'completed', '2025-09-17 15:20:57', '2025-09-30 15:16:59'),
(2, 'OC#20250922-0001', 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'เงิน', 1, '-', 1, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 3500, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'rejected', '2025-09-22 15:41:31', '2025-09-30 15:16:59'),
(3, 'OC#20250923-0001', 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'm', 'ดำ', 1, NULL, 1, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 4800, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'completed', '2025-09-23 16:42:58', '2025-09-30 15:16:59'),
(4, 'OC#20250923-0002', 2, '2', 'หน้าต่างบานเลื่อน4', '180.00', '120.00', 'cm', 'ชา', 1, '-', 1, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 4500, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'waiting_payment', '2025-09-23 21:28:38', '2025-09-30 15:16:59'),
(5, 'OC#20250924-0001', 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'ขาว', 2, NULL, 1, 0, '', 'มาตรฐาน', '0.000', '0.000', 7000, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'pending', '2025-09-24 15:14:23', '2025-09-30 15:16:59'),
(6, 'OC#20250928-0001', 25, '5', 'ประตูสวิง', '1.20', '2.00', 'm', 'ดำ', 2, NULL, 0, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 14000, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'waiting_payment', '2025-09-28 14:16:09', '2025-09-30 15:16:59'),
(7, 'OC#20250928-0002', 25, '2', 'หน้าต่างบานเลื่อน4', '180.00', '120.00', 'cm', 'ชา', 2, NULL, 1, 0, '', 'มาตรฐาน', '0.000', '0.000', 9000, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'pending', '2025-09-28 14:16:09', '2025-09-30 15:16:59'),
(8, 'OC#20250928-0003', 25, '5', 'ประตูสวิง', '1.20', '2.00', 'm', 'เงิน', 1, NULL, 0, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 7000, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'pending', '2025-09-28 18:04:20', '2025-09-30 15:16:59'),
(9, 'OC#20250928-0004', 25, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'เงิน', 2, NULL, 1, 0, '', 'มาตรฐาน', '0.000', '0.000', 7000, 'pickup', '0.00', NULL, NULL, NULL, NULL, NULL, NULL, 'waiting_payment', '2025-09-28 18:04:20', '2025-09-30 15:16:59'),
(10, 'OC#20250930-0001', 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'm', 'เงิน', 1, NULL, 1, 0, '', 'มาตรฐาน', '0.000', '0.000', 4500, 'delivery', '120.00', '-\nดอยลาน, เมืองเชียงราย, เชียงราย, 57000', '091-092-0933', 3, 32, 8, '57000', 'pending', '2025-09-30 11:35:54', '2025-09-30 15:16:59'),
(11, 'OC#20250930-0000', 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'เงิน', 1, '-', 1, 0, '', 'มาตรฐาน', '0.000', '0.000', 3500, 'delivery', '120.00', '11/1\nท่าสาย, เมืองเชียงราย, เชียงราย, 57000', '-', 3, 32, 9, '57000', 'waiting_payment', '2025-09-30 15:40:03', '2025-10-02 12:36:34');

--
-- Triggers `custom_orders`
--
DELIMITER $$
CREATE TRIGGER `trg_custom_orders_before_insert` BEFORE INSERT ON `custom_orders` FOR EACH ROW BEGIN
  DECLARE d DATE; 
  DECLARE seq INT;

  SET d = CURDATE();
  -- SET d = DATE(CONVERT_TZ(NOW(), '+00:00', '+07:00')); -- ใช้ถ้าต้องการเวลาไทย

  INSERT INTO seq_custom_orders_daily (seq_date, last_seq)
  VALUES (d, 0)
  ON DUPLICATE KEY UPDATE last_seq = LAST_INSERT_ID(last_seq + 1);

  SET seq = LAST_INSERT_ID();

  IF NEW.custom_code IS NULL OR NEW.custom_code = '' THEN
    SET NEW.custom_code = CONCAT('OC#', DATE_FORMAT(d, '%Y%m%d'), '-', LPAD(seq, 4, '0'));
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `custom_order_files`
--

CREATE TABLE `custom_order_files` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `custom_order_payments`
--

CREATE TABLE `custom_order_payments` (
  `id` int(11) NOT NULL,
  `custom_order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `image` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `custom_order_payments`
--

INSERT INTO `custom_order_payments` (`id`, `custom_order_id`, `customer_id`, `amount`, `image`, `status`, `note`, `created_at`, `approved_at`, `rejected_at`, `approved_by`) VALUES
(1, 3, 2, '4800.00', '/uploads/custom_payments/bab3c8addfbd9f6a18cbb83b06736a9c', 'approved', NULL, '2025-09-23 16:43:42', '2025-09-23 16:51:30', NULL, NULL),
(2, 9, 25, '7000.00', '/uploads/custom_payments/d5f7abb52312b8d5ca4af0218714984e', 'pending', NULL, '2025-09-28 18:14:11', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `custom_order_status_logs`
--

CREATE TABLE `custom_order_status_logs` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `from_status` varchar(50) NOT NULL,
  `to_status` varchar(50) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `custom_order_status_logs`
--

INSERT INTO `custom_order_status_logs` (`id`, `order_id`, `from_status`, `to_status`, `changed_at`) VALUES
(1, 2, 'pending', 'approved', '2025-09-23 13:55:52'),
(2, 2, 'approved', 'rejected', '2025-09-23 16:27:18'),
(3, 1, 'approved', 'in_production', '2025-09-23 16:27:32'),
(4, 1, 'in_production', 'delivering', '2025-09-23 16:27:36'),
(5, 1, 'delivering', 'completed', '2025-09-23 16:31:31'),
(6, 3, 'pending', 'waiting_payment', '2025-09-23 16:43:25'),
(7, 3, 'waiting_payment', 'paid', '2025-09-23 16:51:30'),
(8, 3, 'paid', 'in_production', '2025-09-23 16:51:49'),
(9, 3, 'in_production', 'delivering', '2025-09-23 16:52:05'),
(10, 3, 'delivering', 'completed', '2025-09-23 16:56:45'),
(11, 4, 'pending', 'waiting_payment', '2025-09-23 21:29:13'),
(12, 6, 'pending', 'waiting_payment', '2025-09-28 14:16:58'),
(13, 9, 'pending', 'waiting_payment', '2025-09-28 18:13:38'),
(14, 11, 'pending', 'waiting_payment', '2025-10-02 12:36:34');

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE `districts` (
  `id` int(11) NOT NULL,
  `name_th` varchar(150) NOT NULL,
  `province_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `districts`
--

INSERT INTO `districts` (`id`, `name_th`, `province_id`) VALUES
(32, 'เมืองเชียงราย', 3),
(33, 'แม่สาย', 3),
(34, 'แม่จัน', 3),
(35, 'แม่ฟ้าหลวง', 3),
(36, 'เชียงแสน', 3),
(37, 'เชียงของ', 3),
(38, 'เวียงแก่น', 3),
(39, 'เวียงชัย', 3),
(40, 'เวียงเชียงรุ้ง', 3),
(41, 'พาน', 3),
(42, 'ป่าแดด', 3),
(43, 'แม่ลาว', 3),
(44, 'แม่สรวย', 3),
(45, 'เวียงป่าเป้า', 3),
(46, 'ขุนตาล', 3),
(47, 'เทิง', 3),
(48, 'พญาเม็งราย', 3),
(49, 'ดอยหลวง', 3);

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inbox`
--

CREATE TABLE `inbox` (
  `id` int(11) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inbox`
--

INSERT INTO `inbox` (`id`, `name`, `email`, `phone`, `subject`, `message`, `created_at`) VALUES
(1, 'test', 'test@gmail.com', '099-999-9999', 'test', '-', '2025-08-16 08:48:29'),
(2, 'test', 'test@gmail.com', '099-999-9999', 'test', '-', '2025-09-04 10:51:16');

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations`
--

CREATE TABLE `knex_migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations_lock`
--

CREATE TABLE `knex_migrations_lock` (
  `index` int(10) UNSIGNED NOT NULL,
  `is_locked` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `knex_migrations_lock`
--

INSERT INTO `knex_migrations_lock` (`index`, `is_locked`) VALUES
(1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `ledger_entries`
--

CREATE TABLE `ledger_entries` (
  `id` int(11) NOT NULL,
  `entry_date` date NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `source` enum('online','store') NOT NULL DEFAULT 'store',
  `ref_no` varchar(100) DEFAULT NULL,
  `code` varchar(100) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `qty` decimal(12,2) NOT NULL DEFAULT '1.00',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `description` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `custom_order_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `ledger_entries`
--

INSERT INTO `ledger_entries` (`id`, `entry_date`, `type`, `source`, `ref_no`, `code`, `name`, `qty`, `unit_price`, `description`, `amount`, `category_id`, `order_id`, `custom_order_id`, `created_at`, `updated_at`) VALUES
(1, '2025-09-01', 'income', 'store', NULL, NULL, NULL, '1.00', '0.00', 'ขายหน้าร้าน', '5000.00', NULL, NULL, NULL, '2025-09-27 14:20:10', '2025-09-27 14:20:10'),
(2, '2025-09-02', 'expense', 'store', NULL, NULL, NULL, '1.00', '0.00', 'ซื้อวัตถุดิบ', '-2000.00', NULL, NULL, NULL, '2025-09-27 14:20:10', '2025-09-27 14:20:10'),
(3, '2025-09-28', 'income', 'online', NULL, NULL, NULL, '1.00', '0.00', 'ขายหน้าต่างได้ สามชุด', '9000.00', NULL, NULL, NULL, '2025-09-27 14:33:18', '2025-09-27 14:33:18'),
(4, '2025-09-30', 'income', 'store', NULL, NULL, NULL, '1.00', '0.00', 'ขายหน้าต่างได้ สามชุด', '4500.00', NULL, NULL, NULL, '2025-09-29 21:13:43', '2025-09-29 21:13:43'),
(5, '2025-09-30', 'expense', 'store', NULL, NULL, NULL, '1.00', '0.00', 'ค่าน้ำมัน', '-500.00', NULL, NULL, NULL, '2025-09-30 17:56:31', '2025-09-30 17:56:31'),
(6, '2025-10-02', 'income', 'store', '10000', 'MAT001', 'เสากุญแจ', '1.00', '600.00', '-', '6.00', NULL, NULL, NULL, '2025-10-02 16:07:20', '2025-10-02 16:07:20');

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `materials`
--

INSERT INTO `materials` (`id`, `code`, `name`, `created_at`) VALUES
(1, 'MAT001', 'เสากุญแจ', '2025-08-23 07:03:27'),
(2, 'MAT002', 'เสาเกี่ยว', '2025-08-23 07:05:07'),
(3, 'MAT003', 'เสาตาย', '2025-08-24 22:37:36'),
(10, 'MAT004', 'ขวางบน', '2025-08-25 00:02:39'),
(11, 'MAT005', 'ขวางล่าง', '2025-08-25 00:19:41'),
(12, 'MAT006', 'เฟรมข้างติดกล่อง', '2025-08-25 00:26:07'),
(13, 'MAT007', 'เฟรมบนติดกล่อง', '2025-08-25 00:27:42'),
(14, 'MAT008', 'เฟรมล่างติดกล่อง', '2025-08-25 00:31:32'),
(15, 'MAT009', 'ขวางบนสวิง', '2025-08-25 00:35:48'),
(16, 'MAT010', 'ขวางล่างสวิง', '2025-08-25 01:06:03'),
(17, 'MAT011', 'เสาขวางสวิง', '2025-08-25 01:07:28'),
(18, 'MAT012', 'รางแขวนใหญ่', '2025-08-25 01:08:14'),
(19, 'MAT013', 'ฝาปิด', '2025-08-25 01:10:27'),
(20, 'MAT014', 'ธรณีสวิง', '2025-08-25 01:10:59'),
(21, 'MAT015', 'ตบเรียบ', '2025-08-25 01:11:27'),
(22, 'MAT016', 'ตบร่อง', '2025-08-25 01:11:52'),
(23, 'MAT017', 'ตบธรณี', '2025-08-25 01:12:26'),
(24, 'MAT018', 'ชนกลางมุ้งบานเลื่อน', '2025-08-25 01:13:03'),
(25, 'MAT019', 'ชนกลางบานเลื่อน', '2025-08-25 01:13:32'),
(26, 'MAT020', 'คิ้วประตูสวิง', '2025-08-25 01:14:00'),
(27, 'MAT021', 'คิ้วเทใหญ่', '2025-08-25 01:14:26'),
(28, 'MAT022', 'คิ้วเทเล็ก', '2025-08-25 01:14:50'),
(29, 'MAT023', 'กล่องเรียบ', '2025-08-25 01:15:14'),
(30, 'MAT024', 'กล่องร่อง', '2025-08-25 01:15:41'),
(31, 'MAT025', 'กล่องเปิด', '2025-08-25 01:16:12'),
(32, 'MAT026', 'กรอบมุ้งบานเลื่อน', '2025-08-25 01:16:33'),
(33, 'MAT027', 'กรอบบานกระทุ้ง', '2025-08-25 01:16:52'),
(34, 'MAT028', 'กรอบนอกกระทุ้ง-แบบยูเนี่ยน', '2025-08-25 01:17:11'),
(35, 'OIL001', 'ค่าน้ำมัน', '2025-10-02 07:09:21');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `message` mediumtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `message`, `created_at`) VALUES
(1, 2, 1, 'สวัสดีครับ', '2025-09-22 08:09:54'),
(2, 2, 1, '...', '2025-09-23 05:43:22'),
(3, 2, 1, '...', '2025-09-23 05:43:24'),
(4, 1, 2, '...', '2025-09-23 05:43:48');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `type` enum('info','success','warning','error') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` mediumtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `customer_id`, `type`, `title`, `message`, `created_at`, `is_read`, `read_at`) VALUES
(34, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #11 ถูกสร้างเรียบร้อยแล้ว', '2025-09-14 10:30:34', 0, NULL),
(35, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0011 ได้รับการยืนยันแล้ว ขอบคุณที่ใช้บริการค่ะ', '2025-09-14 11:01:55', 0, NULL),
(36, 2, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿250', '2025-09-14 11:01:55', 0, NULL),
(37, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #12 ถูกสร้างเรียบร้อยแล้ว', '2025-09-15 15:39:45', 0, NULL),
(38, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0012 ได้รับการยืนยันแล้ว ขอบคุณที่ใช้บริการค่ะ', '2025-09-15 15:43:28', 0, NULL),
(39, 2, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿3,250', '2025-09-15 15:43:28', 0, NULL),
(40, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #14 ถูกสร้างเรียบร้อยแล้ว', '2025-09-16 11:47:15', 0, NULL),
(41, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0014 ได้รับการยืนยันแล้ว ขอบคุณที่ใช้บริการค่ะ', '2025-09-16 11:47:54', 0, NULL),
(42, 2, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿3,000', '2025-09-16 11:47:54', 0, NULL),
(43, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #15 ถูกสร้างเรียบร้อยแล้ว', '2025-09-16 13:16:49', 0, NULL),
(44, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #16 ถูกสร้างเรียบร้อยแล้ว', '2025-09-16 13:30:32', 0, NULL),
(45, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #18 ถูกสร้างเรียบร้อยแล้ว', '2025-09-16 13:46:15', 0, NULL),
(46, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0018 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-16 13:46:56', 0, NULL),
(47, 2, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿500', '2025-09-16 13:46:56', 0, NULL),
(48, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0016 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-16 13:52:54', 0, NULL),
(49, 2, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿250', '2025-09-16 13:52:54', 0, NULL),
(50, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0015 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-16 13:52:57', 0, NULL),
(51, 2, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿3,000', '2025-09-16 13:52:57', 0, NULL),
(52, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #19 ถูกสร้างเรียบร้อยแล้ว', '2025-09-16 13:56:52', 0, NULL),
(53, 2, 'warning', 'คำสั่งซื้อถูกยกเลิก', 'คำสั่งซื้อ #19 ถูกยกเลิกแล้ว', '2025-09-16 13:57:07', 0, NULL),
(54, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #20 ถูกสร้างเรียบร้อยแล้ว', '2025-09-16 14:00:19', 0, NULL),
(55, 2, 'warning', 'คำสั่งซื้อถูกยกเลิก', 'คำสั่งซื้อ #20 ถูกยกเลิกแล้ว และคืนสินค้าเข้าสต็อก', '2025-09-16 14:02:19', 0, NULL),
(56, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #23 ถูกสร้างเรียบร้อยแล้ว', '2025-09-17 11:25:45', 0, NULL),
(57, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #24 ถูกสร้างเรียบร้อยแล้ว', '2025-09-17 15:17:49', 0, NULL),
(58, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0023 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-17 15:19:00', 0, NULL),
(59, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0024 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-17 15:20:05', 0, NULL),
(60, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #25 ถูกสร้างเรียบร้อยแล้ว', '2025-09-17 16:05:47', 0, NULL),
(61, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0025 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-17 16:06:19', 0, NULL),
(62, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #26 ถูกสร้างเรียบร้อยแล้ว', '2025-09-17 19:01:19', 0, NULL),
(63, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #27 ถูกสร้างเรียบร้อยแล้ว', '2025-09-17 19:06:10', 0, NULL),
(64, 2, 'warning', 'คำสั่งซื้อถูกยกเลิก', 'คำสั่งซื้อ #26 ถูกยกเลิกแล้ว และคืนสินค้าเข้าสต็อก', '2025-09-17 19:10:49', 0, NULL),
(65, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0027 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-19 18:15:28', 0, NULL),
(66, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #28 ถูกสร้างเรียบร้อยแล้ว', '2025-09-23 11:25:52', 0, NULL),
(67, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #29 ถูกสร้างเรียบร้อยแล้ว', '2025-09-23 14:03:03', 0, NULL),
(68, 2, 'info', 'กรุณาชำระเงิน', 'ออเดอร์ #3 ได้รับการอนุมัติ กรุณาชำระเงินเพื่อดำเนินการต่อ', '2025-09-23 16:43:25', 0, NULL),
(69, 2, 'info', 'แจ้งชำระเงินแล้ว', 'ออเดอร์ #3 ส่งหลักฐานการชำระเงินแล้ว รอแอดมินตรวจสอบ', '2025-09-23 16:43:42', 0, NULL),
(70, 2, 'success', 'ชำระเงินสำเร็จ', 'ออเดอร์ #3 ได้รับการยืนยันการชำระเงินแล้ว', '2025-09-23 16:51:30', 0, NULL),
(71, 2, 'info', 'กรุณาชำระเงิน', 'ออเดอร์ #4 ได้รับการอนุมัติ กรุณาชำระเงินเพื่อดำเนินการต่อ', '2025-09-23 21:29:13', 0, NULL),
(72, 2, 'warning', 'คำสั่งซื้อถูกยกเลิก', 'คำสั่งซื้อ #29 ถูกยกเลิกแล้ว และคืนสินค้าเข้าสต็อก', '2025-09-24 14:40:26', 0, NULL),
(73, 25, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #30 ถูกสร้างเรียบร้อยแล้ว', '2025-09-26 11:07:05', 0, NULL),
(74, 25, 'warning', 'คำสั่งซื้อถูกยกเลิก', 'คำสั่งซื้อ #30 ถูกยกเลิกแล้ว และคืนสินค้าเข้าสต็อก', '2025-09-26 13:40:19', 0, NULL),
(75, 25, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #31 ถูกสร้างเรียบร้อยแล้ว', '2025-09-26 13:58:39', 0, NULL),
(76, 25, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #32 ถูกสร้างเรียบร้อยแล้ว', '2025-09-26 14:18:34', 0, NULL),
(77, 25, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #32 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-09-26 14:25:40', 0, NULL),
(78, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0028 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-26 14:26:23', 0, NULL),
(79, 25, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #33 ถูกสร้างเรียบร้อยแล้ว', '2025-09-26 15:57:06', 0, NULL),
(80, 25, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #33 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-09-26 15:58:30', 0, NULL),
(81, 25, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0033 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-26 16:07:10', 0, NULL),
(82, 25, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0032 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-26 16:07:34', 0, NULL),
(83, 25, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #33 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-09-26 17:18:21', 0, NULL),
(84, 25, 'success', 'จัดส่งสำเร็จ', 'คำสั่งซื้อ #33 ของคุณถูกจัดส่งสำเร็จแล้ว', '2025-09-26 17:19:07', 0, NULL),
(85, 25, 'success', 'จัดส่งสำเร็จ', 'คำสั่งซื้อ #33 ของคุณถูกจัดส่งสำเร็จแล้ว', '2025-09-26 17:19:10', 0, NULL),
(86, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #34 ถูกสร้างเรียบร้อยแล้ว', '2025-09-27 22:22:27', 0, NULL),
(87, 2, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #34 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-09-27 22:22:47', 0, NULL),
(88, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0034 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-27 22:24:14', 0, NULL),
(89, 2, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #34 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-09-27 22:41:18', 0, NULL),
(90, 2, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #34 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-09-27 22:42:10', 0, NULL),
(91, 2, 'success', 'จัดส่งสำเร็จ', 'คำสั่งซื้อ #34 ของคุณถูกจัดส่งสำเร็จแล้ว', '2025-09-27 22:42:30', 0, NULL),
(92, 25, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #35 ถูกสร้างเรียบร้อยแล้ว', '2025-09-28 13:51:46', 0, NULL),
(93, 25, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #35 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-09-28 13:52:50', 0, NULL),
(94, 25, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #36 ถูกสร้างเรียบร้อยแล้ว', '2025-09-28 14:11:04', 0, NULL),
(95, 25, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #36 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-09-28 14:11:20', 0, NULL),
(96, 25, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0035 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-09-28 14:11:59', 0, NULL),
(97, 25, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #36 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-09-28 14:12:19', 0, NULL),
(98, 25, 'success', 'จัดส่งสำเร็จ', 'คำสั่งซื้อ #36 ของคุณถูกจัดส่งสำเร็จแล้ว', '2025-09-28 14:12:33', 0, NULL),
(99, 25, 'info', 'กรุณาชำระเงิน', 'ออเดอร์ #6 ได้รับการอนุมัติ กรุณาชำระเงินเพื่อดำเนินการต่อ', '2025-09-28 14:16:58', 0, NULL),
(100, 25, 'info', 'กรุณาชำระเงิน', 'ออเดอร์ #9 ได้รับการอนุมัติ กรุณาชำระเงินเพื่อดำเนินการต่อ', '2025-09-28 18:13:38', 0, NULL),
(101, 25, 'info', 'แจ้งชำระเงินแล้ว', 'ออเดอร์ #9 ส่งหลักฐานการชำระเงินแล้ว รอแอดมินตรวจสอบ', '2025-09-28 18:14:11', 0, NULL),
(102, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #37 ถูกสร้างเรียบร้อยแล้ว', '2025-09-29 16:07:07', 0, NULL),
(103, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #38 ถูกสร้างเรียบร้อยแล้ว', '2025-09-29 16:22:19', 0, NULL),
(104, 2, 'success', 'คำสั่งซื้อได้รับการอนุมัติ', 'คำสั่งซื้อ #38 ของคุณได้รับการอนุมัติแล้ว', '2025-09-29 19:54:21', 0, NULL),
(105, 25, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #39 ถูกสร้างเรียบร้อยแล้ว', '2025-09-29 20:07:40', 0, NULL),
(106, 25, 'warning', 'คำสั่งซื้อถูกยกเลิก', 'คำสั่งซื้อ #39 ถูกยกเลิกแล้ว และคืนสินค้าเข้าสต็อก', '2025-09-29 20:15:38', 0, NULL),
(107, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #40 ถูกสร้างเรียบร้อยแล้ว', '2025-09-29 20:44:25', 0, NULL),
(108, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #41 ถูกสร้างเรียบร้อยแล้ว', '2025-09-29 20:49:22', 0, NULL),
(109, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #42 ถูกสร้างเรียบร้อยแล้ว', '2025-09-29 20:55:10', 0, NULL),
(110, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #43 ถูกสร้างเรียบร้อยแล้ว', '2025-10-02 11:51:01', 0, NULL),
(111, 2, 'info', 'กรุณาชำระเงิน', 'ออเดอร์ #11 ได้รับการอนุมัติ กรุณาชำระเงินเพื่อดำเนินการต่อ', '2025-10-02 12:36:34', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_code` varchar(24) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `address_id` int(11) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `order_type` enum('standard','custom') COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `shipping_address` mediumtext COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `product_list` json DEFAULT NULL,
  `processing_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_code`, `customer_id`, `address_id`, `total_price`, `shipping_fee`, `order_type`, `status`, `created_at`, `shipping_address`, `phone`, `approved_at`, `shipped_at`, `delivered_at`, `cancelled_at`, `product_list`, `processing_at`) VALUES
(11, 'OR#20250914-0001', 2, NULL, NULL, '0.00', 'standard', 'delivered', '2025-09-14 03:30:34', '-', '-', NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'OR#20250915-0001', 2, NULL, NULL, '0.00', 'standard', 'delivered', '2025-09-15 08:39:44', '11/1', '-', NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'OR#20250916-0001', 2, NULL, NULL, '0.00', 'standard', 'delivered', '2025-09-16 04:47:14', '-', '-', NULL, '2025-09-16 11:48:24', '2025-09-16 11:56:40', NULL, NULL, NULL),
(15, 'OR#20250916-0002', 2, NULL, NULL, '0.00', 'standard', 'delivered', '2025-09-16 06:16:48', '-', '-', '2025-09-16 13:52:56', '2025-09-16 13:55:58', '2025-09-16 13:56:12', NULL, NULL, NULL),
(16, 'OR#20250916-0003', 2, NULL, NULL, '0.00', 'standard', 'delivered', '2025-09-16 06:30:31', '-', '-', '2025-09-16 13:52:53', '2025-09-16 13:55:55', '2025-09-16 13:56:09', NULL, NULL, NULL),
(18, 'OR#20250916-0004', 2, NULL, NULL, '0.00', 'standard', 'delivered', '2025-09-16 06:46:14', '-', '-', '2025-09-16 13:46:55', '2025-09-16 13:47:14', '2025-09-16 13:47:48', NULL, NULL, NULL),
(19, 'OR#20250916-0005', 2, NULL, NULL, '0.00', 'standard', 'cancelled', '2025-09-16 06:56:52', '-', '-', NULL, NULL, NULL, '2025-09-16 13:57:06', NULL, NULL),
(20, 'OR#20250916-0006', 2, NULL, NULL, '0.00', 'standard', 'cancelled', '2025-09-16 07:00:18', '-', '-', NULL, NULL, NULL, '2025-09-16 14:02:19', NULL, NULL),
(23, 'OR#20250917-0001', 2, NULL, NULL, '0.00', 'standard', 'approved', '2025-09-17 04:25:45', '-', '-', '2025-09-17 15:18:59', '2025-09-17 11:26:01', NULL, NULL, NULL, NULL),
(24, 'OR#20250917-0002', 2, NULL, NULL, '0.00', 'standard', 'approved', '2025-09-17 08:17:49', '-', '-', '2025-09-17 15:20:05', '2025-09-17 15:19:30', NULL, NULL, NULL, NULL),
(25, 'OR#20250917-0003', 2, NULL, NULL, '0.00', 'standard', 'shipped', '2025-09-17 09:05:46', '-', '-', '2025-09-17 16:06:18', '2025-09-17 16:15:30', NULL, NULL, NULL, NULL),
(26, 'OR#20250917-0004', 2, NULL, NULL, '0.00', 'standard', 'cancelled', '2025-09-17 12:01:19', '-', '-', NULL, NULL, NULL, '2025-09-17 19:10:49', NULL, NULL),
(27, 'OR#20250917-0005', 2, NULL, NULL, '0.00', 'standard', 'shipped', '2025-09-17 12:06:09', '-', '-', '2025-09-19 18:15:28', '2025-09-19 18:16:02', NULL, NULL, NULL, NULL),
(28, 'OR#20250923-0001', 2, NULL, NULL, '0.00', 'standard', 'approved', '2025-09-23 04:25:52', '-', '-', '2025-09-26 14:26:23', '2025-09-23 12:56:04', NULL, NULL, NULL, NULL),
(29, 'OR#20250923-0002', 2, NULL, NULL, '0.00', 'standard', 'cancelled', '2025-09-23 07:03:02', '-', '-', NULL, NULL, NULL, '2025-09-24 14:40:26', NULL, NULL),
(30, 'OR#20250926-0001', 25, NULL, NULL, '0.00', 'standard', 'cancelled', '2025-09-26 04:07:05', '11/1', '11111111111', NULL, NULL, NULL, '2025-09-26 13:40:18', NULL, NULL),
(31, 'OR#20250926-0002', 25, NULL, NULL, '0.00', 'standard', 'pending', '2025-09-26 06:58:39', '11/1\nสันทราย, เมืองเชียงราย, เชียงราย, 57000', '11111111111', NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'OR#20250926-0003', 25, 1, '500.00', '0.00', 'standard', 'approved', '2025-09-26 07:18:34', '11/1\nสันทราย, เมืองเชียงราย, เชียงราย, 57000', '11111111111', '2025-09-26 16:07:33', '2025-09-26 14:25:39', NULL, NULL, NULL, NULL),
(33, 'OR#20250926-0004', 25, 1, '11500.00', '0.00', 'standard', 'delivered', '2025-09-26 08:57:05', '11/1\nสันทราย, เมืองเชียงราย, เชียงราย, 57000', '11111111111', '2025-09-26 16:07:09', '2025-09-26 17:18:20', '2025-09-26 17:19:10', NULL, '[{\"product_qty\": 2, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}, {\"product_qty\": 3, \"product_name\": \"หน้าต่างอลูมิเนียมสีอบขาว\"}, {\"product_qty\": 4, \"product_name\": \"หน้าต่างมุ้งสีดำ\"}]', NULL),
(34, 'OR#20250927-0001', 2, 2, '250.00', '0.00', 'standard', 'delivered', '2025-09-27 15:22:26', '11/1\nห้วยสัก, เมืองเชียงราย, เชียงราย, 57000', '099-999-9999', '2025-09-27 22:24:13', '2025-09-27 22:42:10', '2025-09-27 22:42:29', NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', '2025-09-27 22:41:17'),
(35, 'OR#20250928-0001', 25, 1, '250.00', '0.00', 'standard', 'approved', '2025-09-28 06:51:45', '11/1\nสันทราย, เมืองเชียงราย, เชียงราย, 57000', '11111111111', '2025-09-28 14:11:59', NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', '2025-09-28 13:52:49'),
(36, 'OR#20250928-0002', 25, 1, '3000.00', '0.00', 'standard', 'delivered', '2025-09-28 07:11:03', '11/1\nสันทราย, เมืองเชียงราย, เชียงราย, 57000', '11111111111', NULL, '2025-09-28 14:12:18', '2025-09-28 14:12:33', NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างอลูมิเนียมสีอบขาว\"}]', '2025-09-28 14:11:20'),
(37, 'OR#20250929-0001', 2, 2, '3000.00', '0.00', 'standard', 'pending', '2025-09-29 09:07:07', '11/1\nรอบเวียง, เมืองเชียงราย, เชียงราย, 57000', '099-999-9999', NULL, NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างอลูมิเนียมสีอบขาว\"}]', NULL),
(38, 'OR#20250929-0002', 2, 2, '3250.00', '0.00', 'standard', 'approved', '2025-09-29 09:22:18', '11/1\nรอบเวียง, เมืองเชียงราย, เชียงราย, 57000', '099-999-9999', '2025-09-29 19:54:21', NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างอลูมิเนียมสีอบขาว\"}, {\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', NULL),
(39, 'OR#20250929-0003', 25, 1, '250.00', '0.00', 'standard', 'cancelled', '2025-09-29 13:07:40', '11/1\nสันทราย, เมืองเชียงราย, เชียงราย, 57000', '11111111111', NULL, NULL, NULL, '2025-09-29 20:15:37', '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', NULL),
(40, 'OR#20250929-0004', 2, 2, '3250.00', '0.00', 'standard', 'pending', '2025-09-29 13:44:24', '11/1\nรอบเวียง, เมืองเชียงราย, เชียงราย, 57000', '099-999-9999', NULL, NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างอลูมิเนียมสีอบขาว\"}, {\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', NULL),
(41, 'OR#20250929-0005', 2, 2, '3250.00', '0.00', 'standard', 'pending', '2025-09-29 13:49:22', '11/1\nรอบเวียง, เมืองเชียงราย, เชียงราย, 57000', '099-999-9999', NULL, NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างอลูมิเนียมสีอบขาว\"}, {\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', NULL),
(42, 'OR#20250929-0006', 2, 3, '500.00', '0.00', 'standard', 'pending', '2025-09-29 13:55:09', '11/2\nแม่ข้าวต้ม, เมืองเชียงราย, เชียงราย, 57100', '099-999-9999', NULL, NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีดำ\"}]', NULL),
(43, 'OR#20251002-0000', 2, 2, '500.00', '0.00', 'standard', 'pending', '2025-10-02 04:51:01', '11/1\nรอบเวียง, เมืองเชียงราย, เชียงราย, 57000', '099-999-9999', NULL, NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีดำ\"}]', NULL);

--
-- Triggers `orders`
--
DELIMITER $$
CREATE TRIGGER `trg_orders_before_insert` BEFORE INSERT ON `orders` FOR EACH ROW BEGIN
  DECLARE d DATE; DECLARE seq INT;
  SET d = CURDATE();
  INSERT INTO seq_orders_daily (seq_date, last_seq)
  VALUES (d, 0)
  ON DUPLICATE KEY UPDATE last_seq = LAST_INSERT_ID(last_seq + 1);
  SET seq = LAST_INSERT_ID();
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    SET NEW.order_code = CONCAT('OR#', DATE_FORMAT(d,'%Y%m%d'), '-', LPAD(seq,4,'0'));
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(14, 11, 1, 1, '250.00'),
(15, 12, 2, 1, '3000.00'),
(16, 12, 1, 1, '250.00'),
(18, 14, 2, 1, '3000.00'),
(19, 15, 2, 1, '3000.00'),
(20, 16, 1, 1, '250.00'),
(22, 18, 3, 1, '500.00'),
(23, 19, 5, 1, '4500.00'),
(24, 20, 4, 1, '1500.00'),
(27, 23, 1, 2, '250.00'),
(28, 24, 1, 1, '250.00'),
(29, 25, 1, 1, '250.00'),
(30, 26, 1, 1, '250.00'),
(31, 27, 1, 1, '250.00'),
(32, 27, 2, 1, '3000.00'),
(33, 27, 3, 1, '500.00'),
(34, 27, 4, 1, '1500.00'),
(35, 27, 5, 1, '4500.00'),
(36, 28, 2, 1, '3000.00'),
(37, 29, 2, 1, '3000.00'),
(38, 30, 2, 1, '3000.00'),
(39, 31, 1, 1, '250.00'),
(40, 32, 1, 2, '250.00'),
(41, 33, 1, 2, '250.00'),
(42, 33, 2, 3, '3000.00'),
(43, 33, 3, 4, '500.00'),
(44, 34, 1, 1, '250.00'),
(45, 35, 1, 1, '250.00'),
(46, 36, 2, 1, '3000.00'),
(47, 37, 2, 1, '3000.00'),
(48, 38, 2, 1, '3000.00'),
(49, 38, 1, 1, '250.00'),
(50, 39, 1, 1, '250.00'),
(51, 40, 2, 1, '3000.00'),
(52, 40, 1, 1, '250.00'),
(53, 41, 2, 1, '3000.00'),
(54, 41, 1, 1, '250.00'),
(55, 42, 3, 1, '500.00'),
(56, 43, 3, 1, '500.00');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `customer_id`, `order_id`, `image`, `amount`, `status`, `created_at`) VALUES
(8, 2, 11, 'cc77fb9cc45c2224d67291356851b969', '250.00', 'approved', '2025-09-14 04:01:06'),
(9, 2, 12, 'bacb85b318657cfd61f9784b391fe5e2', '3250.00', 'approved', '2025-09-15 08:42:20'),
(10, 2, 14, '18e51b813e1685abdd71a703205df969', '3000.00', 'approved', '2025-09-16 04:47:36'),
(11, 2, 15, 'e16873297045f529d6fbb85238f66158', '3000.00', 'approved', '2025-09-16 06:18:44'),
(12, 2, 16, 'ca1c78118c546f8f862f94b016ed5a33', '250.00', 'approved', '2025-09-16 06:30:52'),
(13, 2, 18, 'd4e266f3563f0e0f40824dc019528ffe', '500.00', 'approved', '2025-09-16 06:46:27'),
(14, 2, 23, '44962ed1ca99b9f01163cfc75df88444', '500.00', 'approved', '2025-09-17 04:26:01'),
(15, 2, 24, '61dca3ee4cdba6e0f3d4aa2655abec0c', '250.00', 'approved', '2025-09-17 08:19:30'),
(16, 2, 25, 'eac392f44546d1b770ee73f376fc8387', '250.00', 'approved', '2025-09-17 09:05:58'),
(17, 2, 27, '94386dab1fb22cfb5c829a8ee81d6db6', '9750.00', 'approved', '2025-09-19 11:14:30'),
(18, 2, 28, 'f73973c13c94c88924e2efa9f3d56d83', '3000.00', 'approved', '2025-09-23 05:56:04'),
(19, 25, 32, 'c8512a4eb4ea4aa107668caf4711f4f5', '500.00', 'approved', '2025-09-26 07:25:39'),
(20, 25, 33, 'cf1b1d1f2783e0ac960323ab9c90bc97', '11500.00', 'approved', '2025-09-26 08:58:30'),
(21, 2, 34, 'e639f9753119677838ca5f21187afb68', '250.00', 'approved', '2025-09-27 15:22:46'),
(22, 25, 35, 'a9b5966f63ce96404e25d5ccac78af8f', '250.00', 'approved', '2025-09-28 06:52:49'),
(23, 25, 36, '2e1272d808382ab8f958c215869b611f', '3000.00', 'pending', '2025-09-28 07:11:20');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` mediumtext COLLATE utf8mb4_unicode_ci,
  `category_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) DEFAULT '0',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','-') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `product_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `category_id`, `price`, `quantity`, `image_url`, `status`, `created_at`, `updated_at`, `product_code`, `color`, `size`) VALUES
(1, 'หน้าต่างมุ้งสีอบขาว', '-', 13, '250.00', 0, '/uploads/products/1755243843772-201885004.png', 'active', '2025-08-15 07:44:03', '2025-09-29 13:49:22', 'SCR-GR-120x180-0005', 'ขาว', '80*120 cm'),
(2, 'หน้าต่างอลูมิเนียมสีอบขาว', '-', 1, '3000.00', 0, '/uploads/products/1755244182369-572932768.jpg', 'active', '2025-08-15 07:49:42', '2025-09-29 13:49:22', 'WIN-WH-120x180-0001', NULL, NULL),
(3, 'หน้าต่างมุ้งสีดำ', '-', 13, '500.00', 3, '/uploads/products/1757405222213-284209072.jpg', 'active', '2025-09-09 08:07:02', '2025-10-02 04:51:01', 'SCR-BK-120x100-0003', NULL, NULL),
(4, 'บานกระทุ้งสีดำ', '-', 10, '1500.00', 9, '/uploads/products/1757405309838-734925198.jpg', 'active', '2025-09-09 08:08:29', '2025-09-17 12:06:09', 'AWN-BK-100x80-0007', NULL, NULL),
(5, 'ประตูบานเลื่อน แบ่ง2 สีดำ', 'มีมุ้งเพิ่ม', 3, '4500.00', 9, '/uploads/products/1757405740320-239773740.jpg', 'active', '2025-09-09 08:15:40', '2025-09-17 12:06:09', 'SLD-2P-BK-SCR-0001', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_colors`
--

CREATE TABLE `product_colors` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `color_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_colors`
--

INSERT INTO `product_colors` (`id`, `product_id`, `color_name`, `color_code`) VALUES
(1, 1, 'เงิน', '#C0C0C0'),
(2, 1, 'ดำ', '#000000'),
(3, 1, 'อบขาว', '#FFFFFF'),
(4, 1, 'ชา', '#5C4033'),
(5, 1, 'ลายไม้จามจุรี', '#A9745B');

-- --------------------------------------------------------

--
-- Table structure for table `product_ratings`
--

CREATE TABLE `product_ratings` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_ratings`
--

INSERT INTO `product_ratings` (`id`, `customer_id`, `product_id`, `rating`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 5, '2025-08-01 17:01:27', '2025-09-03 08:46:06'),
(2, 2, 2, 4, '2025-08-02 14:57:18', '2025-09-18 05:15:49'),
(3, 2, 11, 5, '2025-08-03 07:24:02', '2025-08-03 07:24:02'),
(4, 5, 11, 5, '2025-08-03 09:43:51', '2025-08-03 09:43:51'),
(5, 6, 15, 5, '2025-08-04 02:29:34', '2025-08-04 02:29:34'),
(6, 2, 3, 4, '2025-09-24 05:58:52', '2025-09-24 05:58:52'),
(7, 25, 1, 5, '2025-09-29 13:01:40', '2025-09-29 13:01:40'),
(8, 25, 2, 5, '2025-09-29 13:02:19', '2025-09-29 13:02:19');

-- --------------------------------------------------------

--
-- Table structure for table `provinces`
--

CREATE TABLE `provinces` (
  `id` int(11) NOT NULL,
  `name_th` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `provinces`
--

INSERT INTO `provinces` (`id`, `name_th`) VALUES
(3, 'เชียงราย');

-- --------------------------------------------------------

--
-- Table structure for table `seq_custom_orders_daily`
--

CREATE TABLE `seq_custom_orders_daily` (
  `seq_date` date NOT NULL,
  `last_seq` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `seq_custom_orders_daily`
--

INSERT INTO `seq_custom_orders_daily` (`seq_date`, `last_seq`) VALUES
('2025-09-30', 0);

-- --------------------------------------------------------

--
-- Table structure for table `seq_orders_daily`
--

CREATE TABLE `seq_orders_daily` (
  `seq_date` date NOT NULL,
  `last_seq` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `seq_orders_daily`
--

INSERT INTO `seq_orders_daily` (`seq_date`, `last_seq`) VALUES
('2025-10-02', 0);

-- --------------------------------------------------------

--
-- Table structure for table `shipping_rates`
--

CREATE TABLE `shipping_rates` (
  `id` int(11) NOT NULL,
  `district_id` int(11) NOT NULL DEFAULT '0',
  `subdistrict_id` int(11) NOT NULL DEFAULT '0',
  `base_fee` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `shipping_rates`
--

INSERT INTO `shipping_rates` (`id`, `district_id`, `subdistrict_id`, `base_fee`, `is_active`) VALUES
(1, 0, 0, '120.00', 1),
(2, 33, 0, '60.00', 1),
(3, 32, 0, '120.00', 1),
(4, 34, 0, '140.00', 1),
(5, 35, 0, '150.00', 1),
(6, 36, 0, '140.00', 1),
(7, 37, 0, '150.00', 1),
(8, 38, 0, '150.00', 1),
(9, 39, 0, '130.00', 1),
(10, 40, 0, '140.00', 1),
(11, 41, 0, '130.00', 1),
(12, 42, 0, '150.00', 1),
(13, 43, 0, '130.00', 1),
(14, 44, 0, '150.00', 1),
(15, 45, 0, '160.00', 1),
(16, 46, 0, '150.00', 1),
(17, 47, 0, '150.00', 1),
(18, 48, 0, '150.00', 1),
(19, 49, 0, '140.00', 1),
(20, 32, 10, '80.00', 1),
(21, 32, 1, '100.00', 1),
(22, 32, 12, '90.00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `subdistricts`
--

CREATE TABLE `subdistricts` (
  `id` int(11) NOT NULL,
  `name_th` varchar(150) NOT NULL,
  `district_id` int(11) NOT NULL,
  `postal_code` varchar(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `subdistricts`
--

INSERT INTO `subdistricts` (`id`, `name_th`, `district_id`, `postal_code`) VALUES
(1, 'เวียง', 32, '57000'),
(2, 'รอบเวียง', 32, '57000'),
(3, 'สันทราย', 32, '57000'),
(4, 'ป่าอ้อดอนชัย', 32, '57000'),
(5, 'แม่กรณ์', 32, '57000'),
(6, 'ห้วยชมภู', 32, '57000'),
(7, 'ห้วยสัก', 32, '57000'),
(8, 'ดอยลาน', 32, '57000'),
(9, 'ท่าสาย', 32, '57000'),
(10, 'บ้านดู่', 32, '57100'),
(11, 'นางแล', 32, '57100'),
(12, 'ริมกก', 32, '57100'),
(13, 'แม่ข้าวต้ม', 32, '57100'),
(14, 'แม่ยาว', 32, '57100'),
(15, 'ท่าสุด', 32, '57100'),
(16, 'ดอยฮาง', 32, '57000');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_admin_username` (`username`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `contact`
--
ALTER TABLE `contact`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_customers_subdistrict` (`subdistrict_id`),
  ADD KEY `fk_customers_district` (`district_id`),
  ADD KEY `fk_customers_province` (`province_id`);

--
-- Indexes for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ca_customer` (`customer_id`,`is_default`),
  ADD KEY `idx_ca_province` (`province_id`),
  ADD KEY `idx_ca_district` (`district_id`),
  ADD KEY `idx_ca_subdistrict` (`subdistrict_id`);

--
-- Indexes for table `custom_orders`
--
ALTER TABLE `custom_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_custom_orders_code` (`custom_code`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `fk_custom_orders_province` (`province_id`),
  ADD KEY `fk_custom_orders_district` (`district_id`),
  ADD KEY `fk_custom_orders_subdistrict` (`subdistrict_id`);

--
-- Indexes for table `custom_order_files`
--
ALTER TABLE `custom_order_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cof_order` (`order_id`);

--
-- Indexes for table `custom_order_payments`
--
ALTER TABLE `custom_order_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cop_order` (`custom_order_id`),
  ADD KEY `idx_cop_customer` (`customer_id`);

--
-- Indexes for table `custom_order_status_logs`
--
ALTER TABLE `custom_order_status_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `districts`
--
ALTER TABLE `districts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_districts_province_id` (`province_id`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customer_id` (`customer_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `inbox`
--
ALTER TABLE `inbox`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  ADD PRIMARY KEY (`index`);

--
-- Indexes for table `ledger_entries`
--
ALTER TABLE `ledger_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ledger_date` (`entry_date`),
  ADD KEY `idx_ledger_type` (`type`),
  ADD KEY `idx_ledger_source` (`source`);

--
-- Indexes for table `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_customer` (`customer_id`,`is_read`,`created_at`),
  ADD KEY `idx_notifications_customer_time` (`customer_id`,`created_at`),
  ADD KEY `idx_notifications_customer_created` (`customer_id`,`created_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_orders_order_code` (`order_code`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `fk_orders_address` (`address_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order_id` (`order_id`),
  ADD KEY `idx_order_items_product_id` (`product_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `idx_payments_status_created` (`status`,`created_at`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_code` (`product_code`),
  ADD KEY `fk_category` (`category_id`);

--
-- Indexes for table `product_colors`
--
ALTER TABLE `product_colors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_color` (`product_id`,`color_name`);

--
-- Indexes for table `product_ratings`
--
ALTER TABLE `product_ratings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_rating` (`customer_id`,`product_id`);

--
-- Indexes for table `provinces`
--
ALTER TABLE `provinces`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seq_custom_orders_daily`
--
ALTER TABLE `seq_custom_orders_daily`
  ADD PRIMARY KEY (`seq_date`);

--
-- Indexes for table `seq_orders_daily`
--
ALTER TABLE `seq_orders_daily`
  ADD PRIMARY KEY (`seq_date`);

--
-- Indexes for table `shipping_rates`
--
ALTER TABLE `shipping_rates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_specific` (`district_id`,`subdistrict_id`);

--
-- Indexes for table `subdistricts`
--
ALTER TABLE `subdistricts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subdistricts_district_id` (`district_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `custom_orders`
--
ALTER TABLE `custom_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `custom_order_files`
--
ALTER TABLE `custom_order_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `custom_order_payments`
--
ALTER TABLE `custom_order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `custom_order_status_logs`
--
ALTER TABLE `custom_order_status_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inbox`
--
ALTER TABLE `inbox`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  MODIFY `index` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ledger_entries`
--
ALTER TABLE `ledger_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=112;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_colors`
--
ALTER TABLE `product_colors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_ratings`
--
ALTER TABLE `product_ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `provinces`
--
ALTER TABLE `provinces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `shipping_rates`
--
ALTER TABLE `shipping_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `subdistricts`
--
ALTER TABLE `subdistricts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `fk_customers_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_customers_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_customers_subdistrict` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD CONSTRAINT `fk_ca_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ca_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ca_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ca_subdistrict` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `custom_orders`
--
ALTER TABLE `custom_orders`
  ADD CONSTRAINT `fk_custom_orders_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_custom_orders_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_custom_orders_subdistrict` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `custom_order_files`
--
ALTER TABLE `custom_order_files`
  ADD CONSTRAINT `fk_cof_order` FOREIGN KEY (`order_id`) REFERENCES `custom_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `custom_order_payments`
--
ALTER TABLE `custom_order_payments`
  ADD CONSTRAINT `fk_cop_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cop_order` FOREIGN KEY (`custom_order_id`) REFERENCES `custom_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `districts`
--
ALTER TABLE `districts`
  ADD CONSTRAINT `fk_districts_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_address` FOREIGN KEY (`address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE SET NULL;

--
-- Constraints for table `product_colors`
--
ALTER TABLE `product_colors`
  ADD CONSTRAINT `fk_product_colors_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subdistricts`
--
ALTER TABLE `subdistricts`
  ADD CONSTRAINT `fk_subdistricts_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
