// "use client"
// import type React from "react"
// import { useState, useRef, useEffect } from "react"
// import { HelpCircle, X, Search, ShoppingBag, CheckCircle, XCircle } from "lucide-react"
// import Image from "next/image"
// import axios from "axios"

// // Message type definition
// type Message = {
//   id: string
//   sender: "user" | "bot"
//   text: string
//   timestamp: Date
//   suggestionButtons?: Array<{
//     id: string
//     text: string
//     action: string
//   }>
//   inputField?: {
//     type: "sku" | "link"
//     value: string
//     isActive: boolean
//   }
//   productResults?: Array<{
//     productName: string
//     price: string
//     availability: string
//   }>
// }

// // Backend response type
// type ChatbotResponse = {
//   text: string
//   suggestionButtons?: Array<{
//     text: string
//     action: string
//   }>
// }

// // Product search response type
// type ProductSearchResponse = {
//   text: Array<{
//     productName: string
//     price: string
//     availability: string
//   }>
// }

// type Product = {
//   productName : string, 
//   price : string, 
//   availability : string, 
// }

// export default function ChatBot() {
//   const [isOpen, setIsOpen] = useState(false)
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: "1",
//       sender: "bot",
//       text: "Hi there!\nWelcome to JB Hi-Fi - where you get the best deals always!\n\nHow can we help you today?",
//       timestamp: new Date(),
//     },
//   ])
//   const [inputValue, setInputValue] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const [activeInputMessageId, setActiveInputMessageId] = useState<string | null>(null)
//   const [fieldInputValue, setFieldInputValue] = useState("")
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
//   const [email, setEmail] = useState("not set")

//   // API endpoint for the chatbot backend
//   const CHATBOT_API_ENDPOINT = "https://jb-hifi-image-prod-947132053690.us-central1.run.app/test_message_endpoint" // Replace with your actual endpoint
//   const PRODUCT_SEARCH_ENDPOINT = "https://jb-hifi-image-prod-947132053690.us-central1.run.app/search_product"
//   const PRODUCT_BUY_ENDPOINT = "https://jb-hifi-image-prod-947132053690.us-central1.run.app/buy_product"
//   const PRODUCT_ORDER_CONFIRM_ENDPOINT = "https://jb-hifi-image-prod-947132053690.us-central1.run.app/place_order"


//   // Scroll to bottom of messages when new messages are added
//   useEffect(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
//     }
//   }, [messages])

//   // Function to generate a unique ID
//   const generateId = () => {
//     return Date.now().toString(36) + Math.random().toString(36).substring(2)
//   }

//   const sendMessageButtonToBackend = async (text: string) => {
//     setIsLoading(true)
//     console.log('sent message from button')
//     try {
//       // Send request to backend API
//       console.log(text)

//       if (text.toLowerCase().includes('order_pay')) {
//         const response = await axios.post(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
//           productName : selectedProduct?.productName, 
//           price : selectedProduct?.price, 
//           availability : selectedProduct?.availability, 
//           email : email
//         })

//         if (response.data.text == "pass") {
//           console.log('added data into bigquery')
//         }

//         const botResponse : Message = {
//           id: generateId(), 
//           sender: "bot", 
//           text: "Your order has been placed successfully.", 
//           timestamp : new Date(), 
//         }

//         setMessages((prev) => [...prev, botResponse])
//         return 
//       }

//       if (text.toLowerCase().includes("price match")) {
//         console.log("price match detected")
//         generateWorkflowTemplate(text)
//         return
//       }

//       if (text.toLowerCase().includes('checkout')) {
//         console.log('checkout action detected ')
//         const response = await axios.post(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
//           productName : selectedProduct?.productName, 
//           price : selectedProduct?.price, 
//           availability : selectedProduct?.availability, 
//           email : email
//         })
//         console.log(response.data.text)
//         if (response.data.text === "fail") {
//           const botResponse: Message = {
//             id: generateId(), 
//             sender: "bot", 
//             text: "Oops! You need to log in before placing an order. Please enter your email address.", 
//             timestamp : new Date(), 
//           }
//           setMessages((prev) => [...prev, botResponse])
//         } else {
//           const suggestionButtons = [
//             {
//               text: "Bank Transfer",
//               action: "order_pay",
//             },
//             {
//               text: "Debit Card",
//               action: "order_pay",
//             }
//           ];

