"""
Logger utility for NexusTrade AI
Provides centralized logging with Qt signal support for UI updates
"""

from PySide6.QtCore import QObject, Signal
from datetime import datetime
from enum import Enum


class LogLevel(Enum):
    """Log level enumeration"""
    INFO = "INFO"
    WARNING = "WARN"
    ERROR = "ERROR"
    SUCCESS = "SUCCESS"
    DEBUG = "DEBUG"


class LogManager(QObject):
    """
    Singleton logger that emits signals for UI updates
    """
    # Signal emitted when a new log message is added
    log_message = Signal(str, str, str)  # timestamp, level, message
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LogManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        super().__init__()
        self._initialized = True
        self.logs = []
    
    def log(self, message: str, level: LogLevel = LogLevel.INFO):
        """
        Log a message with the specified level
        
        Args:
            message: The log message
            level: The log level (INFO, WARNING, ERROR, SUCCESS, DEBUG)
        """
        timestamp = datetime.now().strftime("%H:%M:%S")
        level_str = level.value
        
        # Store the log
        self.logs.append({
            'timestamp': timestamp,
            'level': level_str,
            'message': message
        })
        
        # Emit signal for UI update
        try:
            self.log_message.emit(timestamp, level_str, message)
        except Exception:
             # If QObject is not initialized properly or no loop, ignore
             pass

        # Also print to console for debugging
        print(f"[{timestamp}] [{level_str}] {message}")
        
        # 廣播到前端 System Console (如果有設定 broadcast callback)
        if hasattr(self, '_broadcast_callback') and self._broadcast_callback:
            try:
                import asyncio
                import json
                # 構造日誌訊息格式
                log_data = json.dumps({
                    'type': 'LOG',
                    'timestamp': timestamp,
                    'level': level_str,
                    'message': message
                })
                # 在事件循環中執行廣播
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.create_task(self._broadcast_callback(log_data))
                except RuntimeError:
                    # 如果沒有運行中的事件循環,忽略
                    pass
            except Exception as e:
                # 廣播失敗不應該影響日誌記錄
                pass
    
    def set_broadcast_callback(self, callback):
        """設定 WebSocket 廣播回調函數"""
        self._broadcast_callback = callback
    
    def info(self, message: str):
        """Log an info message"""
        self.log(message, LogLevel.INFO)
    
    def warning(self, message: str):
        """Log a warning message"""
        self.log(message, LogLevel.WARNING)
    
    def error(self, message: str):
        """Log an error message"""
        self.log(message, LogLevel.ERROR)
    
    def success(self, message: str):
        """Log a success message"""
        self.log(message, LogLevel.SUCCESS)
    
    def debug(self, message: str):
        """Log a debug message"""
        self.log(message, LogLevel.DEBUG)
    
    def clear(self):
        """Clear all logs"""
        self.logs.clear()
    
    def get_logs(self):
        """Get all stored logs"""
        return self.logs.copy()


# Global logger instance
logger = LogManager()
