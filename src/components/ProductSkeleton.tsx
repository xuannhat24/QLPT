import React from 'react';
import { motion } from 'motion/react';

export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-[24px] overflow-hidden border border-slate-100 p-2 flex flex-col h-full animate-pulse shadow-sm shadow-slate-100">
      {/* Target Image Skeleton */}
      <div className="aspect-[4/5] bg-slate-100 rounded-2xl mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      
      <div className="px-4 pb-4 flex flex-col gap-3">
        {/* Category Label Skeleton */}
        <div className="h-3 w-1/3 bg-slate-100 rounded-md" />
        
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-slate-100 rounded-md" />
          <div className="h-5 w-2/3 bg-slate-100 rounded-md" />
        </div>
        
        {/* Price Skeleton */}
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="h-6 w-1/2 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
