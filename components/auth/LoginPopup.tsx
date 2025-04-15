"use client";

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onContinueAsGuest: () => void;
  error?: string | null;
}

export const LoginPopup = ({ isOpen, onClose, onLogin, onContinueAsGuest, error }: LoginPopupProps) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    onLogin(email, password);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="text-gray-600 mb-6">Please login to search products or continue as guest</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="w-full bg-yellow-300 border-2 border-black py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full bg-gray-100 border-2 border-black py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
