"""
⚠️ MOCK BINANCE CLIENT - FOR DEVELOPMENT ONLY ⚠️

This is a simulated Binance API client for UI testing.
DELETE THIS FILE before production deployment.

Replace with real binance_client.py in the 'core' folder.
"""

import time
import random
from typing import Dict, List, Optional


class MockBinanceClient:
    """
    Mock Binance API client for UI development and testing
    
    ⚠️ WARNING: This is NOT a real API client!
    All data returned is simulated/fake.
    """
    
    def __init__(self, api_key: str = "", api_secret: str = ""):
        """
        Initialize mock client
        
        Args:
            api_key: Simulated API key (not used)
            api_secret: Simulated API secret (not used)
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.is_connected = False
        self._connection_time = None
    
    def test_connection(self) -> Dict:
        """
        Simulate API connection test
        
        Returns:
            Dict with connection status and details
        """
        # Simulate network delay
        time.sleep(0.5)
        
        # Simulate connection success if keys are provided
        if self.api_key and self.api_secret:
            self.is_connected = True
            self._connection_time = time.time()
            
            return {
                'success': True,
                'message': 'Connection successful',
                'api_key_masked': self._mask_api_key(self.api_key),
                'permissions': ['READ', 'TRADE', 'FUTURES'],
                'server_region': 'Tokyo (ap-northeast-1)',
                'latency_ms': random.randint(10, 25),
                'library_version': 'python-binance v1.0.16',
                'protocol': 'WSS / REST v3'
            }
        else:
            return {
                'success': False,
                'message': 'Invalid API credentials',
                'error_code': 'AUTH_FAILED'
            }
    
    def get_account_balance(self) -> Dict:
        """
        Simulate fetching account balance
        
        Returns:
            Dict with account balance information
        """
        if not self.is_connected:
            return {
                'success': False,
                'message': 'Not connected. Please test connection first.'
            }
        
        # Simulate network delay
        time.sleep(0.3)
        
        # Generate mock balance data
        total_usdt = random.uniform(100000, 150000)
        btc_amount = random.uniform(1.0, 2.0)
        eth_amount = random.uniform(10.0, 15.0)
        
        return {
            'success': True,
            'total_margin_balance': total_usdt,
            'currency': 'USDT',
            'assets': [
                {
                    'asset': 'BTC',
                    'amount': btc_amount,
                    'value_usdt': btc_amount * 64231.50,
                    'percentage': (btc_amount * 64231.50 / total_usdt) * 100
                },
                {
                    'asset': 'ETH',
                    'amount': eth_amount,
                    'value_usdt': eth_amount * 3450.20,
                    'percentage': (eth_amount * 3450.20 / total_usdt) * 100
                },
                {
                    'asset': 'USDT',
                    'amount': total_usdt * 0.3,
                    'value_usdt': total_usdt * 0.3,
                    'percentage': 30.0
                }
            ],
            'timestamp': int(time.time() * 1000)
        }
    
    def get_ticker_price(self, symbol: str = "BTCUSDT") -> Dict:
        """
        Simulate fetching ticker price
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Dict with price information
        """
        # Mock price data
        mock_prices = {
            'BTCUSDT': random.uniform(63000, 65000),
            'ETHUSDT': random.uniform(3400, 3500),
            'BNBUSDT': random.uniform(580, 620)
        }
        
        price = mock_prices.get(symbol, 0)
        
        return {
            'success': True,
            'symbol': symbol,
            'price': price,
            'timestamp': int(time.time() * 1000)
        }
    
    def get_validation_log(self) -> List[Dict]:
        """
        Simulate validation log entries
        
        Returns:
            List of log entries
        """
        if not self.is_connected:
            return []
        
        current_time = time.time()
        
        return [
            {
                'timestamp': current_time - 2,
                'level': 'INFO',
                'message': 'Handshake started...'
            },
            {
                'timestamp': current_time - 1.5,
                'level': 'AUTH',
                'message': 'Credentials masked and verified.'
            },
            {
                'timestamp': current_time - 1,
                'level': 'INFO',
                'message': 'Round-trip 12ms...'
            },
            {
                'timestamp': current_time - 0.5,
                'level': 'DONE',
                'message': 'Connection confirmed active.'
            }
        ]
    
    def _mask_api_key(self, api_key: str) -> str:
        """
        Mask API key for display
        
        Args:
            api_key: Original API key
            
        Returns:
            Masked API key
        """
        if len(api_key) <= 8:
            return '*' * len(api_key)
        
        return api_key[:4] + '*' * (len(api_key) - 8) + api_key[-4:]
    
    def disconnect(self):
        """Simulate disconnection"""
        self.is_connected = False
        self._connection_time = None


# Convenience function for easy import
def create_mock_client(api_key: str = "", api_secret: str = "") -> MockBinanceClient:
    """
    Create a mock Binance client instance
    
    Args:
        api_key: Simulated API key
        api_secret: Simulated API secret
        
    Returns:
        MockBinanceClient instance
    """
    return MockBinanceClient(api_key, api_secret)