//           const botResponse: Message = {
//             id: generateId(),
//             sender: "bot",
//             text: "Great, you have been logged in. How would you like to pay for your order?",
//             timestamp: new Date(),
//             suggestionButtons:  suggestionButtons?.map((btn) => ({
//               id: generateId(),
//               text: btn.text,
//               action: btn.action,
//             })),
//           }
//           setMessages((prev) => [...prev, botResponse])
//         }
//         return 
//       }
      
//       //edits done by samein 
//       const response = await axios.post<ChatbotResponse>(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
//         productName: text,

//         flag: false,
//       })

//       // Process the response from the backend
//       const botResponse: Message = {
//         id: generateId(),
//         sender: "bot",
//         text: response.data.text,
//         timestamp: new Date(),
//         suggestionButtons: response.data.suggestionButtons?.map((btn) => ({
//           id: generateId(),
//           text: btn.text,
//           action: btn.action,
//         })),
//       }

//       setMessages((prev) => [...prev, botResponse])
//     } catch (error) {
//       console.error("Error sending message to backend:", error)

//       // Fallback to dummy responses if the API call fails
//       generateWorkflowTemplate(text)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Function to send message to backend and get response
//   const sendMessageToBackend = async (text: string) => {
//     setIsLoading(true)
//     console.log('sent message to backend')

//     try {
//       // Send request to backend API
//       console.log(text)

//       const gmailRegex = /([a-zA-Z0-9._%+-]+)@gmail\.com/;

//       // Check if the text contains a Gmail address
//       const match = text.match(gmailRegex);
  
//       if (match) {
//         // If a Gmail address is found, extract and log it
//         const gmailAddress = match[0];
//         console.log('Found Gmail address:', gmailAddress);
//         setEmail(gmailAddress)
//         const suggestionButtons = [
//           {
//             text: "Bank Transfer",
//             action: "order_pay",
//           },
//           {
//             text: "Debit Card",
//             action: "order_pay",
//           }
//         ];

//         await axios.post(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
//           productName : selectedProduct?.productName, 
//           price : selectedProduct?.price, 
//           availability : selectedProduct?.availability, 
//           email : email
//         })

        

//         const botResponse: Message = {
//           id: generateId(),
//           sender: "bot",
//           text: "Great, you have been logged in. How would you like to pay for your order?",
//           timestamp: new Date(),
//           suggestionButtons:  suggestionButtons?.map((btn) => ({
//             id: generateId(),
//             text: btn.text,
//             action: btn.action,
//           })),
//         }

//         setMessages((prev) => [...prev, botResponse])
//         return 
//       }

//       if (text.toLowerCase().includes("price match")) {
//         console.log("price match detected")
//         generateWorkflowTemplate(text)
//         return
//       }
//       // add email here 

//       const response = await axios.post<ChatbotResponse>(CHATBOT_API_ENDPOINT, {
//         message: text,
//         messageHistory: messages.map((msg) => ({
//           sender: msg.sender,
//           text: msg.text,
//         })),
//         flag: false,
//       })

//       // Process the response from the backend
//       const botResponse: Message = {
//         id: generateId(),
//         sender: "bot",
//         text: response.data.text,
//         timestamp: new Date(),
//         suggestionButtons: response.data.suggestionButtons?.map((btn) => ({
//           id: generateId(),
//           text: btn.text,
//           action: btn.action,
//         })),
//       }

//       setMessages((prev) => [...prev, botResponse])
//     } catch (error) {
//       console.error("Error sending message to backend:", error)

//       // Fallback to dummy responses if the API call fails
//       generateWorkflowTemplate(text)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Fallback function to provide dummy responses if the API call fails
//   const generateWorkflowTemplate = (text: string) => {
//     let response: Message

//     if (text.toLowerCase().includes("price match")) {
//       response = {
//         id: generateId(),
//         sender: "bot",
//         text: "To process your price match request, please provide: \n✔ SKU Code (or product link) \n✔ Retailer Name \n✔ Competitor’s Price",
//         timestamp: new Date(),
//         suggestionButtons: [
//           { id: generateId(), text: "Provide SKU", action: "provide_sku" },
//           { id: generateId(), text: "Provide link", action: "provide_link" },
//         ],
//       }
//     } else {
//       response = {
//         id: generateId(),
//         sender: "bot",
//         text: "Thanks for your message! How else can I help you today?",
//         timestamp: new Date(),
//         suggestionButtons: [{ id: generateId(), text: "Speak to a human", action: "speak_to_human" }],
//       }
//     }

