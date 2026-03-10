import Layout from '@/components/Layout';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Connect Instagram</h3>
          <p className="text-gray-600 mb-4">
            Connect your Facebook Page and Instagram Business Account to start automating your carousel posts.
          </p>
          <a
            href="/api/instagram/connect"
            className="inline-block bg-[#1877F2] text-white px-6 py-2 rounded-md font-medium hover:bg-[#166FE5] transition-colors"
          >
            Connect with Facebook
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Create a Post</h3>
            <p className="text-gray-600 mb-4">Build and publish a new Instagram carousel.</p>
            <Link
              href="/builder"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Go to Builder
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Recent Posts</h3>
            <p className="text-gray-600">Your recent automation history will appear here.</p>
            {/* Future list of carousel_posts */}
          </div>
        </div>
      </div>
    </Layout>
  );
}
