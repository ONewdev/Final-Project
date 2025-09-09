-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 06, 2025 at 04:18 PM
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
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `password`) VALUES
(1, 'admin', '111111');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `category_name`) VALUES
(1, 'หน้าต่างบานเลื่อน2'),
(2, 'หน้าต่างบานเลื่อน4'),
(3, 'ประตูบานเลื่อน2'),
(4, 'ประตูบานเลื่อน4'),
(5, 'ประตูสวิง'),
(6, 'ประตูรางแขวน'),
(7, 'ประตูมุ้ง'),
(8, 'บานเฟี้ยม'),
(9, 'บานตาย'),
(10, 'บานกระทุ้ง'),
(11, 'ชาวเวอร์'),
(12, 'ตู้เฟอร์นิเจอร์'),
(13, 'หน้าต่างมุ้ง');

-- --------------------------------------------------------

--
-- Table structure for table `contact`
--

CREATE TABLE `contact` (
  `name` varchar(255) NOT NULL,
  `tel` text NOT NULL,
  `gmail` varchar(255) NOT NULL,
  `map` varchar(255) NOT NULL,
  `time` text NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `id` int(1) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `contact`
--

INSERT INTO `contact` (`name`, `tel`, `gmail`, `map`, `time`, `logo`, `id`, `status`) VALUES
('Aluglaue Pro', '099-999-9998', 'A&G@gmail.com', 'https://www.google.com/maps/embed?pb=!4v1752974298441!6m8!1m7!1s8mYw-Ou6n1GQUv1RwTxmsQ!2m2!1d20.36825582310125!2d99.87733385345288!3f247.06!4f-8.099999999999994!5f0.7820865974627469', '08:00 - 16:00 น.', NULL, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('active','inactive','banned') DEFAULT 'active',
  `profile_picture` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_token` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `postal_code` varchar(5) DEFAULT NULL,
  `subdistrict_id` int(11) DEFAULT NULL,
  `district_id` int(11) DEFAULT NULL,
  `province_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `email`, `password`, `name`, `created_at`, `updated_at`, `status`, `profile_picture`, `is_verified`, `verification_token`, `reset_token`, `reset_token_expires`, `phone`, `address`, `postal_code`, `subdistrict_id`, `district_id`, `province_id`) VALUES
(2, 'test@gmail.com', '$2b$10$8z.xBLdlYfFzT1dHhVR9uetRP6ilSTBj5KuMliRjS9fCcwX6UC2W2', 'test', '2025-06-21 09:12:09', '2025-09-02 05:12:01', 'active', '/uploads/profiles/1756785882855-435639137.jpg', 0, NULL, NULL, NULL, '099-999-9999', '11/1', '57130', 1, 1, 1),
(6, 'test2@gmail.com', '$2b$10$VvPYgDUQj1Dq.7dAhweMzOjtG/6YDokkquER3BymR1vktiu1g5iyK', 'test2', '2025-08-04 02:19:49', '2025-08-04 02:24:09', 'active', '/uploads/profiles/1754274248776-442080720.png', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'test3@gmail.com', '$2b$10$yDk6tDhEyRGJ3HQKb2JDmOTke0cioR979POqOkrkBeR7mWqVtiCum', 'test3', '2025-09-04 10:57:26', '2025-09-05 14:23:52', 'active', '/uploads/profiles/1756983671988-205085063.png', 0, NULL, NULL, NULL, '011-111-1111', '21/2', '', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `custom_orders`
--

CREATE TABLE `custom_orders` (
  `id` int(11) NOT NULL,
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
  `status` enum('pending','approved','waiting_payment','paid','in_production','delivering','completed','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `custom_orders`
--

INSERT INTO `custom_orders` (`id`, `user_id`, `category`, `product_type`, `width`, `height`, `unit`, `color`, `quantity`, `details`, `has_screen`, `round_frame`, `swing_type`, `mode`, `fixed_left_m2`, `fixed_right_m2`, `price`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'ขาว', 1, NULL, 1, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 3500, 'approved', '2025-09-03 13:34:58', '2025-09-03 22:03:53'),
(2, 7, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'ชา', 1, NULL, 0, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 3000, 'pending', '2025-09-04 18:14:40', '2025-09-04 18:14:40');

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
(1, 'เมืองเชียงราย', 1),
(2, 'พระนคร', 2),
(3, 'คลองเตย', 2),
(4, 'เมืองกระบี่', 3),
(5, 'เมืองกาญจนบุรี', 4),
(6, 'เมืองกาฬสินธุ์', 5),
(7, 'เมืองกำแพงเพชร', 6),
(8, 'เมืองขอนแก่น', 7),
(9, 'เมืองจันทบุรี', 8),
(10, 'เมืองฉะเชิงเทรา', 9),
(11, 'เมืองชลบุรี', 10),
(12, 'เมืองชัยนาท', 11),
(13, 'เมืองชัยภูมิ', 12),
(14, 'เมืองชุมพร', 13),
(15, 'เมืองเชียงใหม่', 14),
(16, 'เมืองตรัง', 15),
(17, 'เมืองตราด', 16),
(18, 'เมืองตาก', 17),
(19, 'พระนคร', 2),
(20, 'คลองเตย', 2),
(21, 'เมืองเชียงใหม่', 14),
(22, 'แม่ริม', 14),
(23, 'เมืองภูเก็ต', 42),
(24, 'กะทู้', 42),
(25, 'เมืองขอนแก่น', 7),
(26, 'บ้านไผ่', 7),
(27, 'เมืองนครราชสีมา', 21),
(28, 'ปากช่อง', 21),
(29, 'เมืองชลบุรี', 10),
(30, 'ศรีราชา', 10),
(31, 'เมืองระยอง', 50),
(32, 'บ้านฉาง', 50),
(33, 'พระนครศรีอยุธยา', 33),
(34, 'วังน้อย', 33),
(35, 'เมืองนครสวรรค์', 23),
(36, 'พระนคร', 2),
(37, 'คลองเตย', 2),
(38, 'เมืองเชียงใหม่', 14),
(39, 'แม่ริม', 14),
(40, 'เมืองภูเก็ต', 42),
(41, 'กะทู้', 42),
(42, 'เมืองขอนแก่น', 7),
(43, 'บ้านไผ่', 7),
(44, 'เมืองนครราชสีมา', 21),
(45, 'ปากช่อง', 21),
(46, 'เมืองชลบุรี', 10),
(47, 'ศรีราชา', 10),
(48, 'เมืองระยอง', 50),
(49, 'บ้านฉาง', 50),
(50, 'พระนครศรีอยุธยา', 33),
(51, 'วังน้อย', 33),
(52, 'เมืองนครสวรรค์', 23),
(53, 'ตาคลี', 23),
(54, 'เมืองสุราษฎร์ธานี', 68),
(55, 'เกาะสมุย', 68),
(56, 'หาดใหญ่', 58),
(57, 'เมืองสงขลา', 58),
(58, 'เมืองอุบลราชธานี', 77),
(59, 'วารินชำราบ', 77),
(60, 'เมืองอุดรธานี', 74),
(61, 'บ้านดุง', 74),
(62, 'เมืองลำปาง', 53),
(63, 'เมืองเพชรบุรี', 39);

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `inbox`
--

CREATE TABLE `inbox` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations_lock`
--

CREATE TABLE `knex_migrations_lock` (
  `index` int(10) UNSIGNED NOT NULL,
  `is_locked` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `knex_migrations_lock`
--

INSERT INTO `knex_migrations_lock` (`index`, `is_locked`) VALUES
(1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `message` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `message`, `created_at`) VALUES
(17, 2, 1, '....', '2025-08-14 08:56:04'),
(18, 1, 2, 'ว่าไงครับ', '2025-08-14 08:56:32'),
(19, 1, 2, '??', '2025-08-15 07:20:51'),
(20, 6, 1, 'สวัสดีครับ', '2025-08-18 08:42:35'),
(21, 1, 6, 'ดีครับ ยินดีให้บริการ', '2025-08-18 08:43:37'),
(22, 1, 2, 'สวัสดีครับ', '2025-08-26 07:18:40'),
(23, 1, 2, '...', '2025-08-26 07:21:29'),
(24, 1, 2, '...', '2025-08-26 07:24:08'),
(25, 2, 1, 'ครับ', '2025-09-01 14:49:58'),
(26, 7, 1, 'สวัสดีครับ', '2025-09-04 11:19:24'),
(27, 1, 7, 'ครับ', '2025-09-04 11:19:54');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `type` varchar(20) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `customer_id`, `type`, `title`, `message`, `created_at`, `is_read`, `read_at`) VALUES
(19, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0001 ได้รับการยืนยันแล้ว ขอบคุณที่ใช้บริการค่ะ', '2025-09-03 14:20:02', 0, NULL),
(20, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0002 ได้รับการยืนยันแล้ว ขอบคุณที่ใช้บริการค่ะ', '2025-09-03 22:04:23', 0, NULL),
(21, 2, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿3,500', '2025-09-03 22:04:23', 0, NULL),
(22, 2, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0003 ได้รับการยืนยันแล้ว ขอบคุณที่ใช้บริการค่ะ', '2025-09-03 22:45:32', 0, NULL),
(23, 2, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿1,000', '2025-09-03 22:45:32', 0, NULL),
(24, 7, 'success', 'ชำระเงินสำเร็จ', 'คำสั่งซื้อ #0005 ได้รับการยืนยันแล้ว ขอบคุณที่ใช้บริการค่ะ', '2025-09-04 18:11:11', 0, NULL),
(25, 7, 'success', 'ชำระเงินสำเร็จ', 'การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿4,000', '2025-09-04 18:11:11', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `order_type` enum('standard','custom') DEFAULT 'standard',
  `status` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `shipping_address` text,
  `phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `product_id`, `total_price`, `order_type`, `status`, `created_at`, `shipping_address`, `phone`) VALUES
(1, 2, NULL, NULL, 'standard', 'delivered', '2025-09-03 07:16:58', '-', '-'),
(2, 2, NULL, NULL, 'standard', 'delivered', '2025-09-03 14:51:54', '-', '-'),
(3, 2, NULL, NULL, 'standard', 'delivered', '2025-09-03 15:44:07', '-', '-'),
(4, 7, NULL, NULL, 'standard', 'cancelled', '2025-09-04 11:06:37', '221', '099-999-9998'),
(5, 7, NULL, NULL, 'standard', 'received', '2025-09-04 11:08:38', '-', '088-000-0000');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(1, 1, 2, 1, '3500.00'),
(2, 2, 2, 1, '3500.00'),
(3, 3, 1, 2, '500.00'),
(4, 4, 1, 3, '500.00'),
(5, 4, 2, 2, '3500.00'),
(6, 5, 1, 1, '500.00'),
(7, 5, 2, 1, '3500.00');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `customer_id`, `order_id`, `image`, `amount`, `status`, `created_at`) VALUES
(1, 2, 1, '39fd96d86b4a790e14cb2df2a68f2b8f', '3500.00', 'approved', '2025-09-03 07:17:12'),
(2, 2, 2, 'fcf117304d9d7c3567b4ff8e22a8a331', '3500.00', 'approved', '2025-09-03 14:52:12'),
(3, 2, 3, 'd28a3d578093593be5af7d3a044296a0', '1000.00', 'approved', '2025-09-03 15:44:16'),
(4, 7, 5, '89e32d994712b722c4a92cd348ded54a', '4000.00', 'approved', '2025-09-04 11:08:56');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) DEFAULT '0',
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','-') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `product_code` varchar(50) NOT NULL,
  `color` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `category_id`, `price`, `quantity`, `image_url`, `status`, `created_at`, `updated_at`, `product_code`, `color`) VALUES
