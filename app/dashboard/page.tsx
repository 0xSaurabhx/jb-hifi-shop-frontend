"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Clock, CheckCircle, AlertCircle, ShoppingBag } from "lucide-react"
import Link from "next/link"

// Define the order data type
type OrderData = {
  email: string
  productname: string
  price: string
  availability: string
}

export default function OrderDashboard() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Count orders by availability status
  const inStockCount = orders.filter((order) => order.availability.toLowerCase() === "in stock").length
  const outOfStockCount = orders.filter((order) => order.availability.toLowerCase() === "out of stock").length
  const pendingCount = orders.filter(
    (order) => !["in stock", "out of stock"].includes(order.availability.toLowerCase()),
  ).length

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await axios.get<OrderData[]>("https://jb-hifi-image-prod-947132053690.us-central1.run.app/ticket_data")
        setOrders(response.data)
        setError(null)
      } catch (err) {
        console.error("Error fetching order data:", err)
        setError("Failed to load order data. Please try again later.")

        // For demo purposes, set some sample data if the API call fails
        setOrders([
          {
            email: "samwin@gmail.com",
            productname: "Apple iPhone 16 128GB (Black)",
            price: "$1200",
            availability: "In stock",
          },
          {
            email: "johndoe@example.com",
            productname: "Samsung Galaxy S24 Ultra 256GB (Silver)",
            price: "$1399",
            availability: "Out of stock",
          },
          {
            email: "alice@example.com",
            productname: "Sony WH-1000XM5 Headphones",
            price: "$399",
            availability: "In stock",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Function to get status color
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus === "in stock") return "bg-green-100 text-green-800"
    if (lowerStatus === "out of stock") return "bg-red-100 text-red-800"
    return "bg-yellow-100 text-yellow-800"
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <header className="bg-yellow-300 px-4 py-3 shadow-md">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Order Dashboard</h1>
              <p className="text-sm text-gray-700">Manage and track your orders</p>
            </div>
            <Link href="/" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Status Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-green-100 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">In Stock</span>
              </div>
              <span className="rounded-full bg-green-200 px-3 py-1 text-sm font-medium text-green-800">
                ({inStockCount})
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-yellow-100 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Pending</span>
              </div>
              <span className="rounded-full bg-yellow-200 px-3 py-1 text-sm font-medium text-yellow-800">
                ({pendingCount})
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-red-100 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Out of Stock</span>
              </div>
              <span className="rounded-full bg-red-200 px-3 py-1 text-sm font-medium text-red-800">
                ({outOfStockCount})
              </span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-300 border-t-transparent"></div>
            <span className="ml-2">Loading orders...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-100 p-4 text-center text-red-800">{error}</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-yellow-50 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="mb-2 flex items-center md:mb-0">
                      <ShoppingBag className="mr-2 h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Order #{index + 1000}</h3>
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.availability)}`}
                      >
                        {order.availability}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800">{order.productname}</h4>
                    <p className="mt-1 text-lg font-bold text-black">{order.price}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between border-t border-gray-100 pt-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Customer:</span> {order.email}
                    </div>

                    <div className="mt-2 flex space-x-2 md:mt-0">
                      <button className="rounded-md bg-yellow-300 px-4 py-2 text-xs font-medium text-black hover:bg-yellow-400">
                        View Details
                      </button>
                      <button className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800">
                        Contact Customer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

