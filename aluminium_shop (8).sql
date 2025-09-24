-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 23, 2025 at 04:17 PM
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
(1, 'admin', '123456');

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
  `time` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id` int(1) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(2, 'test@gmail.com', '$2b$10$8z.xBLdlYfFzT1dHhVR9uetRP6ilSTBj5KuMliRjS9fCcwX6UC2W2', 'test', '2025-06-21 09:12:09', '2025-09-23 07:03:33', 'active', '/uploads/profiles/1757515832713-389545290.png', 0, NULL, NULL, NULL, '099-999-9999', '11/1', '57130', NULL, NULL, NULL, '2025-09-23 14:03:33'),
(6, 'test2@gmail.com', '$2b$10$VvPYgDUQj1Dq.7dAhweMzOjtG/6YDokkquER3BymR1vktiu1g5iyK', 'test2', '2025-08-04 02:19:49', '2025-09-10 14:58:55', 'active', '/uploads/profiles/1757516334534-299931082.png', 0, NULL, NULL, NULL, '099-999-9999', '12/1', '', NULL, NULL, NULL, NULL),
(7, 'test3@gmail.com', '$2b$10$yDk6tDhEyRGJ3HQKb2JDmOTke0cioR979POqOkrkBeR7mWqVtiCum', 'test3', '2025-09-04 10:57:26', '2025-09-05 14:23:52', 'active', '/uploads/profiles/1756983671988-205085063.png', 0, NULL, NULL, NULL, '011-111-1111', '21/2', '', NULL, NULL, NULL, NULL),
(15, 'koy40199@gmail.com', '$2b$10$QCCQKdFmEvJxb5HZ4Cn7POlarVoWY7KlyRdM0Cl5vKRjYjPecg0RG', 'nkk', '2025-09-19 08:08:58', '2025-09-19 10:58:54', 'active', NULL, 0, NULL, 'cc881b7a968ffe93eed95e22fdf7a7262962abce6ba9298153ba4de4b43d61d4', '2025-09-19 18:58:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
(1, 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'ชา', 1, '-', 0, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 3000, 'approved', '2025-09-17 15:20:57', '2025-09-17 15:22:08'),
(2, 2, '1', 'หน้าต่างบานเลื่อน2', '180.00', '120.00', 'cm', 'เงิน', 1, '-', 1, 0, 'บานเดี่ยว', 'มาตรฐาน', '0.000', '0.000', 3500, 'approved', '2025-09-22 15:41:31', '2025-09-23 13:55:52');

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
(1, 2, 'pending', 'approved', '2025-09-23 13:55:52');

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE `districts` (
  `id` int(11) NOT NULL,
  `name_th` varchar(150) NOT NULL,
  `province_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
