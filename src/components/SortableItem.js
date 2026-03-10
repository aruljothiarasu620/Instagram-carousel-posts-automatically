'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';

export function SortableItem({ id, item, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center bg-white p-2 rounded shadow">
      <button className="cursor-move mr-2 touch-none" {...attributes} {...listeners}>
        ⋮⋮
      </button>
      <div className="w-16 h-16 relative mr-3 bg-gray-100 rounded overflow-hidden">
        {item.file_type === 'video' ? (
          <video src={item.file_url} className="w-full h-full object-cover" controls={false} />
        ) : (
          <Image src={item.file_url} alt="preview" fill className="object-cover" />
        )}
      </div>
      <span className="flex-1 text-sm truncate">{item.file_url.split('/').pop()}</span>
      <button onClick={() => onRemove(id)} className="text-red-500 hover:text-red-700 px-2 font-bold cursor-pointer z-10">
        ✕
      </button>
    </div>
  );
}
