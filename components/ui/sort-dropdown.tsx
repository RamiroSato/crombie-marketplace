'use client';

import { useRouter } from 'next/navigation';

interface SortDropdownProps {
  sortOptions: Array<{ value: string, label: string }>;
  currentSort: string;
  baseUrl: string;
  searchParams: Record<string, string>;
}

export default function SortDropdown({ sortOptions, currentSort, baseUrl, searchParams }: SortDropdownProps) {
  const router = useRouter();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Create a new URLSearchParams object from the current search params
    const params = new URLSearchParams();
    
    // Add all current search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'sort' && key !== 'page') {
        params.set(key, value);
      }
    });
    
    // Set the new sort and reset to page 1
    params.set('sort', e.target.value);
    params.set('page', '1');
    
    // Navigate to the new URL
    const newUrl = `${baseUrl}?${params.toString()}`;
    router.push(newUrl);
  };

  return (
    <select
      id="sort"
      name="sort"
      className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      onChange={handleSortChange}
      defaultValue={currentSort}
    >
      {sortOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}