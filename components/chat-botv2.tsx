"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import axios from "axios"
import { HelpCircle, XCircle, Search, CheckCircle, ShoppingBag, Package, Tag, Clock, MapPin } from "lucide-react"

// Update the ProductSearchResponse type to include id for each product
type ProductSearchResponse = {
  text: Array<{
    productName: string
    price: string
    availability: string
    retailer: string
    id?: string // Add optional id field
  }>
}

// Commerce API types
type CommerceApiSearchResult = {
  id: string
  product: {
    name: string
  }
}

type CommerceApiProduct = {
  id: number
  brand: string
  name: string
  rating: number
  price: string
  image: string
  stock: number
}

// Update the Message type to include orderDetails
type Message = {
  id: string
  sender: "user" | "bot"
  text: string
  timestamp: Date
  suggestionButtons?: Array<{
    id: string
    text: string
    action: string
  }>
  inputField?: {
    type: "sku" | "link"
    value: string
    isActive: boolean
  }
  productResults?: Array<{
    productName: string
    price: string
    availability: string
    retailer: string
  }>
  priceComparisonTable?: {
    products: Array<{
      productName: string
      price: string
      availability: string
      retailer: string
      id?: string
    }>
    lowestPrice: string
    lowestPriceRetailer: string
    competitorPrice?: string
    savingsPercentage?: number
    selectedProductId?: string
  }
  showImage?: string
  showRecommendations?: boolean
  orderSummary?: {
    mainProduct?: {
      productName: string
      price: string
    }
    additionalProducts: RecommendedProduct[]
    totalPrice: string
  }
  orderDetails?: {
    orderId: string
    trackingId: string
    estimatedDelivery: string
    deliveryAddress: string
  }
  priceMatchOptions?: boolean
  loyaltyDiscount?: boolean
  loyaltyPoints?: {
    tier: string
    points: number
    pointsValue: string
    discountPercentage: number
  }
  waitingForEmail?: boolean
  orderCompleted?: boolean
  radioOptions?: Array<{
    id: string
    text: string
    action: string
  }>
}

// Backend response type
type ChatbotResponse = {
  text: string
  suggestionButtons?: Array<{
    text: string
    action: string
  }>
}

// Recommended product type
type RecommendedProduct = {
  id: string
  name: string
  price: string
  priceNumeric: number
  retailPrice: string
  image: string
  selected?: boolean
}

