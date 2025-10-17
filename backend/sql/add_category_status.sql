-- Add `status` column to `category` to control visibility
-- 1 = show, 0 = hide

ALTER TABLE `category`
  ADD COLUMN `status` TINYINT(1) NOT NULL DEFAULT 1 AFTER `image_url`;

