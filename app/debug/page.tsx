"use client";

import { useEffect, useState } from 'react';
import { DebugLogger } from '@/lib/debug-logger';

export default function DebugPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    const refreshLogs = () => {
      setLogs(DebugLogger.getLogs());
    };

    refreshLogs();

    if (isAutoRefresh) {
      const interval = setInterval(refreshLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh]);

  const clearLogs = () => {
    DebugLogger.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    const logsJson = DebugLogger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `papabear-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const testDatabaseOperation = async () => {
    try {
      // Test creating a flavor to see logs
      const { androidDatabaseService } = await import('@/lib/android-database');
      await androidDatabaseService.createFlavor({ name: `Debug Test ${Date.now()}` });
    } catch (error) {
      console.error('Test operation failed:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">🔍 Database Debug Console</h1>
        
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-4 py-2 rounded ${isAutoRefresh ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            {isAutoRefresh ? '⏸️ Pause Auto-refresh' : '▶️ Start Auto-refresh'}
          </button>
          
          <button 
            onClick={clearLogs}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            🗑️ Clear Logs
          </button>
          
          <button 
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            💾 Export Logs
          </button>

          <button 
            onClick={testDatabaseOperation}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            🧪 Test DB Operation
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p><strong>Total Logs:</strong> {logs.length}</p>
          <p><strong>Last Updated:</strong> {new Date().toLocaleTimeString()}</p>
          <p><strong>Auto-refresh:</strong> {isAutoRefresh ? 'ON' : 'OFF'}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-screen overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">
            No logs yet. Try creating items in the admin section to see database operations.
          </div>
        ) : (
          logs.slice().reverse().map((log, index) => (
            <div 
              key={index} 
              className={`p-3 rounded border-l-4 ${
                log.error ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-mono text-sm">
                  {log.error ? '❌' : '✅'} 
                  <span className="font-bold ml-2">{log.operation}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="text-sm">
                <div className="mb-1">
                  <strong>Input:</strong>
                  <pre className="bg-gray-100 p-2 mt-1 rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
                
                {log.result && (
                  <div className="mb-1">
                    <strong>Result:</strong>
                    <pre className="bg-blue-50 p-2 mt-1 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.result, null, 2)}
                    </pre>
                  </div>
                )}
                
                {log.error && (
                  <div>
                    <strong>Error:</strong>
                    <pre className="bg-red-100 p-2 mt-1 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}