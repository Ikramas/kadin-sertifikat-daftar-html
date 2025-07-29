<?php
// backend/tests/TempPhpStream.php

/**
 * Helper class to mock php://input stream for testing.
 * This allows simulating POST JSON body in unit/integration tests.
 */
class TempPhpStream
{
    public $context;
    public $resource;

    /**
     * Initializes the stream for a given path.
     * Only 'php://input' path is handled.
     */
    public function stream_open(string $path, string $mode, int $options, ?string &$opened_path): bool
    {
        if ($path === 'php://input') {
            // TEST_INPUT_STREAM is a global resource defined during the test setup
            $this->resource = TEST_INPUT_STREAM;
            return true;
        }
        return false;
    }

    /**
     * Reads from the stream.
     */
    public function stream_read(int $count): string
    {
        return fread($this->resource, $count);
    }

    /**
     * Writes to the stream.
     */
    public function stream_write(string $data): int
    {
        return fwrite($this->resource, $data);
    }

    /**
     * Returns the current position of the stream.
     */
    public function stream_tell(): int
    {
        return ftell($this->resource);
    }

    /**
     * Checks if the end of the stream has been reached.
     */
    public function stream_eof(): bool
    {
        return feof($this->resource);
    }

    /**
     * Seeks to a specific position in the stream.
     */
    public function stream_seek(int $offset, int $whence = SEEK_SET): bool
    {
        return fseek($this->resource, $offset, $whence) === 0;
    }

    /**
     * Retrieves information about the stream.
     */
    public function stream_stat(): array
    {
        return fstat($this->resource);
    }

    // Metode lain yang mungkin diperlukan oleh stream_wrapper (jika ada)
    // public function stream_close(): void {}
    // public function stream_flush(): bool {}
    // public function stream_lock(int $operation): bool {}
    // public function stream_set_option(int $option, int $arg1, int $arg2): bool {}
    // public function stream_truncate(int $new_size): bool {}
    // public function url_stat(string $path, int $flags): array|false {}
}