//     setMessages((prev) => [...prev, response])
//   }

//   // Function to handle sending a message
//   const handleSendMessage = async () => {
//     if (inputValue.trim() === "" || isLoading) return

//     const newMessage: Message = {
//       id: generateId(),
//       sender: "user",
//       text: inputValue.trim(),
//       timestamp: new Date(),
//     }

//     setMessages((prev) => [...prev, newMessage])
//     setInputValue("")

//     await sendMessageToBackend(newMessage.text)
//   }

//   // Function to handle quick action buttons
//   const handleQuickAction = async (action: string) => {
//     let actionText = ""

//     switch (action) {
//       case "price_match":
//         actionText = "I need help with a price match"
//         break
//       case "ask_question":
//         actionText = "I have a question"
//         break
//       default:
//         actionText = action
//     }

//     const newMessage: Message = {
//       id: generateId(),
//       sender: "user",
//       text: actionText,
//       timestamp: new Date(),
//     }

//     setMessages((prev) => [...prev, newMessage])
//     await sendMessageToBackend(actionText)
//   }

//   // Function to handle suggestion button clicks
//   const handleSuggestionClick = async (messageId: string, text: string, action: string) => {
//     // For provide_sku and provide_link actions, transform the current message card
//     if (action === "provide_sku" || action === "provide_link") {
//       setActiveInputMessageId(messageId)
//       setFieldInputValue("")

//       // Update the message to include an input field
//       setMessages((prev) =>
//         prev.map((msg) => {
//           if (msg.id === messageId) {
//             return {
//               ...msg,
//               inputField: {
//                 type: action === "provide_sku" ? "sku" : "link",
//                 value: "",
//                 isActive: true,
//               },
//               // Remove suggestion buttons when input field is active
//               suggestionButtons: [],
//             }
//           }
//           return msg
//         }),
//       )
//     } else {
//       // For other actions, proceed with the normal flow
//       const newMessage: Message = {
//         id: generateId(),
//         sender: "user",
//         text: text,
//         timestamp: new Date(),
//       }

//       setMessages((prev) => [...prev, newMessage])
//       console.log(`the button clicked is `)
//       await sendMessageButtonToBackend(action)
//     }
//   }

//   // Function to handle input field changes in message cards
//   const handleFieldInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFieldInputValue(e.target.value)
//   }

//   // Function to handle buying a product
//   const handleBuyProduct = async (product: { productName: string; price: string; availability: string }) => {
//     setIsLoading(true)

//     setSelectedProduct(product)


//     try {
//       // Send request to buy product
//       const response = await axios.post(PRODUCT_BUY_ENDPOINT, {
//         productName: product.productName,
//         price: product.price, 
//         availability : product.availability
//       })
      
//       console.log(` product purchased ${response}`)
//       // Add a message from the user
//       const userMessage: Message = {
//         id: generateId(),
//         sender: "user",
//         text: `I want to buy: ${product.productName}`,
//         timestamp: new Date(),
//       }

//       // Add a response from the bot
//       const botResponse: Message = {
//         id: generateId(),
//         sender: "bot",
//         text: `Great choice! I've added ${product.productName} to your cart. The price is ${product.price}.\n\nWould you like to continue shopping or proceed to checkout?`,
//         timestamp: new Date(),
//         suggestionButtons: [
//           { id: generateId(), text: "Continue shopping", action: "continue_shopping" },
//           { id: generateId(), text: "Proceed to checkout", action: "checkout" },
//         ],
//       }

//       setMessages((prev) => [...prev, userMessage, botResponse])
//     } catch (error) {
//       console.error("Error buying product:", error)

//       // Add error message
//       const errorMessage: Message = {
//         id: generateId(),
//         sender: "bot",
//         text: "Sorry, there was an error processing your request. Please try again later.",
//         timestamp: new Date(),
//       }

//       setMessages((prev) => [...prev, errorMessage])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Function to submit the input field value and search for products
//   const sendProductSkuOrLink = async (messageId: string, type: "sku" | "link") => {
//     if (fieldInputValue.trim() === "" || isLoading) return

//     setIsLoading(true)

