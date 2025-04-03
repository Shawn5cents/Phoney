import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">AI Call Assistant</h1>
        <p className="text-lg mb-8">
          Forward your calls to an AI assistant with real-time monitoring and control.
        </p>
        
        <Link 
          href="/dashboard" 
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  )
}
