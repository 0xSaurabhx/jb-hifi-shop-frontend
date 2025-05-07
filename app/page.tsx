"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, User, MapPin, BarChart2, ChevronLeft, ChevronRight, X, Mic, Upload, LogOut } from "lucide-react";
import ChatBotV2 from "@/components/chat-botv2";
import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import SearchAnimation from "@/components/animations/SearchAnimation";
import axios from 'axios';
import { LoginPopup } from "@/components/auth/LoginPopup";
import { useAuth } from "@/contexts/AuthContext";

// Add dummy products data
interface Product {
  id: number;
  brand: string;
  name: string;
  rating: number;
  price: string;
  image: string;
  stock: number;
}

interface SearchResponse {
  message?: string;
  results: Product[];
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [personalizedMessage, setPersonalizedMessage] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'text' | 'image' | 'voice'>('text');
  const [imageError, setImageError] = useState<{[key: number]: boolean}>({});
  const [showPersonalized, setShowPersonalized] = useState(true);

  const { user, isAuthenticated, login, loginAsGuest, logout, getUserId, isTemporaryGuest } = useAuth();

  // Make sure to use HTTPS for the API base URL
  const API_BASE_URL = 'https://jb-hifi-search-backend-947132053690.us-central1.run.app';

  const handleLogoClick = () => {
    window.location.reload();
  };

  const handleImageSearch = async (base64Image: string) => {
    setIsSearching(true);
    try {
      const userId = getUserId();
      // Ensure HTTPS in URL
      const url = `${API_BASE_URL}/search/image${userId ? `?user_id=${userId}` : ''}`;
      
      const response = await axios({
        method: 'post',
        url: url,
        data: { image: base64Image },
        headers: {
          'Content-Type': 'application/json',
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });

      if (response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Image search failed:', error);
      // Add error details for debugging
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          message: error.message,
          url: error.config?.url,
          status: error.response?.status
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 5242880, // 5MB
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        try {
          setSearchType('image');
          const base64Image = await convertToBase64(acceptedFiles[0]);
          await handleImageSearch(base64Image);
        } catch (error) {
          console.error('File processing failed:', error);
        }
      }
    },
  });

  const handleMicClick = () => {
    setSearchType('voice');
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported');
        return;
      }