//     try {
//       // Update the message to show the submitted value
//       setMessages((prev) =>
//         prev.map((msg) => {
//           if (msg.id === messageId) {
//             return {
//               ...msg,
//               text: `${msg.text}\n\n${type === "sku" ? "SKU" : "Link"}: ${fieldInputValue}`,
//               inputField: {
//                 ...msg.inputField!,
//                 value: fieldInputValue,
//                 isActive: false,
//               },
//             }
//           }
//           return msg
//         }),
//       )

//       // Reset the active input message
//       setActiveInputMessageId(null)

//       // Send the value to the backend
//       const response = await axios.post<ProductSearchResponse>(PRODUCT_SEARCH_ENDPOINT, {
//         query: fieldInputValue,
//         type: type,
//       })

//       console.log("Product search response:", response.data)

//       // Create a new message with the product results
//       const productResults = response.data.text

//       if (productResults && productResults.length > 0) {
//         const resultsMessage: Message = {
//           id: generateId(),
//           sender: "bot",
//           text: `I found ${productResults.length} product${productResults.length === 1 ? "" : "s"} matching your search:`,
//           timestamp: new Date(),
//           productResults: productResults,
//         }

//         setMessages((prev) => [...prev, resultsMessage])
//       } else {
//         // No products found
//         const noResultsMessage: Message = {
//           id: generateId(),
//           sender: "bot",
//           text: "I couldn't find any products matching your search. Would you like to try a different search term?",
//           timestamp: new Date(),
//           suggestionButtons: [
//             { id: generateId(), text: "Try another SKU", action: "provide_sku" },
//             { id: generateId(), text: "Try another link", action: "provide_link" },
//           ],
//         }

//         setMessages((prev) => [...prev, noResultsMessage])
//       }
//     } catch (error) {
//       console.error("Error searching for products:", error)

//       // Add error message
//       const errorMessage: Message = {
//         id: generateId(),
//         sender: "bot",
//         text: "Sorry, there was an error searching for products. Please try again later.",
//         timestamp: new Date(),
//       }

//       setMessages((prev) => [...prev, errorMessage])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Function to handle key press (Enter to send)
//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault()
//       handleSendMessage()
//     }
//   }

//   // Function to handle key press in field inputs
//   const handleFieldKeyPress = (e: React.KeyboardEvent, messageId: string, type: "sku" | "link") => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault()
//       sendProductSkuOrLink(messageId, type)
//     }
//   }

//   return (
//     <div className="fixed bottom-6 right-6 z-50">
//       {isOpen ? (
//         <div className="flex flex-col rounded-lg bg-white shadow-xl" style={{ width: "350px", height: "500px" }}>
//           {/* Chat Header */}
//           <div className="flex items-center justify-between rounded-t-lg bg-white p-4">
//             <div className="flex items-center gap-2">
//               <div className="relative h-8 w-8">
//                 <div className="absolute h-8 w-8 rounded-full bg-yellow-300">
//                   <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
//                     <Image
//                       src="/jb.png"
//                       width={20}
//                       height={20}
//                       alt="JB Bot"
//                       className="h-full w-full"
//                     />
//                   </div>
//                 </div>
//                 <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-500"></div>
//               </div>
//               <span className="font-medium">JB Chat Bot</span>
//             </div>
//             <button
//               onClick={() => setIsOpen(false)}
//               className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-300"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>

//           {/* Chat Content */}
//           <div className="flex-1 overflow-y-auto bg-yellow-50 p-4">
//             {messages.map((message) => (
//               <div key={message.id} className={`mb-4 flex ${message.sender === "user" ? "justify-end" : ""}`}>
//                 {message.sender === "bot" && (
//                   <div className="mr-2 h-8 w-8">
//                     <div className="h-8 w-8 rounded-full bg-yellow-300">
//                       <div className="relative left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
//                         <Image
//                           src="/jb.png"
//                           width={20}
//                           height={20}
//                           alt="JB Bot"
//                           className="h-full w-full"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 )}
//                 <div
//                   className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
//                     message.sender === "user" ? "bg-yellow-300" : "bg-white"
//                   }`}
//                 >
//                   <p className="whitespace-pre-line text-sm  overflow-hidden">{message.text}</p>

