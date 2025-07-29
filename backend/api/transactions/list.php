<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Require authentication
    $currentUser = JWT::requireAuth();
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Get transactions with application info
    $stmt = $db->prepare("
        SELECT 
            t.id, t.transaction_number, t.amount, t.status, t.payment_method,
            t.payment_reference, t.paid_at, t.expired_at, t.notes,
            t.created_at, t.updated_at,
            a.application_number, a.application_type, a.requested_classification,
            a.business_field, a.company_qualification
        FROM transactions t
        LEFT JOIN applications a ON t.application_id = a.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $transactions = $stmt->fetchAll();
    
    // Format transactions
    foreach ($transactions as &$transaction) {
        // Format amount
        $transaction['amount_formatted'] = 'Rp ' . number_format($transaction['amount'], 0, ',', '.');
        
        // Format dates
        $transaction['created_at_formatted'] = $transaction['created_at'] ? date('d/m/Y H:i', strtotime($transaction['created_at'])) : null;
        $transaction['updated_at_formatted'] = $transaction['updated_at'] ? date('d/m/Y H:i', strtotime($transaction['updated_at'])) : null;
        $transaction['paid_at_formatted'] = $transaction['paid_at'] ? date('d/m/Y H:i', strtotime($transaction['paid_at'])) : null;
        $transaction['expired_at_formatted'] = $transaction['expired_at'] ? date('d/m/Y H:i', strtotime($transaction['expired_at'])) : null;
        
        // Add status badge info
        switch ($transaction['status']) {
            case 'pending':
                $transaction['status_badge'] = [
                    'text' => 'Menunggu Pembayaran',
                    'color' => 'yellow',
                    'description' => 'Invoice telah diterbitkan, menunggu pembayaran'
                ];
                break;
            case 'paid':
                $transaction['status_badge'] = [
                    'text' => 'Sudah Dibayar',
                    'color' => 'green',
                    'description' => 'Pembayaran telah dikonfirmasi'
                ];
                break;
            case 'failed':
                $transaction['status_badge'] = [
                    'text' => 'Gagal',
                    'color' => 'red',
                    'description' => 'Pembayaran gagal diproses'
                ];
                break;
            case 'cancelled':
                $transaction['status_badge'] = [
                    'text' => 'Dibatalkan',
                    'color' => 'gray',
                    'description' => 'Transaksi dibatalkan'
                ];
                break;
            case 'refunded':
                $transaction['status_badge'] = [
                    'text' => 'Dikembalikan',
                    'color' => 'blue',
                    'description' => 'Pembayaran telah dikembalikan'
                ];
                break;
            default:
                $transaction['status_badge'] = [
                    'text' => ucfirst($transaction['status']),
                    'color' => 'gray',
                    'description' => 'Status tidak diketahui'
                ];
        }
        
        // Check if expired
        if ($transaction['expired_at'] && strtotime($transaction['expired_at']) < time() && $transaction['status'] === 'pending') {
            $transaction['is_expired'] = true;
            $transaction['status_badge'] = [
                'text' => 'Kadaluarsa',
                'color' => 'red',
                'description' => 'Invoice telah kadaluarsa'
            ];
        } else {
            $transaction['is_expired'] = false;
        }
        
        // Calculate days remaining for pending payments
        if ($transaction['status'] === 'pending' && $transaction['expired_at'] && !$transaction['is_expired']) {
            $expiredDate = new DateTime($transaction['expired_at']);
            $currentDate = new DateTime();
            $daysRemaining = $currentDate->diff($expiredDate)->days;
            $transaction['days_remaining'] = $daysRemaining;
        }
    }
    
    // Get summary statistics
    $summaryStats = [
        'total_transactions' => count($transactions),
        'pending_count' => 0,
        'paid_count' => 0,
        'total_amount' => 0,
        'paid_amount' => 0
    ];
    
    foreach ($transactions as $transaction) {
        $summaryStats['total_amount'] += $transaction['amount'];
        
        if ($transaction['status'] === 'pending' && !$transaction['is_expired']) {
            $summaryStats['pending_count']++;
        }
        
        if ($transaction['status'] === 'paid') {
            $summaryStats['paid_count']++;
            $summaryStats['paid_amount'] += $transaction['amount'];
        }
    }
    
    // Format summary amounts
    $summaryStats['total_amount_formatted'] = 'Rp ' . number_format($summaryStats['total_amount'], 0, ',', '.');
    $summaryStats['paid_amount_formatted'] = 'Rp ' . number_format($summaryStats['paid_amount'], 0, ',', '.');
    
    logApiRequest('GET', '/api/transactions/list', ['user_id' => $currentUser['user_id']], [
        'success' => true, 
        'total_transactions' => count($transactions),
        'pending_count' => $summaryStats['pending_count'],
        'paid_count' => $summaryStats['paid_count']
    ]);
    
    ApiResponse::success([
        'transactions' => $transactions,
        'summary' => $summaryStats
    ], 'Daftar transaksi berhasil dimuat');
    
} catch (Exception $e) {
    logApiRequest('GET', '/api/transactions/list', ['user_id' => $currentUser['user_id'] ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat daftar transaksi: ' . $e->getMessage());
}