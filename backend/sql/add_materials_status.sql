-- Add `status` column to `materials` to control visibility
-- 1 = show, 0 = hide

ALTER TABLE `materials`
  ADD COLUMN `status` TINYINT(1) NOT NULL DEFAULT 1 AFTER `name`;