//                   {/* Product Results */}
//                   {message.productResults && message.productResults.length > 0 && (
//                     <div className="mt-4 space-y-3">
//                       {message.productResults.map((product, index) => (
//                         <div key={index} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
//                           <div className="mb-2 font-medium">{product.productName}</div>
//                           <div className="mb-1 text-sm font-bold text-black">{product.price}</div>
//                           <div className="mb-2 flex items-center text-xs">
//                             {product.availability.toLowerCase() === "in stock" ? (
//                               <>
//                                 <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
//                                 <span className="text-green-600">{product.availability}</span>
//                               </>
//                             ) : (
//                               <>
//                                 <XCircle className="mr-1 h-3 w-3 text-red-500" />
//                                 <span className="text-red-600">{product.availability}</span>
//                               </>
//                             )}
//                           </div>
//                           <button
//                             onClick={() => handleBuyProduct(product)}
//                             disabled={product.availability.toLowerCase() !== "in stock"}
//                             className={`flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
//                               product.availability.toLowerCase() === "in stock"
//                                 ? "bg-yellow-300 text-black hover:bg-yellow-400"
//                                 : "bg-gray-200 text-gray-500 cursor-not-allowed"
//                             }`}
//                           >
//                             <ShoppingBag className="mr-1 h-3 w-3" />
//                             {product.availability.toLowerCase() === "in stock" ? "Buy Now" : "Out of Stock"}
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {/* Input field for SKU or Link */}
//                   {message.inputField?.isActive && (
//                     <div className="mt-3">
//                       <div className="mb-2">
//                         <input
//                           type="text"
//                           placeholder={
//                             message.inputField.type === "sku" ? "Enter product SKU..." : "Enter competitor's link..."
//                           }
//                           className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm truncate overflow-hidden"
//                           value={fieldInputValue}
//                           onChange={handleFieldInputChange}
//                           onKeyDown={(e) => handleFieldKeyPress(e, message.id, message.inputField!.type)}
//                           autoFocus
//                         />
//                       </div>
//                       <button
//                         onClick={() => sendProductSkuOrLink(message.id, message.inputField!.type)}
//                         disabled={fieldInputValue.trim() === "" || isLoading}
//                         className={`w-full rounded-md px-3 py-1.5 text-xs font-medium ${
//                           fieldInputValue.trim() === "" || isLoading
//                             ? "bg-yellow-200 text-gray-500"
//                             : "bg-yellow-300 text-black hover:bg-yellow-400"
//                         }`}
//                       >
//                         {message.inputField.type === "sku" ? "Submit SKU" : "Submit Link"}
//                       </button>
//                     </div>
//                   )}

//                   {/* Suggestion Buttons */}
//                   {message.suggestionButtons && message.suggestionButtons.length > 0 && (
//                     <div className="mt-3 flex flex-col gap-2">
//                       {message.suggestionButtons.map((button) => (
//                         <button
//                           key={button.id}
//                           onClick={() => handleSuggestionClick(message.id, button.text, button.action)}
//                           className="w-full  rounded-full border border-yellow-400 bg-yellow-300 px-3 py-1.5 text-xs font-medium text-black hover:bg-yellow-400"
//                         >
//                           {button.text}
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}

//             {/* Loading indicator */}
//             {isLoading && (
//               <div className="mb-4 flex">
//                 <div className="mr-2 h-8 w-8">
//                   <div className="h-8 w-8 rounded-full bg-yellow-300">
//                     <div className="relative left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
//                       <Image
//                         src="/jb.png"
//                         width={20}
//                         height={20}
//                         alt="JB Bot"
//                         className="h-full w-full"
//                       />
//                     </div>
//                   </div>
//                 </div>
//                 <div className="max-w-[80%] rounded-lg bg-white p-3 shadow-sm">
//                   <div className="flex space-x-1">
//                     <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
//                     <div
//                       className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
//                       style={{ animationDelay: "0.2s" }}
//                     ></div>
//                     <div
//                       className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
//                       style={{ animationDelay: "0.4s" }}
//                     ></div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div ref={messagesEndRef} />