(67, 2, 'info', 'สร้างคำสั่งซื้อสำเร็จ', 'ออเดอร์ #29 ถูกสร้างเรียบร้อยแล้ว', '2025-09-23 14:03:03', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `order_type` enum('standard','custom') COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `shipping_address` mediumtext COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `total_price`, `order_type`, `status`, `created_at`, `shipping_address`, `phone`, `approved_at`, `shipped_at`, `delivered_at`, `cancelled_at`) VALUES
(11, 2, NULL, 'standard', 'delivered', '2025-09-14 03:30:34', '-', '-', NULL, NULL, NULL, NULL),
(12, 2, NULL, 'standard', 'delivered', '2025-09-15 08:39:44', '11/1', '-', NULL, NULL, NULL, NULL),
(14, 2, NULL, 'standard', 'delivered', '2025-09-16 04:47:14', '-', '-', NULL, '2025-09-16 11:48:24', '2025-09-16 11:56:40', NULL),
(15, 2, NULL, 'standard', 'delivered', '2025-09-16 06:16:48', '-', '-', '2025-09-16 13:52:56', '2025-09-16 13:55:58', '2025-09-16 13:56:12', NULL),
(16, 2, NULL, 'standard', 'delivered', '2025-09-16 06:30:31', '-', '-', '2025-09-16 13:52:53', '2025-09-16 13:55:55', '2025-09-16 13:56:09', NULL),
(18, 2, NULL, 'standard', 'delivered', '2025-09-16 06:46:14', '-', '-', '2025-09-16 13:46:55', '2025-09-16 13:47:14', '2025-09-16 13:47:48', NULL),
(19, 2, NULL, 'standard', 'cancelled', '2025-09-16 06:56:52', '-', '-', NULL, NULL, NULL, '2025-09-16 13:57:06'),
(20, 2, NULL, 'standard', 'cancelled', '2025-09-16 07:00:18', '-', '-', NULL, NULL, NULL, '2025-09-16 14:02:19'),
(23, 2, NULL, 'standard', 'approved', '2025-09-17 04:25:45', '-', '-', '2025-09-17 15:18:59', '2025-09-17 11:26:01', NULL, NULL),
(24, 2, NULL, 'standard', 'approved', '2025-09-17 08:17:49', '-', '-', '2025-09-17 15:20:05', '2025-09-17 15:19:30', NULL, NULL),
(25, 2, NULL, 'standard', 'shipped', '2025-09-17 09:05:46', '-', '-', '2025-09-17 16:06:18', '2025-09-17 16:15:30', NULL, NULL),
(26, 2, NULL, 'standard', 'cancelled', '2025-09-17 12:01:19', '-', '-', NULL, NULL, NULL, '2025-09-17 19:10:49'),
(27, 2, NULL, 'standard', 'shipped', '2025-09-17 12:06:09', '-', '-', '2025-09-19 18:15:28', '2025-09-19 18:16:02', NULL, NULL),
(28, 2, NULL, 'standard', 'shipped', '2025-09-23 04:25:52', '-', '-', NULL, '2025-09-23 12:56:04', NULL, NULL),
(29, 2, NULL, 'standard', 'pending', '2025-09-23 07:03:02', '-', '-', NULL, NULL, NULL, NULL);

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
(37, 29, 2, 1, '3000.00');

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
(18, 2, 28, 'f73973c13c94c88924e2efa9f3d56d83', '3000.00', 'pending', '2025-09-23 05:56:04');

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
(1, 'หน้าต่างมุ้งสีอบขาว', '-', 13, '250.00', 10, '/uploads/products/1755243843772-201885004.png', 'active', '2025-08-15 07:44:03', '2025-09-23 06:36:15', 'SCR-GR-120x180-0005', 'ขาว', '80*120 cm'),
(2, 'หน้าต่างอลูมิเนียมสีอบขาว', '-', 1, '3000.00', 7, '/uploads/products/1755244182369-572932768.jpg', 'active', '2025-08-15 07:49:42', '2025-09-23 07:03:02', 'WIN-WH-120x180-0001', NULL, NULL),
(3, 'หน้าต่างมุ้งสีดำ', '-', 13, '500.00', 9, '/uploads/products/1757405222213-284209072.jpg', 'active', '2025-09-09 08:07:02', '2025-09-17 12:06:09', 'SCR-BK-120x100-0003', NULL, NULL),
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
(5, 6, 15, 5, '2025-08-04 02:29:34', '2025-08-04 02:29:34');

-- --------------------------------------------------------

--
-- Table structure for table `provinces`
--

CREATE TABLE `provinces` (
  `id` int(11) NOT NULL,
  `name_th` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
-- Indexes for table `custom_orders`
--
ALTER TABLE `custom_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

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
  ADD KEY `customer_id` (`customer_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `custom_orders`
--
ALTER TABLE `custom_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `custom_order_files`
--
ALTER TABLE `custom_order_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `custom_order_payments`
--
ALTER TABLE `custom_order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `custom_order_status_logs`
--
ALTER TABLE `custom_order_status_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `provinces`
--
ALTER TABLE `provinces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subdistricts`
--
ALTER TABLE `subdistricts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
