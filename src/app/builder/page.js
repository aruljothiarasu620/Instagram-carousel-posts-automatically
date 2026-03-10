'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '@/components/SortableItem';
import Layout from '@/components/Layout';

export default function BuilderPage() {
  const [mediaItems, setMediaItems] = useState([]);
  const [caption, setCaption] = useState('');
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch user's Instagram accounts
  useEffect(() => {
    fetch('/api/instagram/accounts')
      .then(res => res.json())
      .then(data => setInstagramAccounts(data.accounts || []))
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

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.media) {
        setMediaItems([...mediaItems, ...data.media]);
      }
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = mediaItems.findIndex(item => item.id === active.id);
      const newIndex = mediaItems.findIndex(item => item.id === over.id);
      setMediaItems(arrayMove(mediaItems, oldIndex, newIndex));
    }
  }

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
      // Optionally redirect to dashboard
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Create Carousel Post</h2>

        {/* Instagram Account Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Instagram Account</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select an account</option>
            {instagramAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.ig_username}</option>
            ))}
          </select>
        </div>

        {/* Upload Area */}
        <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 mb-4 transition-colors">
          <input {...getInputProps()} />
          <p>Drag & drop images/videos here, or click to select</p>
          <p className="text-sm text-gray-500">Max 10 items</p>
        </div>

        {/* Drag and Drop List */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={mediaItems.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 mb-4">
              {mediaItems.map((item) => (
                <SortableItem key={item.id} id={item.id} item={item} onRemove={removeItem} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Caption */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your caption..."
          />
        </div>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isPublishing ? 'Publishing...' : 'Publish Carousel'}
        </button>
      </div>
    </Layout>
  );
}
