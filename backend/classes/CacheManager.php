<?php
// File: backend/classes/CacheManager.php

class CacheManager {
    private static $cacheDir;
    private static $cacheDuration = 3600; // Default 1 jam (dalam detik)

    public function __construct() {
        self::$cacheDir = __DIR__ . '/../../cache';
        if (!is_dir(self::$cacheDir)) {
            mkdir(self::$cacheDir, 0755, true);
        }
    }

    private static function getCacheFilePath($key) {
        new self(); // Pastikan direktori cache sudah dibuat
        return self::$cacheDir . '/' . md5($key) . '.cache';
    }

    public static function set($key, $data, $duration = null) {
        new self(); // Pastikan direktori cache sudah dibuat
        $file = self::getCacheFilePath($key);
        $expires = time() + ($duration ?? self::$cacheDuration);
        $cacheData = [
            'expires' => $expires,
            'data' => $data
        ];
        return file_put_contents($file, json_encode($cacheData, JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    public static function get($key) {
        new self(); // Pastikan direktori cache sudah dibuat
        $file = self::getCacheFilePath($key);
        if (file_exists($file)) {
            $cacheContent = file_get_contents($file);
            $cacheData = json_decode($cacheContent, true);
            if ($cacheData && isset($cacheData['expires']) && $cacheData['expires'] > time()) {
                return $cacheData['data'];
            } else {
                // Cache expired or invalid, delete it
                unlink($file);
            }
        }
        return null;
    }

    public static function clear($key) {
        new self(); // Pastikan direktori cache sudah dibuat
        $file = self::getCacheFilePath($key);
        if (file_exists($file)) {
            unlink($file);
            return true;
        }
        return false;
    }

    public static function clearAll() {
        new self(); // Pastikan direktori cache sudah dibuat
        $files = glob(self::$cacheDir . '/*.cache');
        foreach ($files as $file) {
            unlink($file);
        }
        return true;
    }
}