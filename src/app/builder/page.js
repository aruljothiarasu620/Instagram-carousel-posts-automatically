'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Layout from '@/components/Layout';

export default function BuilderPage() {
  const [mediaItems, setMediaItems] = useState([]);
  const [caption, setCaption] = useState('');
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch user's Instagram accounts
  useEffect(() => {
    fetch('/api/instagram/accounts', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.accounts) {
          setInstagramAccounts(data.accounts);
          if (data.accounts.length > 0) {
            setSelectedAccount(data.accounts[0].id);
          }
        } else if (data.error) {
          console.error("Error fetching accounts:", data.error);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Dropzone configuration
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': [],
    },
    onDrop: async (acceptedFiles) => {
      // Upload files to our API
      const formData = new FormData();
      acceptedFiles.forEach(file => formData.append('files', file));

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.media) {
          setMediaItems(prev => [...prev, ...data.media]);
        } else {
          alert(data.error || 'Upload failed. Are you sure Vercel Blob is configured?');
          console.error('Upload Error:', data.error);
        }
      } catch (err) {
        alert('Upload failed: ' + err.message);
        console.error(err);
      }
    },
  });

  // Remove an item
  const removeItem = (id) => {
    setMediaItems(mediaItems.filter(item => item.id !== id));
  };

  // Publish carousel
  const handlePublish = async () => {
    if (!selectedAccount || mediaItems.length === 0 || !caption) {
      alert('Please select an account, add media, and enter a caption.');
      return;
    }

    setIsPublishing(true);
    try {
      // Step 1: Create a carousel post record (draft)
      const createPostRes = await fetch('/api/carousel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagramAccountId: selectedAccount,
          caption,
          mediaIds: mediaItems.map(m => m.id),
        }),
      });
      const { carouselPostId } = await createPostRes.json();

      // Step 2: Create individual media containers
      const createMediaRes = await fetch('/api/instagram/create-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaIds: mediaItems.map(m => m.id),
          instagramAccountId: selectedAccount,
        }),
      });
      const { containerIds } = await createMediaRes.json();

      // Step 3: Create carousel container
      const createCarouselRes = await fetch('/api/instagram/create-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagramAccountId: selectedAccount,
          childrenContainerIds: containerIds,
          caption,
          carouselPostId,
        }),
      });
      const { carouselContainerId } = await createCarouselRes.json();

      // Step 4: Publish
      const publishRes = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagramAccountId: selectedAccount,
          carouselContainerId,
          carouselPostId,
        }),
      });
      const { publishedMediaId } = await publishRes.json();

      alert('Carousel published successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-center h-full min-h-[85vh] p-4 bg-gray-100">
        <div className="bg-white rounded-xl shadow-2xl flex max-w-5xl w-full border border-gray-200 overflow-hidden" style={{ minHeight: '650px' }}>
          
          {/* Left Panel - Logo Section */}
          <div className="hidden md:flex flex-col items-center justify-center p-8 border-r border-gray-100 bg-white w-[350px]">
            <div className="relative mb-6 flex justify-center items-center">
              {/* Fake Notifications Badge */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center z-20 border-2 border-white">
                1
              </div>
              
              {/* Big Purple/Pink Instagram-like Logo */}
              <div className="w-48 h-48 bg-pink-600 rounded-full flex items-center justify-center relative shadow-lg bg-gradient-to-br from-[#c13584] to-[#e1306c]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a5 5 0 015-5h8a5 5 0 015 5v8a5 5 0 01-5 5H8a5 5 0 01-5-5V8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" />
                </svg>
                
                {/* Clock Badge Overlap */}
                <div className="absolute -bottom-2 -left-2 bg-white rounded-full p-1 shadow-md">
                  <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center text-pink-600 border border-pink-200">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center">Instagram for Business (Facebook login)</h2>
            <p className="text-gray-500 text-sm mt-2">Create a carousel post</p>
          </div>

          {/* Right Panel - Form Section */}
          <div className="flex-1 flex flex-col bg-white">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center">
                <span>Instagram for Business (Facebook...</span>
              </h3>
              <div className="flex space-x-4 text-gray-500">
                <button className="hover:text-gray-800">⋮</button>
                <button className="hover:text-gray-800">🗖</button>
                <button className="hover:text-gray-800">?</button>
                <button className="hover:text-gray-800 font-bold">✕</button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
              
              {/* Connection */}
              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <span className="text-gray-400 mr-2 text-lg leading-none flex items-center justify-center h-4">›</span>
                  Connection <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <div className="bg-pink-600 rounded-sm w-5 h-5 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      </div>
                    </div>
                    <select className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none hover:border-purple-400 appearance-none bg-white">
                      <option>My Facebook connection {instagramAccounts.length > 0 ? '(Authorized)' : ''}</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <button className="border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white">Add</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  For more information on how to create a connection to Instagram for Business (Facebook login), see the <a href="#" className="text-purple-600 hover:underline">online Help</a>.
                </p>
              </div>

              {/* Page Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="flex items-center text-sm font-bold text-gray-800">
                    <span className="text-gray-400 mr-2 text-lg leading-none flex items-center justify-center h-4">›</span>
                    Page <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 mr-2">Map</span>
                    <div className="w-7 h-4 bg-gray-200 rounded-full flex items-center px-0.5 cursor-pointer">
                      <div className="w-3 h-3 bg-white rounded-full shadow"></div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <select 
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full border border-purple-400 ring-1 ring-purple-100 rounded-md py-2 px-3 text-sm outline-none appearance-none bg-white font-medium text-gray-700"
                  >
                    <option value="" disabled>Select a page</option>
                    {instagramAccounts.length > 0 ? instagramAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.ig_username ? `@${acc.ig_username}` : 'Instagram Account'}</option>
                    )) : (
                      <option disabled>No accounts connected. Please go back to Dashboard to connect.</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 cursor-pointer hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Instagram Business accounts connected to a Page that requires <a href="#" className="text-purple-600 hover:underline">Page Publishing Authorization (PPA)</a> cannot be published to until PPA has been completed.
                </p>
              </div>

              {/* Files Array */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="flex items-center text-sm font-bold text-gray-800">
                    <span className="text-gray-400 mr-2 text-lg leading-none flex items-center justify-center h-4">›</span>
                    Files <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 mr-2">Map</span>
                    <div className="w-7 h-4 bg-gray-200 rounded-full flex items-center px-0.5 cursor-pointer">
                      <div className="w-3 h-3 bg-white rounded-full shadow"></div>
                    </div>
                  </div>
                </div>

                <div className="ml-3 border-l-[1.5px] border-dotted border-gray-300 pl-4 space-y-4">
                  {mediaItems.map((item, idx) => (
                    <div key={item.id} className="relative">
                      {/* Sub-item Header */}
                      <div className="flex justify-between items-center mb-3">
                        <label className="flex items-center text-sm font-bold text-gray-700">
                          <span className="text-gray-400 mr-2 text-lg leading-none flex items-center justify-center h-4">›</span>
                          Item {idx + 1}
                        </label>
                        <div className="flex space-x-2 text-gray-400">
                           <button className="hover:text-gray-600">⋮⋮</button>
                           <button onClick={() => removeItem(item.id)} className="hover:text-red-500">✕</button>
                        </div>
                      </div>
                      
                      {/* Sub-item content */}
                      <div className="ml-3 border-l-[1.5px] border-dotted border-gray-300 pl-4 space-y-4">
                        {/* Media Type */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="flex items-center text-xs font-bold text-gray-700">
                              <span className="text-gray-400 mr-1 text-sm bg-gray-100 px-1 rounded">›</span>
                              Media Type <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="flex items-center">
                              <span className="text-[10px] text-gray-400 mr-1">Map</span>
                              <div className="w-6 h-3.5 bg-gray-200 rounded-full flex items-center px-0.5 cursor-pointer">
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow"></div>
                              </div>
                            </div>
                          </div>
                          <select disabled className="w-full border border-purple-400 ring-1 ring-purple-100 rounded-md py-1.5 px-3 text-sm outline-none appearance-none bg-white text-gray-700">
                            <option>{item.file_type === 'video' ? 'Video' : 'Image'}</option>
                          </select>
                        </div>
                        
                        {/* Photo URL / File preview */}
                        <div>
                           <label className="flex items-center text-xs font-bold text-gray-700 mb-1">
                              <span className="text-gray-400 mr-1 text-sm bg-gray-100 px-1 rounded">›</span>
                              {item.file_type === 'video' ? 'Video URL' : 'Photo URL'} <span className="text-red-500 ml-1">*</span>
                           </label>
                           <div className="border border-gray-300 rounded p-2 bg-gray-50 flex items-center space-x-3">
                              {item.file_type === 'video' ? (
                                <video src={item.file_url} className="w-12 h-12 rounded object-cover border border-gray-200" />
                              ) : (
                                <div className="w-12 h-12 rounded border border-gray-200 relative overflow-hidden bg-white">
                                   <img src={item.file_url} alt="upload" className="object-cover w-full h-full" />
                                </div>
                              )}
                              <span className="text-xs text-gray-500 truncate flex-1">{item.file_url}</span>
                           </div>
                           
                           {/* Requirements Text */}
                           <div className="text-[11px] text-gray-500 mt-2 space-y-1">
                             <p className="font-bold text-gray-600">Photo Requirements</p>
                             <ul className="list-none ml-1 space-y-0.5">
                               <li>- Maximum file size: 8MiB</li>
                               <li>- Aspect ratio: Must be within a 4:5 to 1.91:1 range</li>
                               <li>- Minimum width: 320</li>
                               <li>- Maximum width: 1440</li>
                               <li>- Format: JPEG only</li>
                             </ul>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Item Trigger */}
                  <div {...getRootProps()} className="flex items-center text-purple-700 hover:text-purple-900 cursor-pointer text-sm font-medium mt-2">
                    <input {...getInputProps()} />
                    <span className="text-lg mr-1 font-light leading-none">+</span> Add item
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <span className="text-gray-400 mr-2 text-lg leading-none flex items-center justify-center h-4">›</span>
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-400"
                  placeholder=""
                />
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  A caption for the photo. You can include hashtags (e.g., <span className="text-pink-500">#crazywildebeest</span>) and usernames of Instagram users (e.g., <span className="text-pink-500">@natgeo</span>). Mentioned Instagram users will receive a notification when you publish the post. Maximum 2200 characters, 30 #hashtags, and 20 @tags.
                </p>
              </div>

            </div>

              {/* Footer Actions */}
             <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-white rounded-br-xl select-none mt-auto">
                <div className="flex space-x-3 items-center">
                   <div 
                     onClick={!isPublishing ? handlePublish : undefined}
                     className={`text-xs text-gray-500 flex items-center gap-2 border border-gray-200 rounded px-2 py-1 bg-gray-50 cursor-pointer hover:bg-gray-100 ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     <span className="text-purple-700">▶</span> {isPublishing ? 'Running...' : 'Run once'} <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                   </div>
                   <div className="text-xs text-gray-500 flex items-center">
                     <div className="w-8 h-4 bg-gray-200 rounded-full mr-2"></div>
                     Every 15 minutes
                   </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button className="text-gray-700 text-sm font-medium hover:text-gray-900 px-2">Cancel</button>
                  <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="bg-[#6b11ff] hover:bg-[#5a0be0] text-white px-8 py-2 rounded-md text-sm font-bold shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isPublishing ? 'Saving...' : 'Save'}
                  </button>
                  <div className="bg-[#6b11ff] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg cursor-help ml-2 shadow-sm">
                    ?
                  </div>
                </div>
             </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