//             {/* Quick Actions - only show if there are few messages */}
//             {messages.length <= 2 && !isLoading && (
//               <div className="mt-4 space-y-2">
//                 <button
//                   onClick={() => handleQuickAction("price_match")}
//                   className="flex w-full items-center gap-2 rounded-full border border-yellow-400 bg-yellow-300 px-4 py-2 text-sm font-medium"
//                 >
//                   <Search className="h-4 w-4" />
//                   <span>Request a price match</span>
//                 </button>
//                 <button
//                   onClick={() => handleQuickAction("ask_question")}
//                   className="flex w-full items-center gap-2 rounded-full border border-yellow-400 bg-yellow-300 px-4 py-2 text-sm font-medium"
//                 >
//                   <span className="flex h-4 w-4 items-center justify-center rounded-full border border-black text-xs">
//                     ?
//                   </span>
//                   <span>Ask a question</span>
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Chat Input */}
//           <div className="flex items-center gap-2 border-t p-3">
//             <input
//               type="text"
//               placeholder="Type here.."
//               className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               onKeyDown={handleKeyPress}
//               disabled={isLoading || activeInputMessageId !== null}
//             />
//             <button
//               onClick={handleSendMessage}
//               disabled={inputValue.trim() === "" || isLoading || activeInputMessageId !== null}
//               className={`rounded-md px-4 py-2 text-sm font-medium ${
//                 inputValue.trim() === "" || isLoading || activeInputMessageId !== null
//                   ? "bg-yellow-200 text-gray-500"
//                   : "bg-yellow-300 text-black hover:bg-yellow-400"
//               }`}
//             >
//               Send
//             </button>
//           </div>
//         </div>
//       ) : (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="flex items-center space-x-2 rounded-full bg-yellow-300 px-4 py-2 text-sm font-medium shadow-lg"
//         >
//           <HelpCircle className="h-5 w-5" />
//           <span>Help</span>
//         </button>
//       )}
//     </div>
//   )
// }



/// new code with updated images 

"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { HelpCircle, X, Search, ShoppingBag, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import axios from "axios"

// Message type definition
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
  }>
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
}

// Backend response type
type ChatbotResponse = {
  text: string
  suggestionButtons?: Array<{
    text: string
    action: string
  }>
}