// Add state for loyalty discount selection
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hi there!\nWelcome to JB Hi-Fi - where you get the best deals always!\n\nHow can we help you today?",
      timestamp: new Date(),
      radioOptions: [
        { id: generateId(), text: "Search for Products (Agentspace API)", action: "search_agentspace_api" },
        { id: generateId(), text: "Search for Products (Commerce API)", action: "search_commerce_api" },
      ],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeInputMessageId, setActiveInputMessageId] = useState<string | null>(null)
  const [fieldInputValue, setFieldInputValue] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<{
    productName: string
    price: string
    availability: string
    retailer: string
  } | null>(null)
  // Add a state variable to track the selected product in the comparison table
  const [selectedComparisonProduct, setSelectedComparisonProduct] = useState<string | null>(null)
  console.log(selectedComparisonProduct)
  const [email, setEmail] = useState("not set")
  const [commerceApiResults, setCommerceApiResults] = useState<CommerceApiProduct[]>([])
  const [isCommerceApiLoading, setIsCommerceApiLoading] = useState(false)
  const [commerceApiError, setCommerceApiError] = useState<string | null>(null)
  const [selectedRecommendations, setSelectedRecommendations] = useState<RecommendedProduct[]>([])
  const [selectedPriceMatchOption, setSelectedPriceMatchOption] = useState<string | null>(null)
  // Add state for loyalty discount selection
  const [selectedLoyaltyOption, setSelectedLoyaltyOption] = useState<"apply" | "skip" | null>(null)
  // Add a new state variable to track if we're waiting for an email
  const [waitingForEmail, setWaitingForEmail] = useState(false)
  const [waitingForCommerceQuery, setWaitingForCommerceQuery] = useState(false)
  // Add a new state variable to track if we're showing recommendations
  const [showingRecommendations, setShowingRecommendations] = useState(false)
  // Add a state for selected post-order option
  const [selectedPostOrderOption, setSelectedPostOrderOption] = useState<string | null>(null)

  // Sample recommended products
  const recommendedProducts: RecommendedProduct[] = [
    {
      id: "1",
      name: "Galaxy Buds 4",
      price: "$200",
      priceNumeric: 200,
      retailPrice: "$299",
      image: "/galaxy_buds.png",
      selected: false,
    },
    {
      id: "2",
      name: "JBL Bluetooth Speaker",
      price: "$59",
      priceNumeric: 59,
      retailPrice: "$80",
      image: "/jbl_mini.png",
      selected: false,
    },
    {
      id: "3",
      name: "JBL Buds",
      price: "$49",
      priceNumeric: 49,
      retailPrice: "$79",
      image: "/jbl_buds.png",
      selected: false,
    },
  ]

  // API endpoint for the chatbot backend
  const CHATBOT_API_ENDPOINT = "https://jb-hifi-image-prod-947132053690.us-central1.run.app/test_message_endpoint" // Replace with your actual endpoint
  const PRODUCT_SEARCH_ENDPOINT = "https://jb-hifi-image-prod-947132053690.us-central1.run.app/search_product"
  const PRODUCT_BUY_ENDPOINT = "https://jb-hifi-image-prod-947132053690.us-central1.run.app/buy_product"
  const PRODUCT_ORDER_CONFIRM_ENDPOINT = "https://jb-hifi-image-prod-947132053690.us-central1.run.app/place_order"

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Function to generate a unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  // Function to extract numeric price from price string
  const extractNumericPrice = (priceStr: string): number => {
    const numericValue = Number.parseFloat(priceStr.replace(/[^0-9.]/g, ""))
    return isNaN(numericValue) ? 0 : numericValue
  }

  // Function to find the lowest price product
  const findLowestPriceProduct = (
    products: Array<{
      productName: string
      price: string
      availability: string
      retailer: string
      id?: string
    }>,
  ) => {
    if (!products || products.length === 0) return null

    return products.reduce((lowest, current) => {
      const lowestPrice = extractNumericPrice(lowest.price)
      const currentPrice = extractNumericPrice(current.price)
      return currentPrice < lowestPrice ? current : lowest
    }, products[0])
  }

  // Function to calculate savings percentage
  const calculateSavingsPercentage = (originalPrice: string, discountedPrice: string): number => {
    const original = extractNumericPrice(originalPrice)
    const discounted = extractNumericPrice(discountedPrice)

    if (original === 0 || discounted === 0) return 0

    const savingsPercentage = ((original - discounted) / original) * 100
    return Math.round(savingsPercentage)
  }

  // Add a helper function to check if a string is a valid email
  const isValidEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(text)
  }

  // Commerce API functions
  const fetchCommerceApiProductIds = async (query: string): Promise<CommerceApiSearchResult[]> => {
    const response = await axios.get<{ results: CommerceApiSearchResult[] }>(
      `https://jb-hifi-sfc.vercel.app/search?q=${query}&items=20`,
    )
    return response.data.results
  }

  const fetchCommerceApiProductDetails = async (productId: string): Promise<CommerceApiProduct> => {
    const response = await axios.get<CommerceApiProduct>(
      `https://jb-hifi-search-backend-947132053690.us-central1.run.app/products/${productId}`,
    )
    return response.data
  }

  const searchCommerceApi = async (query: string) => {
    setIsCommerceApiLoading(true)
    setCommerceApiError(null)
    setCommerceApiResults([])

    try {
      const searchResults = await fetchCommerceApiProductIds(query)
      if (searchResults && searchResults.length > 0) {
        const productDetailsPromises = searchResults.map((result) => fetchCommerceApiProductDetails(result.id))
        const productDetails = await Promise.all(productDetailsPromises)
        setCommerceApiResults(productDetails)
      } else {
        setCommerceApiResults([])
      }
    } catch (error) {
      console.error("Error fetching from Commerce API:", error)
      setCommerceApiError("Failed to fetch products from Commerce API. Please try again later.")
    } finally {
      setIsCommerceApiLoading(false)
    }
  }

  // Add a function to handle showing loyalty benefits after email is provided
  const showLoyaltyBenefits = () => {
    // Add loyalty discount card after login message
    const loyaltyDiscountMessage: Message = {
      id: generateId(),
      sender: "bot",
      text: "Great news! 🌟 I've found some exclusive benefits just for you based on your JB Hi-Fi loyalty status and past purchases!\n🔹 Loyalty Tier: Gold Member ✨\n🔹 Available Loyalty Points: 500 Points 🏆(Worth $5 off)\n🔹 Exclusive Discount: Extra 5% off on this order!",
      timestamp: new Date(),
      loyaltyDiscount: true,
      loyaltyPoints: {
        tier: "Gold Member",
        points: 500,
        pointsValue: "$5",
        discountPercentage: 5,
      },
    }

    // Add question about applying discount
    const loyaltyQuestionMessage: Message = {
      id: generateId(),
      sender: "bot",
      text: "Would you like to redeem your loyalty points and apply the discount before checkout?",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, loyaltyDiscountMessage, loyaltyQuestionMessage])
  }

  // Function to handle post-order option selection
  const handlePostOrderOptionSelect = (option: string) => {
    setSelectedPostOrderOption(option)

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      sender: "user",
      text: option,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Handle different options
    if (option === "Track My Order") {
      const trackingMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "I'm redirecting you to our order tracking page. You can use your Order ID and Tracking ID to check the status of your delivery.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, trackingMessage])
    } else if (option === "Explore More Deals") {
      const dealsMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "Great! Here are some of our current hot deals you might be interested in:",
        timestamp: new Date(),
        suggestionButtons: [
          { id: generateId(), text: "Weekly Specials", action: "weekly_specials" },
          { id: generateId(), text: "Clearance Items", action: "clearance_items" },
          { id: generateId(), text: "New Arrivals", action: "new_arrivals" },
        ],
      }
      setMessages((prev) => [...prev, dealsMessage])
    } else if (option === "Exit Chat") {
      const exitMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "Thank you for shopping with JB Hi-Fi! If you need any further assistance, feel free to start a new chat anytime. Have a great day!",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, exitMessage])

      // Close the chat after a short delay
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    }
  }

  // Function to send message to backend and get response
  const sendMessageToBackend = async (text: string) => {
    setIsLoading(true)

    // Check if we're waiting for an email
    if (waitingForEmail) {
      // Check if the text is a valid email
      if (isValidEmail(text)) {
        setEmail(text)
        setWaitingForEmail(false)

        // Add a confirmation message
        const confirmationMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: `Hang tight! ⏳ I'm fetching your order history,\nloyalty benefits & best price options for you...\nAlmost there!"`,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, confirmationMessage])

        // Show loyalty benefits after a short delay
        setTimeout(() => {
          showLoyaltyBenefits()
        }, 500)

        setIsLoading(false)
        return
      } else {
        // Invalid email format
        const errorMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: "That doesn't look like a valid email address. Please try again.",
          timestamp: new Date(),
          waitingForEmail: true,
        }

        setMessages((prev) => [...prev, errorMessage])
        setIsLoading(false)
        return
      }
    }

    try {
      // Send request to backend API
      console.log(text)

      const gmailRegex = /([a-zA-Z0-9._%+-]+)@gmail\.com/

      // Check if the text contains a Gmail address
      const match = text.match(gmailRegex)

      if (match) {
        // If a Gmail address is found, extract and log it
        const gmailAddress = match[0]
        console.log("Found Gmail address:", gmailAddress)
        setEmail(gmailAddress)
        const suggestionButtons = [
          {
            text: "Bank Transfer",
            action: "order_pay",
          },
          {
            text: "Debit Card",
            action: "order_pay",
          },
        ]

        await axios.post(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
          productName: selectedProduct?.productName,
          price: selectedProduct?.price,
          availability: selectedProduct?.availability,
          email: email,
        })

        // First show recommendations
        const recommendationsMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: "Before we finalize your order, check out these top picks that go perfectly with your purchase!",
          timestamp: new Date(),
          showRecommendations: true,
        }

        setMessages((prev) => [...prev, recommendationsMessage])

        // Calculate the total price
        const mainProductPrice = selectedProduct ? Number.parseFloat(selectedProduct.price.replace(/[^0-9.]/g, "")) : 0
        const recommendationsTotal = selectedRecommendations.reduce((sum, p) => sum + p.priceNumeric, 0)
        const totalPrice = mainProductPrice + recommendationsTotal

        // Then show payment options with order summary
        const botResponse: Message = {
          id: generateId(),
          sender: "bot",
          text: "Great, you have been logged in. How would you like to pay for your order?",
          timestamp: new Date(),
          suggestionButtons: suggestionButtons?.map((btn) => ({
            id: generateId(),
            text: btn.text,
            action: btn.action,
          })),
          orderSummary: {
            mainProduct: selectedProduct
              ? {
                  productName: selectedProduct.productName,
                  price: selectedProduct.price,
                }
              : undefined,
            additionalProducts: selectedRecommendations,
            totalPrice: `$${totalPrice.toFixed(2)}`,
          },
        }

        setTimeout(() => {
          setMessages((prev) => [...prev, botResponse])
        }, 500)

        return
      }

      if (text.toLowerCase().includes("price match")) {
        console.log("price match detected")
        generateWorkflowTemplate(text)
        return
      }

      const response = await axios.post<ChatbotResponse>(CHATBOT_API_ENDPOINT, {
        message: text,
        messageHistory: messages.map((msg) => ({
          sender: msg.sender,
          text: msg.text,
        })),
        flag: false,
      })

      // Process the response from the backend
      const botResponse: Message = {
        id: generateId(),
        sender: "bot",
        text: response.data.text,
        timestamp: new Date(),
        suggestionButtons: response.data.suggestionButtons?.map((btn) => ({
          id: generateId(),
          text: btn.text,
          action: btn.action,
        })),
      }

      setMessages((prev) => [...prev, botResponse])
    } catch (error) {
      console.error("Error sending message to backend:", error)

      // Fallback to dummy responses if the API call fails
      generateWorkflowTemplate(text)
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handlePriceMatchOptionSelect function to map to checkout
  const handlePriceMatchOptionSelect = (option: string) => {
    setSelectedPriceMatchOption(option)

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      sender: "user",
      text: option === "checkout" ? "Checkout with matched price" : "Reserve my price for 30 min",
      timestamp: new Date(),
    }

    if (option === "checkout") {
      // Call the checkout action directly
      handleSuggestionClick(generateId(), "Proceed to checkout", "checkout")
    } else {
      // Create bot response for reservation
      const botResponse: Message = {
        id: generateId(),
        sender: "bot",
        text: "Perfect! I've reserved this price match for you for the next 30 minutes.",
        timestamp: new Date(),
        suggestionButtons: [
          { id: generateId(), text: "Continue shopping", action: "continue_shopping" },
          { id: generateId(), text: "View my reservations", action: "view_reservations" },
        ],
      }

      setMessages((prev) => [...prev, userMessage, botResponse])
    }
  }

  // Add a function to handle product selection in the comparison table
  const handleComparisonProductSelect = (product: {
    id?: string
    productName: string
    price: string
    availability: string
    retailer: string
  }) => {
    // Ensure id is defined, use a fallback if it's not
    const productId = product.id || generateId()
    setSelectedComparisonProduct(productId)
    setSelectedProduct({
      productName: product.productName,
      price: product.price,
      availability: product.availability,
      retailer: product.retailer,
    })

    // Update the messages to reflect the new selection
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.priceComparisonTable) {
          return {
            ...msg,
            priceComparisonTable: {
              ...msg.priceComparisonTable,
              selectedProductId: productId,
            },
          }
        }
        return msg
      }),
    )
  }

  // Function to send message from button to backend
  const sendMessageButtonToBackend = async (text: string) => {
    setIsLoading(true)
    console.log("sent message from button")
    try {
      // Send request to backend API
      console.log(text)

      if (text.toLowerCase().includes("order_pay")) {
        const response = await axios.post(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
          productName: selectedProduct?.productName,
          price: selectedProduct?.price,
          availability: selectedProduct?.availability,
          email: email,
        })

        if (response.data.text == "pass") {
          console.log("added data into bigquery")
        }

        // Calculate the total price
        const mainProductPrice = selectedProduct ? Number.parseFloat(selectedProduct.price.replace(/[^0-9.]/g, "")) : 0
        const recommendationsTotal = selectedRecommendations.reduce((sum, p) => sum + p.priceNumeric, 0)
        const totalPrice = mainProductPrice + recommendationsTotal

        // Create success message
        // const successMessage: Message = {
        //   id: generateId(),
        //   sender: "bot",
        //   text: "Success! Your order has been placed successfully. 🎉 Thanks for shopping with JB Hi-Fi!",
        //   timestamp: new Date(),
        //   orderCompleted: true,
        // }

        // Create order details message
        const orderDetailsMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: "Success! Your order has been placed successfully. 🎉 Thanks for shopping with JB Hi-Fi!",
          timestamp: new Date(),
          orderDetails: {
            orderId: "#12345678",
            trackingId: "TRK977654321",
            estimatedDelivery: "3-5 Business Days",
            deliveryAddress: "42 Kangaroo St, Sydney",
          },
          orderSummary: {
            mainProduct: selectedProduct
              ? {
                  productName: selectedProduct.productName,
                  price: selectedProduct.price,
                }
              : undefined,
            additionalProducts: selectedRecommendations,
            totalPrice: `$${totalPrice.toFixed(2)}`,
          },
        }

        // Create follow-up message with options
        const followUpMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: "You'll receive a confirmation email shortly with all the details.",
          timestamp: new Date(),
          radioOptions: [
            { id: generateId(), text: "Explore More Deals", action: "explore_deals" },
            { id: generateId(), text: "Exit Chat", action: "exit_chat" },
          ],
        }

        // Add all messages to the chat
        setMessages((prev) => [...prev, orderDetailsMessage, followUpMessage])
        return
      }

      if (text.toLowerCase().includes("price match")) {
        console.log("price match detected")
        generateWorkflowTemplate(text)
        return
      }

      // Modify the sendMessageButtonToBackend function to handle the checkout flow correctly
      // Find the section that handles checkout and replace it with this updated logic:
      if (text.toLowerCase().includes("checkout")) {
        console.log("checkout action detected")

        // If we're already showing recommendations and the user clicks "Proceed to Checkout"
        // then proceed to payment options
        if (showingRecommendations) {
          setShowingRecommendations(false)

          // Calculate the total price
          const mainProductPrice = selectedProduct
            ? Number.parseFloat(selectedProduct.price.replace(/[^0-9.]/g, ""))
            : 0
          const recommendationsTotal = selectedRecommendations.reduce((sum, p) => sum + p.priceNumeric, 0)

          // Apply discount if selected
          let totalPrice = mainProductPrice + recommendationsTotal
          let discountApplied = false
          console.log(discountApplied)
          if (selectedLoyaltyOption === "apply") {
            totalPrice -= 5 // Apply $5 discount
            discountApplied = true
          }

          const suggestionButtons = [
            {
              text: "Bank Transfer",
              action: "order_pay",
            },
            {
              text: "Debit Card",
              action: "order_pay",
            },
          ]

          const botResponse: Message = {
            id: generateId(),
            sender: "bot",
            text: `Here's a quick review of your order before placing it.\nHow would you like to pay for your order?`,
            timestamp: new Date(),
            suggestionButtons: suggestionButtons?.map((btn) => ({
              id: generateId(),
              text: btn.text,
              action: btn.action,
            })),
            orderSummary: {
              mainProduct: selectedProduct
                ? {
                    productName: selectedProduct.productName,
                    price: selectedProduct.price,
                  }
                : undefined,
              additionalProducts: selectedRecommendations,
              totalPrice: `$${totalPrice.toFixed(2)}`,
            },
          }
          setMessages((prev) => [...prev, botResponse])
          return
        }

        // First checkout step - check if user is logged in
        const response = await axios.post(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
          productName: selectedProduct?.productName,
          price: selectedProduct?.price,
          availability: selectedProduct?.availability,
          email: email,
        })

        console.log(response.data.text)
        if (response.data.text === "fail") {
          // Set waiting for email flag
          setWaitingForEmail(true)

          const botResponse: Message = {
            id: generateId(),
            sender: "bot",
            text: "Oops! You need to log in before placing an order. Please enter your email address and verify your account using the link sent to your email.",
            timestamp: new Date(),
            waitingForEmail: true,
          }

          setMessages((prev) => [...prev, botResponse])
        } else {
          // Show only recommendations first
          setShowingRecommendations(true)

          const recommendationsMessage: Message = {
            id: generateId(),
            sender: "bot",
            text: "Before we finalize your order, check out these top picks that go perfectly with your purchase!",
            timestamp: new Date(),
            showRecommendations: true,
          }

          setMessages((prev) => [...prev, recommendationsMessage])
        }
        return
      }

      const response = await axios.post<ChatbotResponse>(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
        productName: text,
        flag: false,
      })

      // Process the response from the backend
      const botResponse: Message = {
        id: generateId(),
        sender: "bot",
        text: response.data.text,
        timestamp: new Date(),
        suggestionButtons: response.data.suggestionButtons?.map((btn) => ({
          id: generateId(),
          text: btn.text,
          action: btn.action,
        })),
      }

      setMessages((prev) => [...prev, botResponse])
    } catch (error) {
      console.error("Error sending message to backend:", error)

      // Fallback to dummy responses if the API call fails
      generateWorkflowTemplate(text)
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback function to provide dummy responses if the API call fails
  const generateWorkflowTemplate = (text: string) => {
    if (text.toLowerCase().includes("price match")) {
      // First message - price match instructions
      const priceMatchMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "To process your price match request, please provide: \n✔ SKU Code (or product link) \n✔ Retailer Name \n✔ Product price",
        timestamp: new Date(),
        suggestionButtons: [
          { id: generateId(), text: "Provide SKU", action: "provide_sku" },
          { id: generateId(), text: "Provide link", action: "provide_link" },
        ],
      }

      // Second message - help finding SKU
      const skuHelpMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "Need help finding the SKU? Check the image below! 🔍",
        timestamp: new Date(),
      }

      // Third message - SKU image
      const skuImageMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "",
        timestamp: new Date(),
        showImage: "/amazon_sku.png",
      }

      // Add all three messages with a slight delay between them
      setMessages((prev) => [...prev, priceMatchMessage])

      setTimeout(() => {
        setMessages((prev) => [...prev, skuHelpMessage])
      }, 300)

      setTimeout(() => {
        setMessages((prev) => [...prev, skuImageMessage])
      }, 600)
    } else {
      const response: Message = {
        id: generateId(),
        sender: "bot",
        text: "Thanks for your message! How else can I help you today?",
        timestamp: new Date(),
        suggestionButtons: [{ id: generateId(), text: "Speak to a human", action: "speak_to_human" }],
      }

      setMessages((prev) => [...prev, response])
    }
  }

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isLoading) return

    const newMessage: Message = {
      id: generateId(),
      sender: "user",
      text: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")

    if (waitingForCommerceQuery) {
      setWaitingForCommerceQuery(false) // Reset the flag
      // Update the last bot message (which was the input field) to show the user's query
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.inputField?.isActive) {
            return { ...msg, text: `${msg.text}\nYour search: ${newMessage.text}`, inputField: { ...msg.inputField, isActive: false } }
          }
          return msg
        }),
      )
      await searchCommerceApi(newMessage.text)
    } else {
      await sendMessageToBackend(newMessage.text)
    }
  }

  // Function to handle quick action buttons
  const handleQuickAction = async (action: string) => {
    let actionText = ""

    switch (action) {
      case "price_match":
        actionText = "I need help with a price match"
        break
      case "ask_question":
        actionText = "I have a question"
        break
      default:
        actionText = action
    }

    const newMessage: Message = {
      id: generateId(),
      sender: "user",
      text: actionText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    await sendMessageToBackend(actionText)
  }

  // Function to handle suggestion button clicks
  const handleSuggestionClick = async (messageId: string, text: string, action: string) => {
    // For provide_sku and provide_link actions, transform the current message card
    if (action === "provide_sku" || action === "provide_link") {
      setActiveInputMessageId(messageId)
    } else if (action === "search_commerce_api") {
      // Handle Commerce API search
      const newMessage: Message = {
        id: generateId(),
        sender: "user",
        text: "Search for Products (Commerce API)",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      // We need to ask the user for the search query
      const queryRequestMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "Sure! What product are you looking for?",
        timestamp: new Date(),
        // We'll use the existing input field, but set a flag to know we're expecting a commerce search query
        inputField: { type: "text" as any, value: "", isActive: true }, // Cast to any to allow 'text'
      }
      setMessages((prev) => [...prev, queryRequestMessage])
      // We'll set a state to indicate that the next user input is for Commerce API search
      // This will be handled in `handleSendMessage`
      setWaitingForCommerceQuery(true) // Need to add this state variable
    } else if (action === "search_agentspace_api") {
      // Handle Agentspace API search (similar to existing logic or ask for query)
      const newMessage: Message = {
        id: generateId(),
        sender: "user",
        text: "Search for Products (Agentspace API)",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      // Placeholder: Add logic to ask for query or proceed if not needed
      const queryRequestMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "Sure! What product are you looking for (Agentspace)?",
        timestamp: new Date(),
        inputField: { type: "text" as any, value: "", isActive: true },
      }
      setMessages((prev) => [...prev, queryRequestMessage])
      // setWaitingForAgentspaceQuery(true); // Optional: if you want to handle it similarly
      setFieldInputValue("")

      // Update the message to include an input field
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              inputField: {
                type: action === "provide_sku" ? "sku" : "link",
                value: "",
                isActive: true,
              },
              // Remove suggestion buttons when input field is active
              suggestionButtons: [],
            }
          }
          return msg
        }),
      )
    } else {
      // For other actions, proceed with the normal flow
      const newMessage: Message = {
        id: generateId(),
        sender: "user",
        text: text,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, newMessage])
      console.log(`the button clicked is ${action}`)
      await sendMessageButtonToBackend(action)
    }
  }

  // Function to handle input field changes in message cards
  const handleFieldInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldInputValue(e.target.value)
  }

  // Update the handleBuyProduct function parameter type
  const handleBuyProduct = async (product: {
    productName: string
    price: string
    availability: string
    retailer: string
  }) => {
    setIsLoading(true)

    setSelectedProduct(product)

    try {
      // Send request to buy product
      const response = await axios.post(PRODUCT_BUY_ENDPOINT, {
        productName: product.productName,
        price: product.price,
        availability: product.availability,
        retailer: product.retailer,
      })

      console.log(`product purchased ${response}`)
      // Add a message from the user
      const userMessage: Message = {
        id: generateId(),
        sender: "user",
        text: `I want to buy: ${product.productName}`,
        timestamp: new Date(),
      }

      // Add a response from the bot
      const botResponse: Message = {
        id: generateId(),
        sender: "bot",
        text: `Great choice! I've added ${product.productName} to your cart. The price is ${product.price} from ${product.retailer}.\n\nWould you like to continue shopping or proceed to checkout?`,
        timestamp: new Date(),
        suggestionButtons: [
          { id: generateId(), text: "Continue shopping", action: "continue_shopping" },
          { id: generateId(), text: "Proceed to checkout", action: "checkout" },
        ],
      }

      setMessages((prev) => [...prev, userMessage, botResponse])
    } catch (error) {
      console.error("Error buying product:", error)

      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "Sorry, there was an error processing your request. Please try again later.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle adding a recommended product
  const handleAddRecommendedProduct = (product: RecommendedProduct) => {
    // Add the product to selected recommendations
    setSelectedRecommendations((prev) => {
      // Check if product is already selected
      if (prev.some((p) => p.id === product.id)) {
        return prev // Product already selected
      }
      return [...prev, product]
    })

    // Calculate the total price
    const mainProductPrice = selectedProduct ? Number.parseFloat(selectedProduct.price.replace(/[^0-9.]/g, "")) : 0
    const recommendationsTotal = [...selectedRecommendations, product].reduce((sum, p) => sum + p.priceNumeric, 0)
    const totalPrice = mainProductPrice + recommendationsTotal

    // Create confirmation message
    const userMessage: Message = {
      id: generateId(),
      sender: "user",
      text: `I'd like to add ${product.name} to my order.`,
      timestamp: new Date(),
    }

    // Create order summary message
    const orderSummaryMessage: Message = {
      id: generateId(),
      sender: "bot",
      text: `Great! I've added ${product.name} to your order.`,
      timestamp: new Date(),
      orderSummary: {
        mainProduct: selectedProduct
          ? {
              productName: selectedProduct.productName,
              price: selectedProduct.price,
            }
          : undefined,
        additionalProducts: [...selectedRecommendations, product],
        totalPrice: `$${totalPrice.toFixed(2)}`,
      },
      suggestionButtons: [
        { id: generateId(), text: "Bank Transfer", action: "order_pay" },
        { id: generateId(), text: "Debit Card", action: "order_pay" },
      ],
    }

    setMessages((prev) => [...prev, userMessage, orderSummaryMessage])
  }

  // Function to submit the input field value and search for products
  const sendProductSkuOrLink = async (messageId: string, type: "sku" | "link") => {
    if (fieldInputValue.trim() === "" || isLoading) return

    setIsLoading(true)

    try {
      // Update the message to show the submitted value
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              text: `${msg.text}\n\n${type === "sku" ? "SKU" : "Link"}: ${fieldInputValue}`,
              inputField: {
                ...msg.inputField!,
                value: fieldInputValue,
                isActive: false,
              },
            }
          }
          return msg
        }),
      )

      // Reset the active input message
      setActiveInputMessageId(null)

      // Extract SKU or link from user input
      let extractedValue = "Not found"

      if (type === "sku") {
        // Regex to find SKU pattern (letters followed by hyphen and numbers)
        const skuRegex = /([A-Za-z]+[-][A-Za-z0-9]+)/
        const skuMatch = fieldInputValue.match(skuRegex)
        extractedValue = skuMatch ? skuMatch[0] : fieldInputValue
      } else {
        // Regex to find URL pattern (starting with http)
        const urlRegex = /(https?:\/\/[^\s]+)/
        const urlMatch = fieldInputValue.match(urlRegex)
        extractedValue = urlMatch ? urlMatch[0] : fieldInputValue
      }

      // Extract price from user input if it exists
      const priceRegex = /\$\s*([0-9,]+(\.[0-9]{1,2})?)/
      const priceMatch = fieldInputValue.match(priceRegex)
      const extractedPrice = priceMatch ? priceMatch[0] : "NA"

      // Add confirmation message that repeats back the information
      const confirmationMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: `Got it! You're requesting a price match for:\n🔹 ${type === "sku" ? "SKU" : "Link"}: ${extractedValue}\n🔹 Retailer: JB HiFi\n🔹 Competitor's Price: ${extractedPrice}`,
        timestamp: new Date(),
      }

      // Add "checking" message
      const checkingMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: `Let me check the best possible deal for you... ⌛`,
        timestamp: new Date(),
      }

      // Add both messages to the chat
      setMessages((prev) => [...prev, confirmationMessage, checkingMessage])

      // Send the value to the backend
      const response = await axios.post<ProductSearchResponse>(PRODUCT_SEARCH_ENDPOINT, {
        query: fieldInputValue,
        type: type,
      })

      console.log("Product search response:", response.data)

      // Update the sendProductSkuOrLink function to add IDs to products
      // Find where you process the product search response and modify it:
      // Create a new message with the product results
      const productResults = response.data.text.map((product) => ({
        ...product,
        id: product.id || generateId(), // Use existing id if available, otherwise generate a new one
      }))

      if (productResults && productResults.length > 0) {
        // Find the lowest price product
        const lowestPriceProduct = findLowestPriceProduct(productResults)
        const lowestPriceProductId = lowestPriceProduct?.id || generateId()

        // Calculate savings percentage if competitor price was provided
        const savingsPercentage =
          extractedPrice !== "NA" ? calculateSavingsPercentage(extractedPrice, lowestPriceProduct?.price || "0") : 0

        // Set the selected product to the lowest price product
        setSelectedProduct(lowestPriceProduct)
        setSelectedComparisonProduct(lowestPriceProductId)

        // Add initial comparison message
        const initialComparisonMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: `You're in luck! 🚀 After comparing prices across multiple approved retailers, I've found the best deal for you. We're matching the price of ${lowestPriceProduct?.price}, and here's how you can save an extra 5%! But hurry—this price match is valid for a limited time. What would you like to do next?`,
          timestamp: new Date(),
          priceComparisonTable: {
            products: productResults,
            lowestPrice: lowestPriceProduct?.price || "N/A",
            lowestPriceRetailer: lowestPriceProduct?.retailer || "N/A",
            competitorPrice: extractedPrice !== "NA" ? extractedPrice : undefined,
            savingsPercentage: savingsPercentage > 0 ? savingsPercentage : undefined,
            selectedProductId: lowestPriceProductId,
          },
          priceMatchOptions: true,
        }

        setMessages((prev) => [...prev, initialComparisonMessage])
      } else {
        // No products found
        const noProductsMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: "Sorry, I couldn't find any matching products. Please check the SKU or link and try again.",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, noProductsMessage])
      }
    } catch (error) {
      console.error("Error searching for product:", error)

      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "Sorry, there was an error processing your request. Please try again later.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle key press in the input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  // Function to handle key press in the input field of message cards
  const handleFieldKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, messageId: string, type: "sku" | "link") => {
    if (e.key === "Enter") {
      sendProductSkuOrLink(messageId, type)
    }
  }

  // Update the handleLoyaltyOptionSelect function to work with the new flow
  const handleLoyaltyOptionSelect = (option: "apply" | "skip") => {
    setSelectedLoyaltyOption(option)

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      sender: "user",
      text: option === "apply" ? "Apply Discount & Use My Points" : "Skip & Proceed to Checkout",
      timestamp: new Date(),
    }

    // Add the user message to the chat
    setMessages((prev) => [...prev, userMessage])

    // Call the checkout action
    sendMessageButtonToBackend("checkout")
  }

  // Replace the entire return statement at the end of the file with this clean implementation:

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="flex h-[625px] w-[440px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b  px-4 py-3">
            <div className="flex items-center">
              <div className="mr-2 h-8 w-8 rounded-full bg-yellow-200">
                <div className="relative left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
                  <Image
                    src="/jb.png"
                    width={20}
                    height={20}
                    alt="JB Bot"
                    className="h-full w-full"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">JB Chat Bot</h3>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full bg-yellow-300 hover:bg-yellow-400">
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 flex ${message.sender === "user" ? "justify-end" : ""}`}>
                {message.sender === "bot" && (
                  <div className="mr-2 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-yellow-200">
                      <div className="relative left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
                        <Image
                          src="/jb.png"
                          width={20}
                          height={20}
                          alt="JB Bot"
                          className="h-full w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                    message.sender === "user" ? "bg-yellow-300 text-black" : "bg-white text-black"
                  } ${message.orderCompleted ? "bg-green-50" : ""}`}
                >
                  {message.loyaltyDiscount && message.loyaltyPoints ? (
                    <div className="">
                      <p className="whitespace-pre-line text-sm">{message.text}</p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-sm">{message.text}</p>
                  )}

                  {message.showImage && (
                    <div className="mt-2">
                      <Image
                        src={message.showImage || "/placeholder.svg"}
                        width={300}
                        height={200}
                        alt="SKU Example"
                        className="rounded-md"
                      />
                    </div>
                  )}

                  {message.priceComparisonTable && (
                    <div className="mt-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-yellow-100">
                            <tr>
                              <th className="py-1 px-2 text-left">Product</th>
                              <th className="py-1 px-2 text-left">Price</th>
                              <th className="py-1 px-2 text-left">Retailer</th>
                              <th className="py-1 px-2 text-left">Availability</th>
                            </tr>
                          </thead>
                          <tbody>
                            {message.priceComparisonTable.products.map((product, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? "bg-yellow-50" : "bg-white"}>
                                <td className="py-1 px-2">
                                  <div className="flex items-start">
                                    <input
                                      type="radio"
                                      name={`product-selection-${message.id}`}
                                      checked={product.id === message.priceComparisonTable?.selectedProductId}
                                      onChange={() => handleComparisonProductSelect(product)}
                                      className="h-3 w-3 mr-2 mt-1 text-yellow-500 focus:ring-yellow-400"
                                    />
                                    <div className="break-words">{product.productName}</div>
                                  </div>
                                </td>
                                <td className="py-1 px-2 font-medium whitespace-nowrap">{product.price}</td>
                                <td className="py-1 px-2 whitespace-nowrap">{product.retailer}</td>
                                <td className="py-1 px-2 whitespace-nowrap">
                                  {product.availability.toLowerCase() === "in stock" ? (
                                    <span className="text-green-600">{product.availability}</span>
                                  ) : (
                                    <span className="text-red-600">{product.availability}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {message.priceComparisonTable.competitorPrice && (
                        <div className="mt-2 text-xs font-medium text-yellow-800">
                          <span className="inline-block w-3 h-3 bg-yellow-400 rounded-sm mr-1"></span>
                          Competitor&apos;s Price: {message.priceComparisonTable.competitorPrice}
                        </div>
                      )}
                    </div>
                  )}

                  {message.priceMatchOptions && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="checkout-option"
                          name="price-match-option"
                          className="h-4 w-4 text-yellow-500 focus:ring-yellow-400"
                          checked={selectedPriceMatchOption === "checkout"}
                          onChange={() => handlePriceMatchOptionSelect("checkout")}
                        />
                        <label htmlFor="checkout-option" className="text-sm">
                          Checkout with matched price
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="reserve-option"
                          name="price-match-option"
                          className="h-4 w-4 text-yellow-500 focus:ring-yellow-400"
                          checked={selectedPriceMatchOption === "reserve"}
                          onChange={() => handlePriceMatchOptionSelect("reserve")}
                        />
                        <label htmlFor="reserve-option" className="text-sm">
                          Reserve my price for 30 min
                        </label>
                      </div>
                    </div>
                  )}

                  {message.showRecommendations && (
                    <div className="mt-4">
                      <div className="overflow-x-auto pb-2">
                        <div className="flex space-x-3" style={{ minWidth: "min-content" }}>
                          {recommendedProducts.map((product) => (
                            <div
                              key={product.id}
                              className="rounded-md border border-gray-200 bg-white p-3 shadow-sm flex-shrink-0"
                              style={{ width: "200px" }}
                            >
                              <div className="flex flex-col items-center">
                                <div className="h-24 w-24 flex-shrink-0 mb-2">
                                  <Image
                                    src={product.image || "/placeholder.svg"}
                                    width={96}
                                    height={96}
                                    alt={product.name}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <div className="text-center">
                                  <h4 className="text-sm font-medium">{product.name}</h4>
                                  <div className="flex items-center justify-center mt-1">
                                    <span className="text-sm font-bold text-black">{product.price}</span>
                                    <span className="ml-2 text-xs text-gray-500 line-through">
                                      {product.retailPrice}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
                                <button
                                  className="w-full rounded-md bg-yellow-300 px-3 py-2 text-xs font-medium text-black hover:bg-yellow-400"
                                  onClick={() => handleAddRecommendedProduct(product)}
                                >
                                  Add To My Order
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          className="w-full rounded-md bg-yellow-300 text-black px-3 py-2 text-xs font-medium hover:bg-yellow-400"
                          onClick={() => handleSuggestionClick(message.id, "Proceed to checkout", "checkout")}
                        >
                          Proceed To Checkout
                        </button>
                      </div>
                    </div>
                  )}

                  {message.orderDetails && (
                    <div className="mt-3 bg-yellow-50 rounded-md p-3 border border-yellow-200">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-yellow-600" />
                          <span className="text-sm font-medium">Order ID: {message.orderDetails.orderId}</span>
                        </div>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-yellow-600" />
                          <span className="text-sm">Tracking ID: {message.orderDetails.trackingId}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                          <span className="text-sm">Estimated Delivery: {message.orderDetails.estimatedDelivery}</span>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-yellow-600" />
                          <span className="text-sm">Delivery Address: {message.orderDetails.deliveryAddress}</span>
                        </div>

                        {message.orderSummary && (
                          <div className="mt-3 pt-2 border-t border-yellow-300">
                            <h4 className="font-medium text-sm mb-2">Your Order Details:</h4>
                            {message.orderSummary.mainProduct && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs">{message.orderSummary.mainProduct.productName}</span>
                                <span className="text-xs font-medium">{message.orderSummary.mainProduct.price}</span>
                              </div>
                            )}

                            {message.orderSummary.additionalProducts.map((product, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-xs">{product.name}</span>
                                <span className="text-xs font-medium">{product.price}</span>
                              </div>
                            ))}

                            <div className="border-t border-yellow-300 pt-2 mt-2 flex justify-between items-center">
                              <span className="text-sm font-bold">Total</span>
                              <span className="text-sm font-bold">{message.orderSummary.totalPrice}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Display Commerce API Results */}
                  {isCommerceApiLoading && message.id === messages[messages.length - 1].id && (
                    <div className="mt-3">
                      <p className="text-sm">Searching for products...</p>
                      {/* You can add a spinner or loading animation here */}
                    </div>
                  )}
                  {commerceApiError && message.id === messages[messages.length - 1].id && (
                    <div className="mt-3 text-red-600">
                      <p className="text-sm">{commerceApiError}</p>
                    </div>
                  )}
                  {commerceApiResults.length > 0 && message.id === messages[messages.length -1].id && !isCommerceApiLoading && !commerceApiError && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium">Here are the products I found (Commerce API):</p>
                      {commerceApiResults.map((product) => (
                        <div key={product.id} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                          <div className="flex items-center mb-2">
                            <Image
                              src={product.image || "/default-image.png"} // Use a default image if none provided
                              alt={product.name}
                              width={60}
                              height={60}
                              className="object-contain rounded-md mr-3"
                            />
                            <div>
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-600">{product.brand}</div>
                            </div>
                          </div>
                          <div className="mb-1 text-sm font-bold text-black">Price: ${product.price}</div>
                          <div className="text-xs text-gray-600">Rating: {product.rating}/5</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs">
                              {product.stock > 0 ? (
                                <span className="text-green-600">In Stock ({product.stock})</span>
                              ) : (
                                <span className="text-red-600">Out of Stock</span>
                              )}
                            </div>
                            <button
                              // onClick={() => handleBuyCommerceProduct(product)} // TODO: Implement this if needed
                              disabled={product.stock <= 0}
                              className={`flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
                                product.stock > 0
                                  ? "bg-yellow-300 text-black hover:bg-yellow-400"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              <ShoppingBag className="mr-1 h-3 w-3" />
                              {product.stock > 0 ? "Buy Now" : "Out of Stock"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}


                  {message.orderSummary && !message.orderDetails && (
                    <div className="mt-3 bg-yellow-50 rounded-md p-3 border border-yellow-200">
                      <h4 className="font-medium text-sm mb-2">Order Summary</h4>
                      <div className="space-y-2">
                        {message.orderSummary.mainProduct && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs">{message.orderSummary.mainProduct.productName}</span>
                            <span className="text-xs font-medium">{message.orderSummary.mainProduct.price}</span>
                          </div>
                        )}

                        {message.orderSummary.additionalProducts.map((product, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-xs">{product.name}</span>
                            <span className="text-xs font-medium">{product.price}</span>
                          </div>
                        ))}

                        <div className="border-t border-yellow-300 pt-2 mt-2 flex justify-between items-center">
                          <span className="text-sm font-bold">Total</span>
                          <span className="text-sm font-bold">{message.orderSummary.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.radioOptions && (
                    <div className="mt-3 space-y-2">
                      {message.radioOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2 p-2 bg-white rounded-md">
                          <input
                            type="radio"
                            id={option.id}
                            name="post-order-option"
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-400"
                            checked={selectedPostOrderOption === option.text}
                            onChange={() => handlePostOrderOptionSelect(option.text)}
                          />
                          <label htmlFor={option.id} className="text-sm">
                            {option.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.productResults && message.productResults.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.productResults.map((product, index) => (
                        <div key={index} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                          <div className="mb-2 font-medium">{product.productName}</div>
                          <div className="mb-1 text-sm font-bold text-black">{product.price}</div>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center text-xs">
                              {product.availability.toLowerCase() === "in stock" ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                                  <span className="text-green-600">{product.availability}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1 h-3 w-3 text-red-500" />
                                  <span className="text-red-600">{product.availability}</span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-600">{product.retailer}</div>
                          </div>
                          <button
                            onClick={() => handleBuyProduct(product)}
                            disabled={product.availability.toLowerCase() !== "in stock"}
                            className={`flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
                              product.availability.toLowerCase() === "in stock"
                                ? "bg-yellow-300 text-black hover:bg-yellow-400"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <ShoppingBag className="mr-1 h-3 w-3" />
                            {product.availability.toLowerCase() === "in stock" ? "Buy Now" : "Out of Stock"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.inputField?.isActive && (
                    <div className="mt-3">
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder={
                            message.inputField.type === "sku" ? "Enter product SKU..." : "Enter competitor's link..."
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm truncate overflow-hidden"
                          value={fieldInputValue}
                          onChange={handleFieldInputChange}
                          onKeyDown={(e) => handleFieldKeyPress(e, message.id, message.inputField!.type)}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => sendProductSkuOrLink(message.id, message.inputField!.type)}
                        disabled={fieldInputValue.trim() === "" || isLoading}
                        className={`w-full rounded-md px-3 py-1.5 text-xs font-medium ${
                          fieldInputValue.trim() === "" || isLoading
                            ? "bg-yellow-200 text-gray-500"
                            : "bg-yellow-300 text-black hover:bg-yellow-400"
                        }`}
                      >
                        {message.inputField.type === "sku" ? "Submit SKU" : "Submit Link"}
                      </button>
                    </div>
                  )}

                  {message.suggestionButtons && message.suggestionButtons.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {message.suggestionButtons.map((button) => (
                        <button
                          key={button.id}
                          onClick={() => handleSuggestionClick(message.id, button.text, button.action)}
                          className="w-full rounded-full border border-yellow-400 bg-yellow-300 px-3 py-1.5 text-xs font-medium text-black hover:bg-yellow-400"
                        >
                          {button.text}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.text ===
                    "Would you like to redeem your loyalty points and apply the discount before checkout?" && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-white rounded-md">
                        <input
                          type="radio"
                          id="apply-discount"
                          name="loyalty-option"
                          className="h-4 w-4 text-yellow-500 focus:ring-yellow-400"
                          checked={selectedLoyaltyOption === "apply"}
                          onChange={() => handleLoyaltyOptionSelect("apply")}
                        />
                        <label htmlFor="apply-discount" className="text-sm">
                          Apply Discount & Use My Points
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-white rounded-md">
                        <input
                          type="radio"
                          id="skip-discount"
                          name="loyalty-option"
                          className="h-4 w-4 text-yellow-500 focus:ring-yellow-400"
                          checked={selectedLoyaltyOption === "skip"}
                          onChange={() => handleLoyaltyOptionSelect("skip")}
                        />
                        <label htmlFor="skip-discount" className="text-sm">
                          Skip & Proceed to Checkout
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-4 flex">
                <div className="mr-2 h-8 w-8">
                  <div className="h-8 w-8 rounded-full bg-yellow-200">
                    <div className="relative left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
                      <Image
                        src="/jb.png"
                        width={20}
                        height={20}
                        alt="JB Bot"
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="max-w-[80%] rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {messages.length <= 2 && !isLoading && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleQuickAction("price_match")}
                  className="flex w-full items-center gap-2 rounded-full border border-yellow-400 bg-yellow-300 px-4 py-2 text-sm font-medium"
                >
                  <Search className="h-4 w-4" />
                  <span>Request a price match</span>
                </button>
                <button
                  onClick={() => handleQuickAction("ask_question")}
                  className="flex w-full items-center gap-2 rounded-full border border-yellow-400 bg-yellow-300 px-4 py-2 text-sm font-medium"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-black text-xs">
                    ?
                  </span>
                  <span>Ask a question</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t p-3">
            <input
              type="text"
              placeholder={waitingForEmail ? "Enter your email address..." : "Type here.."}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || activeInputMessageId !== null}
            />
            <button
              onClick={handleSendMessage}
              disabled={inputValue.trim() === "" || isLoading || activeInputMessageId !== null}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                inputValue.trim() === "" || isLoading || activeInputMessageId !== null
                  ? "bg-yellow-200 text-gray-500"
                  : "bg-yellow-300 text-black hover:bg-yellow-400"
              }`}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 rounded-full bg-yellow-300 px-4 py-2 text-sm font-medium shadow-lg"
        >
          <HelpCircle className="h-5 w-5" />
          <span>Help</span>
        </button>
      )}
    </div>
  )
}