      const recognition = new SpeechRecognition();

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        if (searchInputRef.current) {
          searchInputRef.current.value = transcript;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
    }
  };

  const handleSearch = async (usePersonalized?: boolean) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const personalized = usePersonalized ?? showPersonalized;
      const userId = getUserId();
      const searchUrl = new URL(`${API_BASE_URL}/search/`);
      searchUrl.searchParams.append('q', searchQuery);
      if (personalized && userId) {
        searchUrl.searchParams.append('user_id', userId.toString());
      }

      const response = await axios.get<SearchResponse>(searchUrl.toString());
      setSearchResults(response.data.results);
      setPersonalizedMessage(personalized ? response.data.message || '' : '');
    } catch (error) {
      console.error('Text search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchFocus = () => {
    if (!isAuthenticated && !isTemporaryGuest) {
      setShowLoginPopup(true);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      setShowLoginPopup(false);
      setLoginError(null);
    } catch (error) {
      setLoginError('Login failed. Please check your credentials and try again.');
      console.error('Login error:', error);
    }
  };

  const handleContinueAsGuest = () => {
    loginAsGuest();
    setShowLoginPopup(false);
    if (searchQuery.trim()) {
      handleSearch();
    }
  };

  const handleImageError = (productId: number) => {
    setImageError(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const showPersonalizationDropdown = isAuthenticated && !user?.isGuest;

  const renderProductCard = (product: Product, index: number) => {
    const showTrending = !showPersonalized && index < 2;
    const showTimer = !showPersonalized && product.stock <= 10;
    
    const stockMessage = showTimer ? (
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500 blur-sm opacity-50"></div>
          <div className="relative px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-full border border-white/20 shadow-lg flex items-center gap-2">
            <svg 
              className="w-4 h-4 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>3h left • {product.stock} left</span>
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div 
        key={product.id} 
        className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative"
      >
        {showTrending && (
          <div className="absolute top-4 right-4 z-20">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-sm opacity-50"></div>
              <span className="relative px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-full border border-white/20 shadow-lg flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Trending
              </span>
            </div>
          </div>
        )}
        {stockMessage}
        <div className="relative h-48 bg-gray-100 p-4">
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-yellow-300 text-black px-3 py-1 rounded-md text-sm font-bold border-2 border-black">
              {product.brand}
            </span>
          </div>
          <Image
            src={imageError[product.id] ? '/default-image.png' : product.image}
            width={200}
            height={200}
            alt={product.name}
            onError={() => handleImageError(product.id)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'fill-gray-300'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">({product.rating})</span>
          </div>

          <div className="flex items-baseline mb-4">
            <span className="text-2xl font-black text-black">${product.price}</span>
          </div>

          <button className="w-full bg-yellow-300 border-2 border-black py-2 rounded-lg font-bold hover:bg-yellow-400 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  // Add new state for filters
  const [filters, setFilters] = useState({
    brand: '',
    rating: '',
    price: ''
  });

  // Add filter options
  const filterOptions = {
    price: [
      { label: 'All Prices', value: '' },
      { label: 'Under $100', value: '0-100' },
      { label: '$100 - $200', value: '100-200' },
      { label: 'Over $200', value: '200+' }
    ],
    rating: [
      { label: 'All Ratings', value: '' },
      { label: '4.5 & Up', value: '4.5' },
      { label: '4.0 & Up', value: '4.0' },
      { label: '3.5 & Up', value: '3.5' }
    ]
  };

  // Add filter function
  const getFilteredResults = () => {
    return searchResults.filter(product => {
      const matchBrand = !filters.brand || product.brand === filters.brand;
      const matchRating = !filters.rating || product.rating >= parseFloat(filters.rating);
      const matchPrice = !filters.price || (() => {
        const [min, max] = filters.price.split('-');
        const price = parseFloat(product.price);
        if (max === '+') return price >= parseFloat(min);
        if (min && max) return price >= parseFloat(min) && price <= parseFloat(max);
        return true;
      })();
      
      return matchBrand && matchRating && matchPrice;
    });
  };

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="relative bg-orange-500 px-4 py-2 text-center text-white">
          <p className="text-sm font-medium">
            QLD UPDATE: Click here for latest updates on store trading information
          </p>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <header className="bg-yellow-300 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/" onClick={handleLogoClick} className="flex-shrink-0">
              <div className="relative h-10 w-32">
                <div className="font-black text-2xl">JB HI-FI</div>
                <div className="text-[10px] font-bold uppercase">Always cheap prices</div>
              </div>
            </Link>

            <div className="mx-4 hidden flex-1 md:block">
              <div className="relative rounded-lg bg-white">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search by ${searchType === 'image' ? 'image' : searchType === 'voice' ? 'voice' : 'text'}...`}
                  className={`w-full rounded-md border py-2 px-4 pr-32 text-sm transition-all duration-300 ${
                    isSearching 
                      ? 'border-yellow-400 shadow-[0_0_0_4px_rgba(250,204,21,0.1)]' 
                      : 'border-gray-300'
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={handleSearchFocus}
                  disabled={isSearching}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                  <button
                    onClick={handleMicClick}
                    className={`p-1 rounded-full hover:bg-gray-100 ${
                      isListening || searchType === 'voice' ? 'text-red-500' : ''
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <button className={`p-1 rounded-full hover:bg-gray-100 ${
                      searchType === 'image' ? 'text-blue-500' : ''
                    }`}>
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchType('text');
                      handleSearch();
                    }}
                    disabled={isSearching}
                    className={`flex items-center justify-center px-4 py-1 bg-yellow-300 border border-black rounded-md hover:bg-yellow-400 transition-colors ${
                      isSearching ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                <SearchAnimation isSearching={isSearching} />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <Link href="/track" className="flex flex-col items-center text-xs">
                <BarChart2 className="h-5 w-5" />
                <span>Track order</span>
              </Link>
              <Link href="/stores" className="flex flex-col items-center text-xs">
                <MapPin className="h-5 w-5" />
                <span>Stores</span>
              </Link>
              {isAuthenticated ? (
                <button 
                  onClick={logout}
                  className="flex flex-col items-center text-xs"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{user?.isGuest ? 'Guest' : 'Logout'}</span>
                </button>
              ) : (
                <button 
                  onClick={() => setShowLoginPopup(true)}
                  className="flex flex-col items-center text-xs"
                >
                  <User className="h-5 w-5" />
                  <span>Log in</span>
                </button>
              )}
              <Link href="/dashboard" className="flex flex-col items-center text-xs">
                <ShoppingCart className="h-5 w-5" />
                <span>Orders</span>
              </Link>
            </div>
          </div>
        </header>

        <nav className="bg-black px-4 py-2 text-white">
          <div className="container mx-auto flex overflow-x-auto">
            <Link href="/products" className="whitespace-nowrap px-3 py-1 text-sm font-medium">
              Products
            </Link>
            <Link href="/brands" className="whitespace-nowrap px-3 py-1 text-sm font-medium">
              Brands
            </Link>
            <Link href="/deals" className="whitespace-nowrap px-3 py-1 text-sm font-medium">
              Deals & Catalogues
            </Link>
            <Link href="/clearance" className="whitespace-nowrap px-3 py-1 text-sm font-medium">
              Clearance
            </Link>
            <Link href="/services" className="whitespace-nowrap px-3 py-1 text-sm font-medium">
              Services
            </Link>
            <Link href="/perks" className="whitespace-nowrap px-3 py-1 text-sm font-medium">
              Join JB Perks
            </Link>
            <Link href="/gift-cards" className="whitespace-nowrap px-3 py-1 text-sm font-medium">
              Gift Cards
            </Link>
            <Link href="/news" className="whitespace-nowrap px-3 py-1 text-sm font-medium">
              News & Reviews
            </Link>
          </div>
        </nav>

        <main className="flex-1 bg-yellow-300">
          {searchResults.length > 0 && (
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col gap-4 mb-6">
                <h2 className="text-2xl font-bold">Search Results for &quot;{searchQuery}&quot;</h2>
                
                {personalizedMessage && showPersonalized && (
                  <div className="bg-gradient-to-r from-yellow-300/20 to-yellow-400/20 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                    <div className="flex items-start gap-4 p-4">
                      <div className="mt-1 p-2.5 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-lg border-2 border-black">
                        <svg
                          className="w-5 h-5 text-black"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-black">AI-Powered Results</p>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-300 text-black rounded-full border border-black">
                            SMART SEARCH
                          </span>
                        </div>
                        <p className="text-base text-gray-800">{personalizedMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end items-center gap-3">
                  {/* Brand filter */}
                  <select
                    value={filters.brand}
                    onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                    className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">All Brands</option>
                    {Array.from(new Set(searchResults.map(p => p.brand))).map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>

                  {/* Rating filter */}
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                    className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {filterOptions.rating.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  {/* Price filter */}
                  <select
                    value={filters.price}
                    onChange={(e) => setFilters(prev => ({ ...prev, price: e.target.value }))}
                    className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {filterOptions.price.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  {showPersonalizationDropdown && (
                    <select
                      value={showPersonalized ? 'personalized' : 'general'}
                      onChange={(e) => {
                        const newPers = e.target.value === 'personalized';
                        setShowPersonalized(newPers);
                        handleSearch(newPers);
                      }}
                      className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="general">General Results</option>
                      <option value="personalized">Personalized Results</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getFilteredResults().map((product, index) => renderProductCard(product, index))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && (
            <>
              <div className="container mx-auto px-4 py-6">
                <div className="relative overflow-hidden rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between p-8 md:p-12">
                    <div className="flex flex-col items-center text-center md:items-start md:text-left">
                      <div className="mb-4">
                        <h2 className="text-3xl font-bold md:text-4xl">
                          <span className="font-black">iPad</span>
                          <span className="italic font-light">air</span>
                        </h2>
                        <p className="mt-2 text-lg">
                          Built for <span className="text-purple-500">Apple Intelligence</span>.
                        </p>
                      </div>
                      <p className="mb-4 text-sm">Available 8am 12th March</p>
                      <button className="rounded-full border border-gray-400 bg-white/80 px-6 py-2 text-sm font-medium backdrop-blur-sm">
                        Pre-order
                      </button>
                    </div>
                    <div className="hidden md:block">
                      <Image
                        src="/ipad-white.png"
                        width={500}
                        height={300}
                        alt="iPad Air devices in multiple colors"
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                  
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-2 backdrop-blur-sm">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-2 backdrop-blur-sm">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                      <span
                        key={index}
                        className={`h-2 w-2 rounded-full ${index === 3 ? "bg-black" : "bg-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="container mx-auto px-4 py-6">
                <div className="relative overflow-hidden rounded-lg bg-red-600 py-6 text-center text-white">
                  <h2 className="text-4xl font-black uppercase tracking-wider md:text-6xl">
                    Computer Sellout!
                  </h2>
                  <div className="mt-4">
                    <button className="rounded bg-blue-600 px-4 py-2 text-sm font-bold uppercase">
                      Check out all the deals
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        <div className="fixed w-full bottom-6 right-6 z-50">
          <ChatBotV2/>
        </div>

        <LoginPopup
          isOpen={showLoginPopup}
          onClose={() => setShowLoginPopup(false)}
          onLogin={handleLogin}
          onContinueAsGuest={handleContinueAsGuest}
          error={loginError}
        />
      </div>
    </>
  );
}
