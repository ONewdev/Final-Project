-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 17, 2025 at 10:54 PM
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
(1, 'admin', 'admin'),
(2, 'admin2', '123456');

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `category_name`, `image_url`, `status`) VALUES
(1, 'หน้าต่างบานเลื่อน2', '1757304916356-59572597.jpg', 1),
(2, 'หน้าต่างบานเลื่อน4', '1757304924416-731225313.jpg', 1),
(3, 'ประตูบานเลื่อน2', '1757408292376-230615221.png', 1),
(4, 'ประตูบานเลื่อน4', '1757408299243-532662444.png', 1),
(5, 'ประตูสวิง', '1757511778205-871029258.png', 1),
(6, 'ประตูรางแขวน', '1757511939500-350086640.png', 1),
(7, 'ประตูมุ้ง', NULL, 1),
(8, 'บานเฟี้ยม', '1757513143502-401520915.jpg', 1),
(9, 'บานปิดตาย', '1757513022013-801861416.png', 1),
(10, 'บานกระทุ้ง', '1757513130994-432737618.png', 1),
(11, 'ชาวเวอร์', NULL, 1),
(12, 'ตู้เฟอร์นิเจอร์', NULL, 1),
(13, 'หน้าต่างมุ้ง', NULL, 1);

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
('Aluglaue Pro', '099-999-9998', 'A&G@gmail.com', 'https://www.google.com/maps/embed?pb=!4v1752974298441!6m8!1m7!1s8mYw-Ou6n1GQUv1RwTxmsQ!2m2!1d20.36825582310125!2d99.87733385345288!3f247.06!4f-8.099999999999994!5f0.7820865974627469', '168/ 23', '08:00 - 16:00 น.', '', '/uploads/contact/1759468999815-645885040.png', '0000000', '10000000', 'test', 1, 1);

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
  `last_seen_notifications_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `email`, `password`, `name`, `created_at`, `updated_at`, `status`, `profile_picture`, `is_verified`, `verification_token`, `reset_token`, `reset_token_expires`, `phone`, `address`, `last_seen_notifications_at`) VALUES
(2, 'test@gmail.com', '$2b$10$8z.xBLdlYfFzT1dHhVR9uetRP6ilSTBj5KuMliRjS9fCcwX6UC2W2', 'tess', '2025-06-21 09:12:09', '2025-10-16 16:48:00', 'active', '/uploads/profiles/1759885394899-327957077.jpg', 0, NULL, NULL, NULL, '099-999-9999', '11/1', '2025-10-16 23:48:00'),
(6, 'test2@gmail.com', '$2b$10$VvPYgDUQj1Dq.7dAhweMzOjtG/6YDokkquER3BymR1vktiu1g5iyK', 'test2', '2025-08-04 02:19:49', '2025-09-10 14:58:55', 'active', '/uploads/profiles/1757516334534-299931082.png', 0, NULL, NULL, NULL, '099-999-9999', '12/1', NULL),
(7, 'test3@gmail.com', '$2b$10$yDk6tDhEyRGJ3HQKb2JDmOTke0cioR979POqOkrkBeR7mWqVtiCum', 'test3', '2025-09-04 10:57:26', '2025-09-05 14:23:52', 'active', '/uploads/profiles/1756983671988-205085063.png', 0, NULL, NULL, NULL, '011-111-1111', '21/2', NULL),
(26, 'koy40199@gmail.com', '$2b$10$C6i445fzg02VSOg9c6TZoO/GxT3h2eqJrESB4BMFzTHYwlhdCn9XG', 'nkk', '2025-10-15 17:02:04', '2025-10-15 17:03:26', 'active', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL);

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
(2, 2, 'บ้าน', 'test', '099-999-9999', '11/1', '57130', 570103, 5701, 40, 1, '2025-09-27 22:22:15', '2025-10-08 08:02:06'),
(3, 2, 'บ้าน', 'test', '099-999-9999', '11/2', '57100', NULL, NULL, 40, 0, '2025-09-29 15:52:51', '2025-10-07 23:55:16'),
(4, 2, 'บ้าน', 'tess', '099-999-9999', '11/', '57000', 571201, 5712, 40, 0, '2025-10-08 11:14:38', '2025-10-08 11:14:38');

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
(1, 'OC#20251016-0001', 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'เงิน', 2, NULL, 1, 0, '', 'มาตรฐาน', '0.000', '0.000', 7000, 'delivery', '250.00', '-\nปอ, เวียงแก่น, เชียงราย,', '-', 40, 5711, 571102, NULL, 'paid', '2025-10-16 14:19:30', '2025-10-16 15:58:13'),
(7, 'OC#20251016-27725-24', 2, '1', 'window', '100.00', '120.00', 'cm', '', 1, NULL, 0, 0, '', '', '0.000', '0.000', 5000, 'pickup', '0.00', 'รับหน้าร้าน', NULL, NULL, NULL, NULL, NULL, 'pending', '2025-10-16 22:53:47', '2025-10-16 22:53:47'),
(8, 'OC#20251016-10934-90', 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'เงิน', 1, NULL, 1, 0, '', 'มาตรฐาน', '0.000', '0.000', 3500, 'pickup', '0.00', 'รับหน้าร้าน', NULL, NULL, NULL, NULL, NULL, 'pending', '2025-10-16 22:58:30', '2025-10-16 22:58:30');

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
(1, 1, 2, '7000.00', '/uploads/custom_payments/order_1_1760601013906.jpg', 'approved', NULL, '2025-10-16 14:50:13', '2025-10-16 15:58:13', NULL, NULL);

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
(1, 1, 'pending', 'waiting_payment', '2025-10-16 14:45:06'),
(2, 1, 'waiting_payment', 'paid', '2025-10-16 15:58:13');

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
(5701, 'เมืองเชียงราย', 40),
(5702, 'เชียงของ', 40),
(5703, 'เชียงแสน', 40),
(5704, 'แม่จัน', 40),
(5705, 'แม่สาย', 40),
(5706, 'แม่สรวย', 40),
(5707, 'เวียงป่าเป้า', 40),
(5708, 'พาน', 40),
(5709, 'ป่าแดด', 40),
(5710, 'เทิง', 40),
(5711, 'เวียงแก่น', 40),
(5712, 'ขุนตาล', 40),
(5713, 'แม่ฟ้าหลวง', 40),
(5714, 'แม่ลาว', 40),
(5715, 'เวียงเชียงรุ้ง', 40),
(5716, 'ดอยหลวง', 40),
(5717, 'เวียงชัย', 40),
(5718, 'พญาเม็งราย', 40);

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
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `ledger_entries`
--

INSERT INTO `ledger_entries` (`id`, `entry_date`, `type`, `source`, `ref_no`, `code`, `name`, `qty`, `unit_price`, `description`, `amount`, `created_at`, `updated_at`) VALUES
(6, '2025-10-02', 'income', 'store', '10000', 'MAT001', 'เสากุญแจ', '1.00', '600.00', '-', '6.00', '2025-10-02 16:07:20', '2025-10-02 16:07:20'),
(7, '2025-10-03', 'income', 'store', '10000', 'MAT001', 'เสากุญแจ', '1.00', '600.00', '-', '6.00', '2025-10-03 12:34:11', '2025-10-03 12:34:11'),
(8, '2025-10-03', 'expense', 'store', '10000', 'SCR-GR-120x180-0005', 'หน้าต่างมุ้งสีอบขาว', '1.00', '250.00', 'ซื้อเพิ่ม', '-250.00', '2025-10-03 14:29:23', '2025-10-03 14:29:23'),
(9, '2025-10-03', 'expense', 'store', '10000', 'MAT001', 'เสากุญแจ', '1.00', '600.00', 'ซื้อเพิ่ม', '-600.00', '2025-10-03 15:02:49', '2025-10-03 15:02:49'),
(10, '2025-10-03', 'expense', 'store', '10000', 'SCR-GR-120x180-0005', 'หน้าต่างมุ้งสีอบขาว', '1.00', '600.00', 'ซื้อเพิ่ม', '-600.00', '2025-10-03 15:47:06', '2025-10-03 15:47:06'),
(11, '2025-10-07', 'expense', 'store', '10000', 'MAT002', 'เสาเกี่ยว', '1.00', '1300.00', 'ซื้อเพิ่ม', '-1300.00', '2025-10-07 11:52:25', '2025-10-07 11:52:25'),
(12, '2025-10-08', 'expense', 'store', '10000', 'MAT018', 'ชนกลางมุ้งบานเลื่อน', '1.00', '2000.00', 'ซื้อเพิ่ม', '-2000.00', '2025-10-08 10:43:03', '2025-10-08 10:43:03'),
(13, '2025-10-08', 'income', 'store', '10000', 'SCR-GR-120x180-0005', 'หน้าต่างมุ้งสีอบขาว', '1.00', '250.00', 'ขาย', '250.00', '2025-10-08 10:59:32', '2025-10-08 10:59:32'),
(14, '2025-10-08', 'expense', 'store', '10000', 'MAT005', 'ขวางล่าง', '1.00', '2000.00', 'ซื้อเพิ่ม', '-2000.00', '2025-10-08 11:00:34', '2025-10-08 11:00:34'),
(15, '2025-10-15', 'expense', 'store', '1000', 'MAT001', 'เสากุญแจ', '1.00', '250.00', 'ซื้อเพิ่ม', '-250.00', '2025-10-15 16:19:46', '2025-10-15 16:19:46'),
(16, '2025-10-15', 'income', 'store', '1000', 'SLD-2P-BK-SCR-0001', 'ประตูบานเลื่อน แบ่ง2 สีดำ', '1.00', '4500.00', 'ขายได้', '4500.00', '2025-10-15 17:31:06', '2025-10-15 17:31:06'),
(17, '2025-10-15', 'income', 'store', '1000', 'WIN-WH-120x180-0001', 'หน้าต่างอลูมิเนียมสีอบขาว', '1.00', '3000.00', '-', '3000.00', '2025-10-15 17:31:06', '2025-10-15 17:31:06'),
(18, '2025-10-15', 'expense', 'store', '1000', 'MAT002', 'เสาเกี่ยว', '1.00', '250.00', 'ซื้อเพิ่ม', '-250.00', '2025-10-15 17:42:00', '2025-10-15 17:42:00'),
(19, '2025-10-15', 'expense', 'store', '1000', 'MAT003', 'เสาตาย', '1.00', '500.00', 'ซื้อเพิ่ม', '-500.00', '2025-10-15 17:42:00', '2025-10-15 17:42:00'),
(20, '2025-10-16', 'income', 'store', '10000', 'PD-0001', 'หน้าต่างมุ้งสีอบขาว', '2.00', '250.00', 'ขายได้', '500.00', '2025-10-16 17:57:20', '2025-10-16 17:57:20'),
(21, '2025-10-16', 'expense', 'store', '10000', 'MAT001', 'เสากุญแจ', '2.00', '200.00', '-', '-400.00', '2025-10-16 17:57:20', '2025-10-16 17:57:20');

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `materials`
--

INSERT INTO `materials` (`id`, `code`, `name`, `status`, `created_at`) VALUES
(1, 'MAT001', 'เสากุญแจ', 1, '2025-08-23 07:03:27'),
(2, 'MAT002', 'เสาเกี่ยว', 1, '2025-08-23 07:05:07'),
(3, 'MAT003', 'เสาตาย', 1, '2025-08-24 22:37:36'),
(10, 'MAT004', 'ขวางบน', 1, '2025-08-25 00:02:39'),
(11, 'MAT005', 'ขวางล่าง', 1, '2025-08-25 00:19:41'),
(12, 'MAT006', 'เฟรมข้างติดกล่อง', 1, '2025-08-25 00:26:07'),
(13, 'MAT007', 'เฟรมบนติดกล่อง', 1, '2025-08-25 00:27:42'),
(14, 'MAT008', 'เฟรมล่างติดกล่อง', 1, '2025-08-25 00:31:32'),
(15, 'MAT009', 'ขวางบนสวิง', 1, '2025-08-25 00:35:48'),
(16, 'MAT010', 'ขวางล่างสวิง', 1, '2025-08-25 01:06:03'),
(17, 'MAT011', 'เสาขวางสวิง', 1, '2025-08-25 01:07:28'),
(18, 'MAT012', 'รางแขวนใหญ่', 1, '2025-08-25 01:08:14'),
(19, 'MAT013', 'ฝาปิด', 1, '2025-08-25 01:10:27'),
(20, 'MAT014', 'ธรณีสวิง', 1, '2025-08-25 01:10:59'),
(21, 'MAT015', 'ตบเรียบ', 1, '2025-08-25 01:11:27'),
(22, 'MAT016', 'ตบร่อง', 1, '2025-08-25 01:11:52'),
(23, 'MAT017', 'ตบธรณี', 1, '2025-08-25 01:12:26'),
(24, 'MAT018', 'ชนกลางมุ้งบานเลื่อน', 1, '2025-08-25 01:13:03'),
(25, 'MAT019', 'ชนกลางบานเลื่อน', 1, '2025-08-25 01:13:32'),
(26, 'MAT020', 'คิ้วประตูสวิง', 1, '2025-08-25 01:14:00'),
(27, 'MAT021', 'คิ้วเทใหญ่', 1, '2025-08-25 01:14:26'),
(28, 'MAT022', 'คิ้วเทเล็ก', 1, '2025-08-25 01:14:50'),
(29, 'MAT023', 'กล่องเรียบ', 1, '2025-08-25 01:15:14'),
(30, 'MAT024', 'กล่องร่อง', 1, '2025-08-25 01:15:41'),
(31, 'MAT025', 'กล่องเปิด', 1, '2025-08-25 01:16:12'),
(32, 'MAT026', 'กรอบมุ้งบานเลื่อน', 1, '2025-08-25 01:16:33'),
(33, 'MAT027', 'กรอบบานกระทุ้ง', 1, '2025-08-25 01:16:52'),
(34, 'MAT028', 'กรอบนอกกระทุ้ง-แบบยูเนี่ยน', 1, '2025-08-25 01:17:11'),
(35, 'OIL001', 'ค่าน้ำมัน', 1, '2025-10-02 07:09:21');

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
(4, 1, 2, '...', '2025-09-23 05:43:48'),
(5, 2, 1, '123456', '2025-10-03 08:27:44'),
(6, 1, 2, 'ะะะ', '2025-10-08 03:14:18'),
(7, 1, 2, 'Hi', '2025-10-08 04:24:45'),
(8, 1, 2, '....', '2025-10-08 04:25:19'),
(9, 1, 2, '1', '2025-10-08 04:25:26'),
(10, 1, 2, '2', '2025-10-08 04:25:26'),
(11, 1, 2, '3', '2025-10-08 04:25:28'),
(12, 2, 1, '2', '2025-10-08 04:25:51'),
(13, 2, 1, '3', '2025-10-08 04:25:52'),
(14, 2, 1, '4', '2025-10-08 04:25:58'),
(15, 1, 2, 'ไง', '2025-10-15 09:53:58'),
(16, 2, 1, '....', '2025-10-15 09:54:10'),
(17, 1, 2, 'สวัสดีครับ', '2025-10-15 10:07:16'),
(18, 2, 1, 'ครับ', '2025-10-15 10:07:23'),
(19, 2, 1, '000', '2025-10-15 10:21:12'),
(20, 2, 1, '111', '2025-10-15 18:46:58'),
(21, 2, 1, '..', '2025-10-15 18:47:17'),
(22, 1, 2, '....', '2025-10-15 18:51:14'),
(23, 1, 2, '...', '2025-10-15 18:51:53'),
(24, 1, 2, '111', '2025-10-16 06:39:09'),
(25, 2, 1, 'สวสัสดี', '2025-10-16 11:05:08'),
(26, 2, 1, '1111', '2025-10-16 16:06:47'),
(27, 2, 1, '222', '2025-10-16 16:11:48'),
(28, 2, 1, '12', '2025-10-16 16:17:00'),
(29, 1, 2, '...', '2025-10-17 15:01:08'),
(30, 2, 1, '222', '2025-10-17 15:01:22'),
(31, 2, 1, '...', '2025-10-17 15:01:31'),
(32, 1, 2, '....', '2025-10-17 15:01:43'),
(33, 1, 2, '...', '2025-10-17 15:01:50');

-- --------------------------------------------------------

--
-- Table structure for table `message_read_state`
--

CREATE TABLE `message_read_state` (
  `id` int(10) UNSIGNED NOT NULL,
  `reader_id` int(11) NOT NULL,
  `peer_id` int(11) NOT NULL,
  `last_read_message_id` int(11) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `message_read_state`
--

INSERT INTO `message_read_state` (`id`, `reader_id`, `peer_id`, `last_read_message_id`, `updated_at`) VALUES
(1, 2, 1, 33, '2025-10-17 15:01:54');

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
(1, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'คำสั่งซื้อ #1 ถูกสร้างเรียบร้อยแล้ว', '2025-10-16 14:17:59', 0, NULL),
(2, 2, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #1 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-10-16 14:39:22', 0, NULL),
(3, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0001 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-10-16 14:42:55', 0, NULL),
(4, 2, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #1 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-10-16 14:43:14', 0, NULL),
(5, 2, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #1 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-10-16 14:43:35', 0, NULL),
(6, 2, 'success', 'จัดส่งสำเร็จ', 'คำสั่งซื้อ #1 ของคุณถูกจัดส่งสำเร็จแล้ว', '2025-10-16 14:43:55', 0, NULL),
(7, 2, 'info', 'กรุณาชำระเงิน', 'ออเดอร์ #1 ได้รับการอนุมัติ กรุณาชำระเงินเพื่อดำเนินการต่อ', '2025-10-16 14:45:06', 0, NULL),
(8, 2, 'info', 'แจ้งชำระเงินแล้ว', 'ออเดอร์ #1 ส่งหลักฐานการชำระเงินแล้ว รอแอดมินตรวจสอบ', '2025-10-16 14:50:13', 0, NULL),
(9, 2, 'success', 'ชำระเงินสำเร็จ', 'ออเดอร์ #1 ได้รับการยืนยันการชำระเงินแล้ว', '2025-10-16 15:58:13', 0, NULL),
(10, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'คำสั่งซื้อ #2 ถูกสร้างเรียบร้อยแล้ว', '2025-10-16 16:40:39', 0, NULL),
(11, 2, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #2 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-10-16 16:40:50', 0, NULL),
(12, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0002 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-10-16 16:42:06', 0, NULL),
(13, 2, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #2 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-10-16 16:42:31', 0, NULL),
(14, 2, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #2 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-10-16 16:42:55', 0, NULL),
(15, 2, 'success', 'จัดส่งสำเร็จ', 'คำสั่งซื้อ #2 ของคุณถูกจัดส่งสำเร็จแล้ว', '2025-10-16 16:43:10', 0, NULL),
(16, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'คำสั่งซื้อ #3 ถูกสร้างเรียบร้อยแล้ว', '2025-10-16 16:46:15', 0, NULL),
(17, 2, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #3 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-10-16 16:46:33', 0, NULL),
(18, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0003 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-10-16 16:53:18', 0, NULL),
(19, 2, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #3 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-10-16 16:53:23', 0, NULL),
(20, 2, 'info', 'คำสั่งซื้อถูกจัดส่งแล้ว', 'คำสั่งซื้อ #3 ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง', '2025-10-16 16:53:35', 0, NULL),
(21, 2, 'success', 'จัดส่งสำเร็จ', 'คำสั่งซื้อ #3 ของคุณถูกจัดส่งสำเร็จแล้ว', '2025-10-16 17:03:20', 0, NULL),
(22, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'คำสั่งซื้อ #4 ถูกสร้างเรียบร้อยแล้ว', '2025-10-16 18:01:28', 0, NULL),
(23, 2, 'success', 'คำสั่งซื้อได้รับการอนุมัติ', 'คำสั่งซื้อ #4 ของคุณได้รับการอนุมัติแล้ว', '2025-10-16 18:01:56', 0, NULL),
(24, 2, 'warning', 'คำสั่งซื้อถูกยกเลิก', 'คำสั่งซื้อ #4 ถูกยกเลิกแล้ว และคืนสินค้าเข้าสต็อก', '2025-10-16 18:02:11', 0, NULL),
(25, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'คำสั่งซื้อ #5 ถูกสร้างเรียบร้อยแล้ว', '2025-10-16 18:02:29', 0, NULL),
(26, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'คำสั่งซื้อ #6 ถูกสร้างเรียบร้อยแล้ว', '2025-10-16 23:05:02', 0, NULL),
(27, 2, 'info', 'กำลังเตรียมสินค้า', 'คำสั่งซื้อ #6 ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง', '2025-10-16 23:05:30', 0, NULL),
(28, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0006 ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง', '2025-10-16 23:05:59', 0, NULL);

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
(1, 'OR#20251016-0000', 2, 2, '250.00', '0.00', 'standard', 'delivered', '2025-10-16 07:17:59', '11/1\nบ้านดู่, เมืองเชียงราย, เชียงราย, 57130', '099-999-9999', '2025-10-16 14:42:54', '2025-10-16 14:43:34', '2025-10-16 14:43:55', NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', '2025-10-16 14:43:14'),
(2, 'OR#20251016-0001', 2, 2, '3500.00', '0.00', 'standard', 'delivered', '2025-10-16 09:40:38', '11/1\nบ้านดู่, เมืองเชียงราย, เชียงราย, 57130', '099-999-9999', '2025-10-16 16:42:06', '2025-10-16 16:42:54', '2025-10-16 16:43:10', NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างอลูมิเนียมสีชา\"}]', '2025-10-16 16:42:30'),
(3, 'OR#20251016-0002', 2, 4, '3500.00', '0.00', 'standard', 'delivered', '2025-10-16 09:46:14', '11/\nต้า, ขุนตาล, เชียงราย, 57000', '099-999-9999', '2025-10-16 16:53:17', '2025-10-16 16:53:34', '2025-10-16 17:03:19', NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างอลูมิเนียมสีชา\"}]', '2025-10-16 16:53:22'),
(4, 'OR#20251016-0003', 2, 2, '250.00', '0.00', 'standard', 'cancelled', '2025-10-16 11:01:28', '11/1\nบ้านดู่, เมืองเชียงราย, เชียงราย, 57130', '099-999-9999', '2025-10-16 18:01:55', NULL, NULL, '2025-10-16 18:02:10', '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', NULL),
(5, 'OR#20251016-0004', 2, 2, '250.00', '0.00', 'standard', 'pending', '2025-10-16 11:02:28', '11/1\nบ้านดู่, เมืองเชียงราย, เชียงราย, 57130', '099-999-9999', NULL, NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างมุ้งสีอบขาว\"}]', NULL),
(6, 'OR#20251016-0005', 2, 2, '3000.00', '0.00', 'standard', 'approved', '2025-10-16 16:05:02', '11/1\nบ้านดู่, เมืองเชียงราย, เชียงราย, 57130', '099-999-9999', '2025-10-16 23:05:58', NULL, NULL, NULL, '[{\"product_qty\": 1, \"product_name\": \"หน้าต่างอลูมิเนียมสีอบขาว\"}]', '2025-10-16 23:05:30');

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
(1, 1, 9, 1, '250.00'),
(2, 2, 15, 1, '3500.00'),
(3, 3, 15, 1, '3500.00'),
(4, 4, 9, 1, '250.00'),
(5, 5, 9, 1, '250.00'),
(6, 6, 10, 1, '3000.00');

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
(1, 2, 1, 'dd3ed9f5cb07184a68249115aa327242', '250.00', 'approved', '2025-10-16 07:39:22'),
(2, 2, 2, '1b8c67167d16996cdc2dbc5f7c100cd3', '3500.00', 'approved', '2025-10-16 09:40:49'),
(3, 2, 3, '762799303128a1e2b73f7a3dc1118d70', '3500.00', 'approved', '2025-10-16 09:46:32'),
(4, 2, 6, '1760630729990-547793132.jpg', '3000.00', 'approved', '2025-10-16 16:05:30');

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
(9, 'หน้าต่างมุ้งสีอบขาว', 'หน้าต่างมุ้งธรรมดา 1 บาน ', 13, '250.00', 8, '/uploads/products/1760547121054-967233607.png', 'active', '2025-10-15 16:52:01', '2025-10-16 11:02:28', 'PD-0001', 'อบขาว', '80*120 cm'),
(10, 'หน้าต่างอลูมิเนียมสีอบขาว', 'มีหน้าต่างให้ 2 บาน พร้อมวงกบ', 1, '3000.00', 9, '/uploads/products/1760547253263-203367445.jpg', 'active', '2025-10-15 16:54:13', '2025-10-16 16:05:02', 'PD-0002', 'อบขาว', '80*120 cm'),
(11, 'หน้าต่างอลูมิเนียมสีดำ', 'หน้าต่าง 2 บาน + มุ้ง 1 บาน', 1, '3800.00', 10, '/uploads/products/1760551450567-332308310.jpg', 'active', '2025-10-15 18:04:10', '2025-10-15 18:04:10', 'PD-0003', 'ดำ', '80*120 cm'),
(12, 'หน้าต่างบานกระทุ้ง', 'เป็นบานพับ + มีวงกบ', 10, '800.00', 10, '/uploads/products/1760551923547-98254861.jpg', 'active', '2025-10-15 18:12:03', '2025-10-15 18:12:03', 'PD-0004', 'ดำ', '60*100'),
(13, 'ประตูบานเลื่อน แบ่ง2 สีดำ', 'บานประตู + มุ้ง', 3, '7000.00', 9, '/uploads/products/1760552016145-28535791.jpg', 'active', '2025-10-15 18:13:36', '2025-10-15 18:23:06', 'PD-0005', 'ดำ', '120*240'),
(14, 'ประตูรางแขวน สีดำ', 'มีบานขนาดกว้าง + ทนทาน', 6, '8000.00', 10, '/uploads/products/1760552117144-506695483.jpg', 'active', '2025-10-15 18:15:17', '2025-10-15 18:15:17', 'PD-0006', 'ดำ', '120*240'),
(15, 'หน้าต่างอลูมิเนียมสีชา', 'หน้าต่าง 2 บาน + มุ้ง 1 บาน', 1, '3500.00', 8, '/uploads/products/1760552183073-171157328.jpg', 'inactive', '2025-10-15 18:16:23', '2025-10-16 11:00:02', 'PD-0007', 'ชา', '80*120 cm'),
(16, 'หน้าต่างอลูมิเนียมสีชา แบ่ง4', 'บานเลื่อน 2 บาน\r\nบานตาย 2 บาน\r\nบานมุ้ง 2 บาน', 2, '4500.00', 10, '/uploads/products/1760552341474-331386487.jpg', 'active', '2025-10-15 18:19:01', '2025-10-15 18:19:01', 'PD-0008', 'ชา', '120*180'),
(17, 'ประตูสวิง สีดำ', 'ประตู + วงกบ + สวิง ', 5, '8500.00', 10, '/uploads/products/1760552453009-478781699.jpg', 'active', '2025-10-15 18:20:53', '2025-10-15 18:20:53', 'PD-0009', 'ดำ', '120*240');

-- --------------------------------------------------------

--
-- Table structure for table `product_colors`
--

CREATE TABLE `product_colors` (
  `id` int(11) NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
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
(8, 25, 2, 5, '2025-09-29 13:02:19', '2025-09-29 13:02:19'),
(9, 2, 4, 5, '2025-10-07 11:06:56', '2025-10-07 11:06:56'),
(10, 2, 5, 5, '2025-10-07 11:06:58', '2025-10-07 11:06:58'),
(11, 25, 3, 4, '2025-10-08 04:36:48', '2025-10-08 04:36:48'),
(12, 6, 1, 2, '2025-10-08 04:39:52', '2025-10-08 04:40:44'),
(13, 2, 9, 5, '2025-10-15 17:00:01', '2025-10-15 17:00:01'),
(14, 2, 10, 5, '2025-10-15 17:00:04', '2025-10-15 17:00:04');

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
(40, 'เชียงราย');

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
('2025-09-30', 0),
('2025-10-08', 1),
('2025-10-10', 0),
('2025-10-14', 0),
('2025-10-16', 2);

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
('2025-10-02', 0),
('2025-10-04', 0),
('2025-10-07', 0),
('2025-10-08', 6),
('2025-10-10', 0),
('2025-10-11', 2),
('2025-10-15', 0),
('2025-10-16', 5);

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
(54, 5705, 570505, '50.00', 1),
(55, 5705, 570501, '60.00', 1),
(56, 5705, 570506, '60.00', 1),
(57, 5705, 570507, '70.00', 1),
(58, 5705, 570509, '80.00', 1),
(59, 5705, 570504, '90.00', 1),
(60, 5705, 570502, '90.00', 1),
(61, 5705, 570503, '100.00', 1),
(62, 5701, 570101, '150.00', 1),
(63, 5701, 570102, '150.00', 1),
(64, 5701, 570103, '150.00', 1),
(65, 5701, 570104, '150.00', 1),
(66, 5701, 570105, '150.00', 1),
(67, 5701, 570106, '150.00', 1),
(68, 5701, 570107, '150.00', 1),
(69, 5701, 570108, '150.00', 1),
(70, 5701, 570112, '150.00', 1),
(71, 5701, 570113, '150.00', 1),
(72, 5701, 570114, '150.00', 1),
(73, 5701, 570115, '150.00', 1),
(74, 5701, 570116, '150.00', 1),
(75, 5701, 570117, '150.00', 1),
(76, 5701, 570118, '150.00', 1),
(77, 5701, 570120, '150.00', 1),
(78, 5702, 570201, '220.00', 1),
(79, 5702, 570202, '220.00', 1),
(80, 5702, 570203, '220.00', 1),
(81, 5702, 570204, '220.00', 1),
(82, 5702, 570205, '220.00', 1),
(83, 5702, 570208, '220.00', 1),
(84, 5702, 570210, '220.00', 1),
(85, 5703, 570301, '160.00', 1),
(86, 5703, 570302, '160.00', 1),
(87, 5703, 570303, '160.00', 1),
(88, 5703, 570304, '160.00', 1),
(89, 5703, 570305, '160.00', 1),
(90, 5703, 570306, '160.00', 1),
(91, 5704, 570401, '120.00', 1),
(92, 5704, 570402, '120.00', 1),
(93, 5704, 570403, '120.00', 1),
(94, 5704, 570404, '120.00', 1),
(95, 5704, 570405, '120.00', 1),
(96, 5704, 570406, '120.00', 1),
(97, 5704, 570408, '120.00', 1),
(98, 5704, 570409, '120.00', 1),
(99, 5704, 570410, '120.00', 1),
(100, 5704, 570411, '120.00', 1),
(101, 5704, 570412, '120.00', 1),
(102, 5706, 570601, '170.00', 1),
(103, 5706, 570602, '170.00', 1),
(104, 5706, 570603, '170.00', 1),
(105, 5706, 570604, '170.00', 1),
(106, 5706, 570605, '170.00', 1),
(107, 5706, 570606, '170.00', 1),
(108, 5706, 570607, '170.00', 1),
(109, 5707, 570701, '220.00', 1),
(110, 5707, 570703, '220.00', 1),
(111, 5707, 570704, '220.00', 1),
(112, 5707, 570705, '220.00', 1),
(113, 5707, 570706, '220.00', 1),
(114, 5707, 570708, '220.00', 1),
(115, 5707, 570709, '220.00', 1),
(116, 5708, 570801, '180.00', 1),
(117, 5708, 570802, '180.00', 1),
(118, 5708, 570803, '180.00', 1),
(119, 5708, 570804, '180.00', 1),
(120, 5708, 570805, '180.00', 1),
(121, 5708, 570806, '180.00', 1),
(122, 5708, 570807, '180.00', 1),
(123, 5708, 570808, '180.00', 1),
(124, 5708, 570809, '180.00', 1),
(125, 5708, 570811, '180.00', 1),
(126, 5708, 570812, '180.00', 1),
(127, 5708, 570813, '180.00', 1),
(128, 5708, 570814, '180.00', 1),
(129, 5708, 570815, '180.00', 1),
(130, 5708, 570816, '180.00', 1),
(131, 5709, 570901, '190.00', 1),
(132, 5709, 570902, '190.00', 1),
(133, 5709, 570903, '190.00', 1),
(134, 5709, 570904, '190.00', 1),
(135, 5709, 570905, '190.00', 1),
(136, 5710, 571001, '220.00', 1),
(137, 5710, 571002, '220.00', 1),
(138, 5710, 571003, '220.00', 1),
(139, 5710, 571004, '220.00', 1),
(140, 5710, 571005, '220.00', 1),
(141, 5710, 571006, '220.00', 1),
(142, 5710, 571009, '220.00', 1),
(143, 5710, 571010, '220.00', 1),
(144, 5710, 571013, '220.00', 1),
(145, 5710, 571015, '220.00', 1),
(146, 5711, 571101, '250.00', 1),
(147, 5711, 571102, '250.00', 0),
(148, 5711, 571103, '250.00', 1),
(149, 5711, 571104, '250.00', 1),
(150, 5712, 571201, '200.00', 1),
(151, 5712, 571202, '200.00', 1),
(152, 5712, 571203, '200.00', 1),
(153, 5713, 571301, '150.00', 1),
(154, 5713, 571302, '150.00', 1),
(155, 5713, 571303, '150.00', 1),
(156, 5713, 571304, '150.00', 1),
(157, 5714, 571401, '140.00', 1),
(158, 5714, 571402, '140.00', 1),
(159, 5714, 571403, '140.00', 1),
(160, 5714, 571404, '140.00', 1),
(161, 5714, 571405, '140.00', 1),
(162, 5715, 571501, '170.00', 1),
(163, 5715, 571502, '170.00', 1),
(164, 5715, 571503, '170.00', 1),
(165, 5716, 571601, '180.00', 1),
(166, 5716, 571602, '180.00', 1),
(167, 5716, 571603, '180.00', 1),
(168, 5717, 571701, '160.00', 1),
(169, 5717, 571702, '160.00', 1),
(170, 5717, 571703, '160.00', 1),
(171, 5717, 571704, '160.00', 1),
(172, 5717, 571705, '160.00', 1),
(173, 5718, 571801, '190.00', 1),
(174, 5718, 571802, '190.00', 1),
(175, 5718, 571803, '190.00', 1),
(176, 5718, 571804, '190.00', 1),
(177, 5718, 571805, '190.00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `subdistricts`
--

CREATE TABLE `subdistricts` (
  `id` int(11) NOT NULL,
  `name_th` varchar(150) NOT NULL,
  `district_id` int(11) NOT NULL,
  `postal_code` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `subdistricts`
--

INSERT INTO `subdistricts` (`id`, `name_th`, `district_id`, `postal_code`) VALUES
(570101, 'เวียง', 5701, NULL),
(570102, 'รอบเวียง', 5701, NULL),
(570103, 'บ้านดู่', 5701, NULL),
(570104, 'นางแล', 5701, NULL),
(570105, 'แม่ข้าวต้ม', 5701, NULL),
(570106, 'แม่ยาว', 5701, NULL),
(570107, 'สันทราย', 5701, NULL),
(570108, 'ท่าสาย', 5701, NULL),
(570112, 'ดอยลาน', 5701, NULL),
(570113, 'ห้วยชมภู', 5701, NULL),
(570114, 'ห้วยสัก', 5701, NULL),
(570115, 'ริมกก', 5701, NULL),
(570116, 'ดอยฮาง', 5701, NULL),
(570117, 'ป่าอ้อดอนชัย', 5701, NULL),
(570118, 'ท่าสุด', 5701, NULL),
(570120, 'แม่กรณ์', 5701, NULL),
(570201, 'เวียง', 5702, NULL),
(570202, 'สถาน', 5702, NULL),
(570203, 'ครึ่ง', 5702, NULL),
(570204, 'บุญเรือง', 5702, NULL),
(570205, 'ห้วยซ้อ', 5702, NULL),
(570208, 'ศรีดอนชัย', 5702, NULL),
(570210, 'ริมโขง', 5702, NULL),
(570301, 'เวียง', 5703, NULL),
(570302, 'ป่าสัก', 5703, NULL),
(570303, 'บ้านแซว', 5703, NULL),
(570304, 'ศรีดอนมูล', 5703, NULL),
(570305, 'แม่เงิน', 5703, NULL),
(570306, 'โยนก', 5703, NULL),
(570401, 'แม่จัน', 5704, NULL),
(570402, 'จันจว้า', 5704, NULL),
(570403, 'แม่คำ', 5704, NULL),
(570404, 'ป่าซาง', 5704, NULL),
(570405, 'สันทราย', 5704, NULL),
(570406, 'ท่าข้าวเปลือก', 5704, NULL),
(570408, 'ป่าตึง', 5704, NULL),
(570409, 'แม่ไร่', 5704, NULL),
(570410, 'ศรีค้ำ', 5704, NULL),
(570411, 'จันจว้าใต้', 5704, NULL),
(570412, 'จอมสวรรค์', 5704, NULL),
(570501, 'แม่สาย', 5705, NULL),
(570502, 'ห้วยไคร้', 5705, NULL),
(570503, 'เกาะช้าง', 5705, NULL),
(570504, 'โป่งงาม', 5705, NULL),
(570505, 'โป่งผา', 5705, NULL),
(570506, 'ศรีเมืองชุม', 5705, NULL),
(570507, 'เวียงพางคำ', 5705, NULL),
(570509, 'บ้านด้าย', 5705, NULL),
(570601, 'แม่สรวย', 5706, NULL),
(570602, 'ป่าแดด', 5706, NULL),
(570603, 'แม่พริก', 5706, NULL),
(570604, 'ศรีถ้อย', 5706, NULL),
(570605, 'ท่าก๊อ', 5706, NULL),
(570606, 'วาวี', 5706, NULL),
(570607, 'เจดีย์หลวง', 5706, NULL),
(570701, 'เวียง', 5707, NULL),
(570703, 'แม่เจดีย์', 5707, NULL),
(570704, 'สันสลี', 5707, NULL),
(570705, 'บ้านโป่ง', 5707, NULL),
(570706, 'ป่างิ้ว', 5707, NULL),
(570708, 'แม่เจดีย์ใหม่', 5707, NULL),
(570709, 'แม่วิน', 5707, NULL),
(570801, 'เมืองพาน', 5708, NULL),
(570802, 'ธารทอง', 5708, NULL),
(570803, 'แดนเมือง', 5708, NULL),
(570804, 'ทรายขาว', 5708, NULL),
(570805, 'สันมะเค็ด', 5708, NULL),
(570806, 'แม่อ้อ', 5708, NULL),
(570807, 'ทานตะวัน', 5708, NULL),
(570808, 'ม่วงคำ', 5708, NULL),
(570809, 'ป่าหุ่ง', 5708, NULL),
(570811, 'หัวง้ม', 5708, NULL),
(570812, 'เจริญเมือง', 5708, NULL),
(570813, 'ป่าแดด', 5708, NULL),
(570814, 'สันกลาง', 5708, NULL),
(570815, 'สันติสุข', 5708, NULL),
(570816, 'ดอยงาม', 5708, NULL),
(570901, 'ป่าแดด', 5709, NULL),
(570902, 'ป่าแงะ', 5709, NULL),
(570903, 'สันมะค่า', 5709, NULL),
(570904, 'โรงช้าง', 5709, NULL),
(570905, 'บ้านเหล่า', 5709, NULL),
(571001, 'เวียง', 5710, NULL),
(571002, 'งิ้ว', 5710, NULL),
(571003, 'ปล้อง', 5710, NULL),
(571004, 'แม่ลอย', 5710, NULL),
(571005, 'เชียงเคี่ยน', 5710, NULL),
(571006, 'ต้า', 5710, NULL),
(571009, 'หงาว', 5710, NULL),
(571010, 'สันทรายงาม', 5710, NULL),
(571013, 'ศรีดอนไชย', 5710, NULL),
(571015, 'หนองแรด', 5710, NULL),
(571101, 'ม่วงยาย', 5711, NULL),
(571102, 'ปอ', 5711, NULL),
(571103, 'หล่ายงาว', 5711, NULL),
(571104, 'ท่าข้าม', 5711, NULL),
(571201, 'ต้า', 5712, NULL),
(571202, 'ป่าตาล', 5712, NULL),
(571203, 'ยางฮอม', 5712, NULL),
(571301, 'เทอดไทย', 5713, NULL),
(571302, 'แม่สลองใน', 5713, NULL),
(571303, 'แม่สลองนอก', 5713, NULL),
(571304, 'แม่ฟ้าหลวง', 5713, NULL),
(571401, 'ดงมะดะ', 5714, NULL),
(571402, 'จอมหมอกแก้ว', 5714, NULL),
(571403, 'บัวสลี', 5714, NULL),
(571404, 'ป่าก่อดำ', 5714, NULL),
(571405, 'โป่งแพร่', 5714, NULL),
(571501, 'ทุ่งก่อ', 5715, NULL),
(571502, 'ดงมหาวัน', 5715, NULL),
(571503, 'ป่าซาง', 5715, NULL),
(571601, 'ปงน้อย', 5716, NULL),
(571602, 'โชคชัย', 5716, NULL),
(571603, 'หนองป่าก่อ', 5716, NULL),
(571701, 'เวียงชัย', 5717, NULL),
(571702, 'ผางาม', 5717, NULL),
(571703, 'เวียงเหนือ', 5717, NULL),
(571704, 'ดอนศิลา', 5717, NULL),
(571705, 'เมืองชุม', 5717, NULL),
(571801, 'แม่เปา', 5718, NULL),
(571802, 'ไม้ยา', 5718, NULL),
(571803, 'แม่ต๋ำ', 5718, NULL),
(571804, 'ตาดควัน', 5718, NULL),
(571805, 'เม็งราย', 5718, NULL);

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
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`);

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
  ADD UNIQUE KEY `email` (`email`);

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
-- Indexes for table `message_read_state`
--
ALTER TABLE `message_read_state`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `message_read_state_reader_id_peer_id_unique` (`reader_id`,`peer_id`),
  ADD KEY `message_read_state_reader_id_peer_id_index` (`reader_id`,`peer_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `custom_orders`
--
ALTER TABLE `custom_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `custom_order_files`
--
ALTER TABLE `custom_order_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `custom_order_payments`
--
ALTER TABLE `custom_order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `custom_order_status_logs`
--
ALTER TABLE `custom_order_status_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5719;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `message_read_state`
--
ALTER TABLE `message_read_state`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `product_colors`
--
ALTER TABLE `product_colors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_ratings`
--
ALTER TABLE `product_ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `provinces`
--
ALTER TABLE `provinces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `shipping_rates`
--
ALTER TABLE `shipping_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=178;

--
-- AUTO_INCREMENT for table `subdistricts`
--
ALTER TABLE `subdistricts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=571806;

--
-- Constraints for dumped tables
--

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
-- Constraints for table `subdistricts`
--
ALTER TABLE `subdistricts`
  ADD CONSTRAINT `fk_subdistricts_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