(1, 'หน้าต่างมุ้งสีอบขาว', '-', 13, '500.00', 8, '/uploads/products/1755243843772-201885004.png', 'active', '2025-08-15 07:44:03', '2025-09-03 05:13:52', 'PWMWX-001', NULL),
(2, 'หน้าต่างอลูมิเนียมสีอบขาว', '-', 1, '3500.00', 6, '/uploads/products/1755244182369-572932768.jpg', 'active', '2025-08-15 07:49:42', '2025-09-03 05:12:55', 'PWWC-001', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_colors`
--

CREATE TABLE `product_colors` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `color_name` varchar(50) DEFAULT NULL,
  `color_code` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `product_ratings`
--

INSERT INTO `product_ratings` (`id`, `customer_id`, `product_id`, `rating`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 5, '2025-08-01 17:01:27', '2025-09-03 08:46:06'),
(2, 2, 2, 5, '2025-08-02 14:57:18', '2025-09-03 08:46:30'),
(3, 2, 11, 5, '2025-08-03 07:24:02', '2025-08-03 07:24:02'),
(4, 5, 11, 5, '2025-08-03 09:43:51', '2025-08-03 09:43:51'),
(5, 6, 15, 5, '2025-08-04 02:29:34', '2025-08-04 02:29:34');

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
(1, 'เชียงราย'),
(2, 'กรุงเทพมหานคร'),
(3, 'กระบี่'),
(4, 'กาญจนบุรี'),
(5, 'กาฬสินธุ์'),
(6, 'กำแพงเพชร'),
(7, 'ขอนแก่น'),
(8, 'จันทบุรี'),
(9, 'ฉะเชิงเทรา'),
(10, 'ชลบุรี'),
(11, 'ชัยนาท'),
(12, 'ชัยภูมิ'),
(13, 'ชุมพร'),
(14, 'เชียงใหม่'),
(15, 'ตรัง'),
(16, 'ตราด'),
(17, 'ตาก'),
(18, 'นครนายก'),
(19, 'นครปฐม'),
(20, 'นครพนม'),
(21, 'นครราชสีมา'),
(22, 'นครศรีธรรมราช'),
(23, 'นครสวรรค์'),
(24, 'นนทบุรี'),
(25, 'นราธิวาส'),
(26, 'น่าน'),
(27, 'บึงกาฬ'),
(28, 'บุรีรัมย์'),
(29, 'ปทุมธานี'),
(30, 'ประจวบคีรีขันธ์'),
(31, 'ปราจีนบุรี'),
(32, 'ปัตตานี'),
(33, 'พระนครศรีอยุธยา'),
(34, 'พะเยา'),
(35, 'พังงา'),
(36, 'พัทลุง'),
(37, 'พิจิตร'),
(38, 'พิษณุโลก'),
(39, 'เพชรบุรี'),
(40, 'เพชรบูรณ์'),
(41, 'แพร่'),
(42, 'ภูเก็ต'),
(43, 'มหาสารคาม'),
(44, 'มุกดาหาร'),
(45, 'แม่ฮ่องสอน'),
(46, 'ยโสธร'),
(47, 'ยะลา'),
(48, 'ร้อยเอ็ด'),
(49, 'ระนอง'),
(50, 'ระยอง'),
(51, 'ราชบุรี'),
(52, 'ลพบุรี'),
(53, 'ลำปาง'),
(54, 'ลำพูน'),
(55, 'เลย'),
(56, 'ศรีสะเกษ'),
(57, 'สกลนคร'),
(58, 'สงขลา'),
(59, 'สตูล'),
(60, 'สมุทรปราการ'),
(61, 'สมุทรสงคราม'),
(62, 'สมุทรสาคร'),
(63, 'สระแก้ว'),
(64, 'สระบุรี'),
(65, 'สิงห์บุรี'),
(66, 'สุโขทัย'),
(67, 'สุพรรณบุรี'),
(68, 'สุราษฎร์ธานี'),
(69, 'สุรินทร์'),
(70, 'หนองคาย'),
(71, 'หนองบัวลำภู'),
(72, 'อ่างทอง'),
(73, 'อำนาจเจริญ'),
(74, 'อุดรธานี'),
(75, 'อุตรดิตถ์'),
(76, 'อุทัยธานี'),
(77, 'อุบลราชธานี');

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
(1, 'เวียง', 1, '57000'),
(2, 'แม่สา', 22, '50180'),
(3, 'ริมใต้', 22, '50180'),
(4, 'ตลาดใหญ่', 23, '83000'),
(5, 'รัษฎา', 23, '83000'),
(6, 'ป่าตอง', 24, '83150'),
(7, 'กะทู้', 24, '83120'),
(8, 'บ้านไผ่', 26, '40110'),
(9, 'เมืองเพีย', 26, '40110'),
(10, 'ในเมือง', 27, '30000'),
(11, 'โพธิ์กลาง', 27, '30000'),
(12, 'ปากช่อง', 28, '30130'),
(13, 'ขนงพระ', 28, '30130'),
(14, 'ศรีราชา', 30, '20110'),
(15, 'สุรศักดิ์', 30, '20110'),
(16, 'ท่าประดู่', 31, '21000'),
(17, 'เนินพระ', 31, '21000'),
(18, 'บ้านฉาง', 32, '21130'),
(19, 'สำนักท้อน', 32, '21130'),
(20, 'ประตูชัย', 33, '13000'),
(21, 'ไผ่ลิง', 33, '13000'),
(22, 'วังน้อย', 34, '13170'),
(23, 'ลำไทร', 34, '13170'),
(24, 'ปากน้ำโพ', 35, '60000'),
(25, 'นครสวรรค์ตก', 35, '60000'),
(26, 'พระบรมมหาราชวัง', 2, '10200'),
(27, 'วัดราชบพิธ', 2, '10200'),
(28, 'คลองเตย', 3, '10110'),
(29, 'พระโขนง', 3, '10110'),
(30, 'ศรีภูมิ', 15, '50200'),
(31, 'พระสิงห์', 15, '50200'),
(32, 'แม่สา', 22, '50180'),
(33, 'ริมใต้', 22, '50180'),
(34, 'ตลาดใหญ่', 23, '83000'),
(35, 'รัษฎา', 23, '83000'),
(36, 'ป่าตอง', 24, '83150'),
(37, 'กะทู้', 24, '83120'),
(38, 'ในเมือง', 8, '40000'),
(39, 'ศิลา', 8, '40000'),
(40, 'บ้านไผ่', 26, '40110'),
(41, 'เมืองเพีย', 26, '40110'),
(42, 'ในเมือง', 27, '30000'),
(43, 'โพธิ์กลาง', 27, '30000'),
(44, 'ปากช่อง', 28, '30130'),
(45, 'ขนงพระ', 28, '30130'),
(46, 'บางปลาสร้อย', 11, '20000'),
(47, 'บ้านสวน', 11, '20000'),
(48, 'ศรีราชา', 30, '20110'),
(49, 'สุรศักดิ์', 30, '20110'),
(50, 'ท่าประดู่', 31, '21000'),
(51, 'เนินพระ', 31, '21000'),
(52, 'บ้านฉาง', 32, '21130'),
(53, 'สำนักท้อน', 32, '21130'),
(54, 'ประตูชัย', 33, '13000'),
(55, 'ไผ่ลิง', 33, '13000'),
(56, 'วังน้อย', 34, '13170'),
(57, 'ลำไทร', 34, '13170'),
(58, 'ปากน้ำโพ', 35, '60000'),
(59, 'นครสวรรค์ตก', 35, '60000'),
(60, 'ตาคลี', 53, '60140'),
(61, 'หัวหวาย', 53, '60140'),
(62, 'ตลาด', 54, '84000'),
(63, 'มะขามเตี้ย', 54, '84000'),
(64, 'บ่อผุด', 55, '84320'),
(65, 'แม่น้ำ', 55, '84330'),
(66, 'หาดใหญ่', 56, '90110'),
(67, 'คอหงส์', 56, '90110'),
(68, 'บ่อยาง', 57, '90000'),
(69, 'พะวง', 57, '90100'),
(70, 'ในเมือง', 58, '34000'),
(71, 'ขามใหญ่', 58, '34000'),
(72, 'วารินชำราบ', 59, '34190'),
(73, 'โนนผึ้ง', 59, '34190'),
(74, 'หมากแข้ง', 60, '41000'),
(75, 'หนองบัว', 60, '41000'),
(76, 'บ้านดุง', 61, '41190'),
(77, 'นาคำ', 61, '41190'),
(78, 'สบตุ๋ย', 62, '52100'),
(79, 'หัวเวียง', 62, '52000'),
(80, 'ท่าราบ', 63, '76000'),
(81, 'ต้นมะม่วง', 63, '76000');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`username`);

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
-- Indexes for table `custom_orders`
--
ALTER TABLE `custom_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

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
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_customer` (`customer_id`,`is_read`,`created_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `order_id` (`order_id`);

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
  ADD KEY `product_id` (`product_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `custom_orders`
--
ALTER TABLE `custom_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

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
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `product_colors`
--
ALTER TABLE `product_colors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_ratings`
--
ALTER TABLE `product_ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `provinces`
--
ALTER TABLE `provinces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `subdistricts`
--
ALTER TABLE `subdistricts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

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
-- Constraints for table `districts`
--
ALTER TABLE `districts`
  ADD CONSTRAINT `fk_districts_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

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
  ADD CONSTRAINT `product_colors_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `subdistricts`
--
ALTER TABLE `subdistricts`
  ADD CONSTRAINT `fk_subdistricts_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