// Product search response type
type ProductSearchResponse = {
  text: Array<{
    productName: string
    price: string
    availability: string
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

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hi there!\nWelcome to JB Hi-Fi - where you get the best deals always!\n\nHow can we help you today?",
      timestamp: new Date(),
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
  } | null>(null)
  const [email, setEmail] = useState("not set")
  const [selectedRecommendations, setSelectedRecommendations] = useState<RecommendedProduct[]>([])

  // Sample recommended products
  const recommendedProducts: RecommendedProduct[] = [
    {
      id: "1",
      name: "Galaxy Buds 4",
      price: "$879",
      priceNumeric: 879,
      retailPrice: "$1008",
      image: "/galaxy_buds.png",
      selected: false,
    },
    {
      id: "2",
      name: "JBL Bluetooth Speaker",
      price: "$1,199",
      priceNumeric: 1199,
      retailPrice: "$1,399",
      image: "/jbl_mini.png",
      selected: false,
    },
    {
      id: "3",
      name: "JBL Tune Buds",
      price: "$49",
      priceNumeric: 49,
      retailPrice: "$79",
      image: "/jbl_mini.png",
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

  // Function to send message to backend and get response
  const sendMessageToBackend = async (text: string) => {
    setIsLoading(true)

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

        const botResponse: Message = {
          id: generateId(),
          sender: "bot",
          text: "Your order has been placed successfully.",
          timestamp: new Date(),
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

      if (text.toLowerCase().includes("price match")) {
        console.log("price match detected")
        generateWorkflowTemplate(text)
        return
      }

      if (text.toLowerCase().includes("checkout")) {
        console.log("checkout action detected")
        const response = await axios.post(PRODUCT_ORDER_CONFIRM_ENDPOINT, {
          productName: selectedProduct?.productName,
          price: selectedProduct?.price,
          availability: selectedProduct?.availability,
          email: email,
        })
        console.log(response.data.text)
        if (response.data.text === "fail") {
          const botResponse: Message = {
            id: generateId(),
            sender: "bot",
            text: "Oops! You need to log in before placing an order. Please enter your email address.",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, botResponse])
        } else {
          // First show recommendations
          const recommendationsMessage: Message = {
            id: generateId(),
            sender: "bot",
            text: "Before we finalize your order, check out these top picks that go perfectly with your purchase!",
            timestamp: new Date(),
            showRecommendations: true,
          }

          setMessages((prev) => [...prev, recommendationsMessage])

          // Then show payment options after a short delay
          setTimeout(() => {
            // Calculate the total price
            const mainProductPrice = selectedProduct
              ? Number.parseFloat(selectedProduct.price.replace(/[^0-9.]/g, ""))
              : 0
            const recommendationsTotal = selectedRecommendations.reduce((sum, p) => sum + p.priceNumeric, 0)
            const totalPrice = mainProductPrice + recommendationsTotal

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
            setMessages((prev) => [...prev, botResponse])
          }, 500)
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
        text: "To process your price match request, please provide: \n✔ SKU Code (or product link) \n✔ Retailer Name \n✔ Competitor's Price",
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

    await sendMessageToBackend(newMessage.text)
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

  // Function to handle buying a product
  const handleBuyProduct = async (product: { productName: string; price: string; availability: string }) => {
    setIsLoading(true)

    setSelectedProduct(product)

    try {
      // Send request to buy product
      const response = await axios.post(PRODUCT_BUY_ENDPOINT, {
        productName: product.productName,
        price: product.price,
        availability: product.availability,
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
        text: `Great choice! I've added ${product.productName} to your cart. The price is ${product.price}.\n\nWould you like to continue shopping or proceed to checkout?`,
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

      // Send the value to the backend
      const response = await axios.post<ProductSearchResponse>(PRODUCT_SEARCH_ENDPOINT, {
        query: fieldInputValue,
        type: type,
      })

      console.log("Product search response:", response.data)

      // Create a new message with the product results
      const productResults = response.data.text

      if (productResults && productResults.length > 0) {
        const resultsMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: `I found ${productResults.length} product${productResults.length === 1 ? "" : "s"} matching your search:`,
          timestamp: new Date(),
          productResults: productResults,
        }

        setMessages((prev) => [...prev, resultsMessage])
      } else {
        // No products found
        const noResultsMessage: Message = {
          id: generateId(),
          sender: "bot",
          text: "I couldn't find any products matching your search. Would you like to try a different search term?",
          timestamp: new Date(),
          suggestionButtons: [
            { id: generateId(), text: "Try another SKU", action: "provide_sku" },
            { id: generateId(), text: "Try another link", action: "provide_link" },
          ],
        }

        setMessages((prev) => [...prev, noResultsMessage])
      }
    } catch (error) {
      console.error("Error searching for products:", error)

      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "Sorry, there was an error searching for products. Please try again later.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Function to handle key press in field inputs
  const handleFieldKeyPress = (e: React.KeyboardEvent, messageId: string, type: "sku" | "link") => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendProductSkuOrLink(messageId, type)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex flex-col rounded-lg bg-white shadow-xl" style={{ width: "450px", height: "600px" }}>
          {/* Chat Header */}
          <div className="flex items-center justify-between rounded-t-lg bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <div className="absolute h-8 w-8 rounded-full bg-yellow-300">
                  <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
                    <Image
                      src="/jb.png"
                      width={20}
                      height={20}
                      alt="JB Bot"
                      className="h-full w-full"
                    />
                  </div>
                </div>
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <span className="font-medium">JB Chat Bot</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto bg-yellow-50 p-4">
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 flex ${message.sender === "user" ? "justify-end" : ""}`}>
                {message.sender === "bot" && (
                  <div className="mr-2 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-yellow-300">
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
                    message.sender === "user" ? "bg-yellow-300" : "bg-white"
                  }`}
                >
                  {message.text && <p className="whitespace-pre-line text-sm overflow-hidden">{message.text}</p>}

                  {/* Show SKU image if specified */}
                  {message.showImage && (
                    <div className="mt-2">
                      <Image
                        src={message.showImage || "/placeholder.svg"}
                        width={300}
                        height={200}
                        alt="SKU location"
                        className="rounded-md"
                      />
                    </div>
                  )}

                  {/* Product Recommendations */}
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
                    </div>
                  )}

                  {/* Order Summary */}
                  {message.orderSummary && (
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

                  {/* Product Results */}
                  {message.productResults && message.productResults.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.productResults.map((product, index) => (
                        <div key={index} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                          <div className="mb-2 font-medium">{product.productName}</div>
                          <div className="mb-1 text-sm font-bold text-black">{product.price}</div>
                          <div className="mb-2 flex items-center text-xs">
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

                  {/* Input field for SKU or Link */}
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

                  {/* Suggestion Buttons */}
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
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="mb-4 flex">
                <div className="mr-2 h-8 w-8">
                  <div className="h-8 w-8 rounded-full bg-yellow-300">
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

            {/* Quick Actions - only show if there are few messages */}
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

          {/* Chat Input */}
          <div className="flex items-center gap-2 border-t p-3">
            <input
              type="text"
              placeholder="Type here.."
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


