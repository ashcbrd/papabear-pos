"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Wallet,
  FileText,
  Calendar,
  Filter,
  Receipt,
  AlertCircle,
  RefreshCw,
  Eye,
  PlusCircle,
  MinusCircle,
  ShoppingCart,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useData } from "@/lib/data-context";
import { AdminSelect } from "@/components/admin";
import { formatDateTime } from "@/lib/date-utils";

interface CashFlowTransaction {
  id: string;
  type: "INFLOW" | "OUTFLOW";
  amount: number;
  category: string;
  orderId?: string;
  description: string;
  itemsPurchased?: string;
  paymentMethod?: string;
  createdAt: string;
  createdBy: string;
}

interface CashFlowSummary {
  period: string;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  currentBalance: number;
  transactionCount: number;
  inflowByCategory: Record<string, number>;
  outflowByCategory: Record<string, number>;
  recentTransactions: CashFlowTransaction[];
}

export default function CashFlowManager() {
  const { currentDataService } = useData();
  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [drawerBalance, setDrawerBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [modalType, setModalType] = useState<"inflow" | "outflow">("inflow");

  // Form states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [itemsPurchased, setItemsPurchased] = useState("");

  // Drawer adjustment states
  const [newBalance, setNewBalance] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Undo states
  const [undoTransaction, setUndoTransaction] = useState<any | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);

  useEffect(() => {
    loadCashFlowData();
  }, [selectedPeriod]);

  // Undo countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (undoCountdown > 0) {
      timer = setTimeout(() => {
        setUndoCountdown(undoCountdown - 1);
      }, 1000);
    } else if (undoCountdown === 0 && undoTransaction) {
      // Time's up, remove undo option
      setUndoTransaction(null);
    }
    return () => clearTimeout(timer);
  }, [undoCountdown, undoTransaction]);

  const loadCashFlowData = async () => {
    setLoading(true);
    try {
      const [transactionsData, summaryData, balanceData] = await Promise.all([
        currentDataService.getCashFlowTransactions({ limit: 50 }),
        currentDataService.getCashFlowSummary(selectedPeriod),
        currentDataService.getCashDrawerBalance(),
      ]);

      setTransactions(transactionsData);
      setSummary(summaryData);
      setDrawerBalance(balanceData.currentBalance);
    } catch (error) {
      console.error("Error loading cash flow data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInflow = async () => {
    if (!amount || !description) return;

    try {
      await currentDataService.addCashDeposit(parseFloat(amount), description);
      await loadCashFlowData();
      setShowAddModal(false);
      setAmount("");
      setDescription("");
    } catch (error) {
      console.error("Error adding inflow:", error);
    }
  };

  const handleAddOutflow = async () => {
    if (!amount || !description) return;

    const expenseAmount = parseFloat(amount);

    // Validate that expense doesn't exceed cash drawer balance
    if (expenseAmount > drawerBalance) {
      alert(
        `Cannot record expense of ${formatCurrency(
          expenseAmount
        )}. Cash drawer balance is only ${formatCurrency(drawerBalance)}.`
      );
      return;
    }

    try {
      await currentDataService.recordExpense(
        expenseAmount,
        description,
        itemsPurchased || undefined
      );
      await loadCashFlowData();
      setShowExpenseModal(false);
      setAmount("");
      setDescription("");
      setItemsPurchased("");
    } catch (error) {
      console.error("Error adding outflow:", error);
    }
  };

  const handleDrawerAdjustment = async () => {
    if (!newBalance || !adjustmentReason) return;

    try {
      await currentDataService.setCashDrawerBalance(
        parseFloat(newBalance),
        adjustmentReason
      );
      await loadCashFlowData();
      setShowDrawerModal(false);
      setNewBalance("");
      setAdjustmentReason("");
    } catch (error) {
      console.error("Error adjusting cash drawer:", error);
    }
  };

  const openDrawerModal = () => {
    setNewBalance(drawerBalance.toString());
    setAdjustmentReason("");
    setShowDrawerModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ORDER_PAYMENT":
        return <Receipt className="w-4 h-4" />;
      case "CASH_DEPOSIT":
        return <PlusCircle className="w-4 h-4" />;
      case "STOCK_PURCHASE":
        return <ShoppingCart className="w-4 h-4" />;
      case "EXPENSE":
        return <MinusCircle className="w-4 h-4" />;
      case "REFUND":
        return <RefreshCw className="w-4 h-4" />;
      case "CASH_ADJUSTMENT":
        return <Wallet className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string, type: string) => {
    if (category === "CASH_ADJUSTMENT") {
      return type === "INFLOW"
        ? "text-indigo-600 bg-indigo-50 border-indigo-200"
        : "text-purple-600 bg-purple-50 border-purple-200";
    }

    if (type === "INFLOW") {
      return "text-green-600 bg-green-50 border-green-200";
    } else {
      switch (category) {
        case "STOCK_PURCHASE":
          return "text-blue-600 bg-blue-50 border-blue-200";
        case "EXPENSE":
          return "text-red-600 bg-red-50 border-red-200";
        case "REFUND":
          return "text-red-600 bg-red-50 border-red-200";
        default:
          return "text-gray-600 bg-gray-50 border-gray-200";
      }
    }
  };

  // Simulate transaction creation for undo demo
  const simulateTransactionWithUndo = async (
    type: "INFLOW" | "OUTFLOW",
    amount: number,
    description: string
  ) => {
    try {
      // Create a mock transaction
      const newTransaction = {
        id: `temp-${Date.now()}`,
        type,
        category: type === "INFLOW" ? "CASH_DEPOSIT" : "EXPENSE",
        amount,
        description,
        createdAt: new Date().toISOString(),
        createdBy: "user",
      };

      // Add to transactions list
      setTransactions([newTransaction, ...transactions]);

      // Update balance
      const balanceChange = type === "INFLOW" ? amount : -amount;
      setDrawerBalance(drawerBalance + balanceChange);

      // Start undo countdown
      setUndoTransaction(newTransaction);
      setUndoCountdown(10); // 10 seconds countdown
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Failed to create transaction");
    }
  };

  const handleUndoTransaction = () => {
    if (undoTransaction) {
      // Remove the transaction from the list
      setTransactions(transactions.filter((t) => t.id !== undoTransaction.id));

      // Revert balance change
      const balanceChange =
        undoTransaction.type === "INFLOW"
          ? -undoTransaction.amount
          : undoTransaction.amount;
      setDrawerBalance(drawerBalance + balanceChange);

      // Clear undo state
      setUndoTransaction(null);
      setUndoCountdown(0);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-lg font-medium text-gray-600">
              Loading cash flow data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex gap-4 flex-col">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md">
              <DollarSign size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Cash Flow Management
            </h2>
          </div>
          <p className="text-gray-600">Track money inflows and outflows</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-48">
            <AdminSelect
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              options={[
                { label: "Today", value: "today" },
                { label: "This Week", value: "week" },
                { label: "This Month", value: "month" },
              ]}
              placeholder="Select period"
              fullWidth={false}
            />
          </div>
          <button
            onClick={() => {
              setModalType("inflow");
              setShowAddModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Money</span>
          </button>
          <button
            onClick={() => {
              setModalType("outflow");
              setShowExpenseModal(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Minus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>

          {/* Test Undo Buttons */}
          {/* <button
            onClick={() => simulateTransactionWithUndo('INFLOW', 100, 'Test Income')}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Test Undo
          </button> */}
        </div>
      </div>

      {/* Undo Banner */}
      {undoTransaction && undoCountdown > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Transaction added:{" "}
                  {undoTransaction.type === "INFLOW" ? "+" : "-"}
                  {formatCurrency(undoTransaction.amount)}
                </p>
                <p className="text-xs text-orange-700">
                  {undoTransaction.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full border-2 border-orange-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-600">
                      {undoCountdown}
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 rounded-full border-2 border-orange-400 animate-pulse"
                    style={{
                      animationDuration: "1s",
                    }}
                  />
                </div>
                <span className="text-xs text-orange-600 font-medium">
                  seconds to undo
                </span>
              </div>

              <button
                onClick={handleUndoTransaction}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Undo</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-orange-200 rounded-full h-1">
            <div
              className="bg-orange-500 h-1 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(undoCountdown / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={openDrawerModal}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
                  Cash Drawer
                </p>
                <p className="text-2xl font-bold text-blue-900 group-hover:text-blue-800">
                  {formatCurrency(drawerBalance)}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Click to adjust balance
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-600 group-hover:text-blue-700" />
            </div>
          </div>

          <div
            className={`rounded-xl p-6 border ${
              summary.netFlow >= 0
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
                : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    summary.netFlow >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  Net Flow
                </p>
                <p
                  className={`text-2xl font-bold ${
                    summary.netFlow >= 0 ? "text-emerald-900" : "text-red-900"
                  }`}
                >
                  {formatCurrency(summary.netFlow)}
                </p>
              </div>
              <DollarSign
                className={`w-8 h-8 ${
                  summary.netFlow >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Total Inflow
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(summary.totalInflow)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">
                  Total Outflow
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(summary.totalOutflow)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <button
              onClick={loadCashFlowData}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No transactions found</p>
              <p className="text-gray-400 text-sm">
                Start by adding money or recording an expense
              </p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-lg border ${getCategoryColor(
                        transaction.category,
                        transaction.type
                      )}`}
                    >
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDateTime(transaction.createdAt)}</span>
                        <span className="capitalize">
                          {transaction.category.replace("_", " ").toLowerCase()}
                        </span>
                        {transaction.orderId && (
                          <span className="text-blue-600">
                            Order #{transaction.orderId}
                          </span>
                        )}
                        {transaction.itemsPurchased && (
                          <span className="text-purple-600">
                            Items: {transaction.itemsPurchased}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === "INFLOW"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "INFLOW" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-sm text-gray-500">
                      by {transaction.createdBy}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Add Money to Cash Drawer
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Daily cash deposit, Float money, etc."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInflow}
                disabled={!amount || !description}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Record Expense
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-600 font-medium">
                  Available Cash Drawer Balance
                </p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(drawerBalance)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 ${
                    amount && parseFloat(amount) > drawerBalance
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-red-500 focus:border-red-500"
                  }`}
                  placeholder="0.00"
                  step="0.01"
                />
                {amount && parseFloat(amount) > drawerBalance && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Expense amount exceeds available cash drawer balance
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description/Reason
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Office supplies, Utilities, Equipment repair, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items Purchased (Optional)
                </label>
                <input
                  type="text"
                  value={itemsPurchased}
                  onChange={(e) => setItemsPurchased(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Coffee beans 5kg, Cups 200pcs, etc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for general expenses
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOutflow}
                disabled={
                  !amount ||
                  !description ||
                  (amount && parseFloat(amount) > drawerBalance)
                }
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Record Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Drawer Adjustment Modal */}
      {showDrawerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Adjust Cash Drawer Balance
              </h3>
              <button
                onClick={() => setShowDrawerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">
                  Current Balance
                </p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(drawerBalance)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Balance
                </label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  step="0.01"
                />
                {newBalance && (
                  <p
                    className={`text-sm mt-2 font-medium ${
                      parseFloat(newBalance) - drawerBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    Difference:{" "}
                    {parseFloat(newBalance) - drawerBalance >= 0 ? "+" : ""}
                    {formatCurrency(parseFloat(newBalance) - drawerBalance)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Manual count correction, Starting cash, End of day reconciliation"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-700">
                  <strong>Note:</strong> This adjustment will be recorded as a
                  transaction for audit purposes.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDrawerModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDrawerAdjustment}
                disabled={!newBalance || !adjustmentReason}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Update Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
