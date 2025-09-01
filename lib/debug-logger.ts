// Enhanced debugging logger for SQLite operations
export class DebugLogger {
  private static isEnabled = true;
  
  static log(operation: string, data: any, result?: any, error?: any) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation,
      data,
      result,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    
    // Console log with styled output
    if (error) {
      console.error(`❌ [${timestamp}] ${operation} FAILED:`, logEntry);
    } else {
      console.log(`✅ [${timestamp}] ${operation}:`, logEntry);
    }
    
    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('papabear_debug_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('papabear_debug_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to store debug log:', e);
    }
  }
  
  static async logDatabaseOperation(
    operation: string, 
    params: any, 
    executor: () => Promise<any>
  ): Promise<any> {
    this.log(`${operation} - START`, params);
    
    try {
      const result = await executor();
      this.log(`${operation} - SUCCESS`, params, result);
      return result;
    } catch (error) {
      this.log(`${operation} - ERROR`, params, null, error);
      throw error;
    }
  }
  
  static getLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('papabear_debug_logs') || '[]');
    } catch (e) {
      console.warn('Failed to retrieve debug logs:', e);
      return [];
    }
  }
  
  static clearLogs() {
    localStorage.removeItem('papabear_debug_logs');
    console.log('🧹 Debug logs cleared');
  }
  
  static exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
  
  static enable() {
    this.isEnabled = true;
    console.log('🔍 Debug logging enabled');
  }
  
  static disable() {
    this.isEnabled = false;
    console.log('🔇 Debug logging disabled');
  }
}

// Make it available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).PapaBearDebug = DebugLogger;
}