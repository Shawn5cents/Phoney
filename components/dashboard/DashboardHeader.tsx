import Link from 'next/link';

export function DashboardHeader() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Phoney</h1>
              <p className="text-xs text-blue-100">AI Phone Assistant</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="font-medium text-white opacity-90 hover:opacity-100">
              Dashboard
            </Link>
            <Link href="/history" className="font-medium text-white opacity-70 hover:opacity-100">
              Call History
            </Link>
            <Link href="/settings" className="font-medium text-white opacity-70 hover:opacity-100">
              Settings
            </Link>
          </nav>
          
          {/* Status indicator */}
          <div className="flex items-center space-x-2 bg-opacity-20 bg-white px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
