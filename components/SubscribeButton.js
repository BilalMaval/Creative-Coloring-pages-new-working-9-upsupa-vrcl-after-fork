'use client';

import { useState } from 'react';
import { Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscribeModal from './SubscribeModal';

export default function SubscribeButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        size="lg"
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-xl md:text-2xl py-6 md:py-8 px-8 md:px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all"
      >
        <Mail className="mr-2 h-6 w-6" />
        Subscribe Now!
        <Sparkles className="ml-2 h-6 w-6" />
      </Button>
      
      <SubscribeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
